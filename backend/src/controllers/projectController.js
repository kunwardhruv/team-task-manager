const prisma = require('../lib/prisma');

// Helper: get user's role in a project
const getUserRole = async (userId, projectId) => {
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  return member?.role || null;
};

// GET /api/projects — all projects user is part of
exports.getProjects = async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { members: true, tasks: true } },
            tasks: { select: { status: true } },
          },
        },
      },
    });
    const projects = memberships.map((m) => ({ ...m.project, myRole: m.role }));
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/projects — create project
exports.createProject = async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });

  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, tasks: true } },
      },
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/projects/:id — project detail with members & tasks
exports.getProject = async (req, res) => {
  const projectId = parseInt(req.params.id);
  try {
    const role = await getUserRole(req.user.id, projectId);
    if (!role) return res.status(403).json({ error: 'Not a member of this project' });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ ...project, myRole: role });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/projects/:id — update project (admin only)
exports.updateProject = async (req, res) => {
  const projectId = parseInt(req.params.id);
  const { name, description } = req.body;

  try {
    const role = await getUserRole(req.user.id, projectId);
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { name, description },
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/projects/:id — delete project (admin only)
exports.deleteProject = async (req, res) => {
  const projectId = parseInt(req.params.id);
  try {
    const role = await getUserRole(req.user.id, projectId);
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

    await prisma.project.delete({ where: { id: projectId } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/projects/:id/members — add member by email (admin only)
exports.addMember = async (req, res) => {
  const projectId = parseInt(req.params.id);
  const { email, role = 'MEMBER' } = req.body;

  try {
    const myRole = await getUserRole(req.user.id, projectId);
    if (myRole !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: userToAdd.id, projectId } },
    });
    if (existing) return res.status(400).json({ error: 'User already a member' });

    const member = await prisma.projectMember.create({
      data: { userId: userToAdd.id, projectId, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/projects/:id/members/:userId — remove member (admin only)
exports.removeMember = async (req, res) => {
  const projectId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);

  try {
    const myRole = await getUserRole(req.user.id, projectId);
    if (myRole !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project.ownerId === userId) return res.status(400).json({ error: 'Cannot remove project owner' });

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } },
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
