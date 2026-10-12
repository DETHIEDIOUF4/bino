const express = require('express');
const {
  getMyBookings,
  getBookingById,
  getDriverRequests,
  acceptBooking,
  pickupPassenger,
  confirmPassengerPickup,
  rejectBooking,
} = require('../controllers/bookingController');
const { protect, requireDriver } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/my', getMyBookings);
router.get('/driver/requests', requireDriver, getDriverRequests);
router.get('/:id', getBookingById);
router.patch('/:id/accept', requireDriver, acceptBooking);
router.patch('/:id/pickup', requireDriver, pickupPassenger);
router.patch('/:id/confirm-pickup', confirmPassengerPickup);
router.patch('/:id/reject', requireDriver, rejectBooking);

module.exports = router;
