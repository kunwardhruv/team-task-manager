const router = require('express').Router();
const auth = require('../middleware/auth');
const { createTask, updateTask, deleteTask, getDashboard } = require('../controllers/taskController');

router.use(auth);

router.get('/dashboard', getDashboard);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
