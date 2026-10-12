const express = require('express');
const {
  getNotifications,
  markAsRead,
  updateLocation,
  getTripTracking,
} = require('../controllers/notificationController');
const { protect, requireDriver } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.patch('/read', markAsRead);
router.post('/tracking/:tripId/location', requireDriver, updateLocation);
router.get('/tracking/:tripId', getTripTracking);

module.exports = router;
