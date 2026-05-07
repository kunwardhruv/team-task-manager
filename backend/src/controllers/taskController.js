const prisma = require('../lib/prisma');

const getUserRole = async (userId, projectId) => {
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  return member?.role || null;
};

// POST /api/tasks — create task (admin only)
exports.createTask = async (req, res) => {
  const { title, description, projectId, assigneeId, dueDate } = req.body;
  if (!title || !projectId) return res.status(400).json({ error: 'Title and projectId required' });

  try {
    const role = await getUserRole(req.user.id, parseInt(projectId));
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId: parseInt(projectId),
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        creatorId: req.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/tasks/:id — update task status/details
exports.updateTask = async (req, res) => {
  const taskId = parseInt(req.params.id);
  const { title, description, status, assigneeId, dueDate } = req.body;

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const role = await getUserRole(req.user.id, task.projectId);
    if (!role) return res.status(403).json({ error: 'Not a project member' });

    // MEMBER can only update status if they are the assignee
    if (role === 'MEMBER' && task.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update tasks assigned to you' });
    }

    const updatedData = {};
    if (status) updatedData.status = status;
    if (role === 'ADMIN') {
      if (title) updatedData.title = title;
      if (description !== undefined) updatedData.description = description;
      if (assigneeId !== undefined) updatedData.assigneeId = assigneeId ? parseInt(assigneeId) : null;
      if (dueDate !== undefined) updatedData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updatedData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/tasks/:id — delete task (admin only)
exports.deleteTask = async (req, res) => {
  const taskId = parseInt(req.params.id);

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const role = await getUserRole(req.user.id, task.projectId);
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

    await prisma.task.delete({ where: { id: taskId } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/tasks/dashboard — stats for logged-in user
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    const [totalProjects, allTasks, myTasks, overdueTasks] = await Promise.all([
      prisma.project.count({ where: { id: { in: projectIds } } }),
      prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        select: { status: true, dueDate: true },
      }),
      prisma.task.count({ where: { assigneeId: userId } }),
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          dueDate: { lt: new Date() },
          status: { not: 'DONE' },
        },
      }),
    ]);

    const statusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    allTasks.forEach((t) => statusCounts[t.status]++);

    res.json({
      totalProjects,
      totalTasks: allTasks.length,
      myTasks,
      overdueTasks,
      statusCounts,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
