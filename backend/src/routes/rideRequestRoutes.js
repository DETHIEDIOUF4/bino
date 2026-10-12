const express = require('express');
const {
  createRideRequest,
  getMyRideRequests,
  cancelRideRequest,
  listOpenForDrivers,
  acceptRideRequest,
} = require('../controllers/rideRequestController');
const { protect, requireDriver } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createRideRequest);
router.get('/my', getMyRideRequests);
router.patch('/:id/cancel', cancelRideRequest);
router.get('/open', requireDriver, listOpenForDrivers);
router.patch('/:id/accept', requireDriver, acceptRideRequest);

module.exports = router;
