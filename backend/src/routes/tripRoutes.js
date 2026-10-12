const express = require('express');
const {
  createTrip,
  getMyTrips,
  searchTrips,
  estimateFare,
  getTripById,
  updateTripStatus,
  bookTrip,
} = require('../controllers/tripController');
const { protect, requireDriver, requireApprovedDriver } = require('../middleware/auth');
const { createTripValidation, bookTripValidation } = require('../validators/authValidators');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/search', searchTrips);
router.get('/fare-estimate', estimateFare);
router.get('/my', protect, requireDriver, getMyTrips);
router.get('/:id', protect, getTripById);
router.post('/', protect, requireDriver, requireApprovedDriver, createTripValidation, validate, createTrip);
router.patch('/:id/status', protect, requireDriver, updateTripStatus);
router.post('/:id/book', protect, bookTripValidation, validate, bookTrip);

module.exports = router;
