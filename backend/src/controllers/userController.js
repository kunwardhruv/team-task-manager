const prisma = require('../lib/prisma');

// GET /api/users/search?email=xxx — search user by email (for adding to project)
exports.searchUser = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
