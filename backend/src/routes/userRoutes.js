const express = require('express');
const { getMe, updateProfile, getStats } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/me', getMe);
router.patch('/me', updateProfile);
router.get('/me/stats', getStats);

module.exports = router;
