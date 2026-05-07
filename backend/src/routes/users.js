const router = require('express').Router();
const auth = require('../middleware/auth');
const { searchUser } = require('../controllers/userController');

router.use(auth);
router.get('/search', searchUser);

module.exports = router;
