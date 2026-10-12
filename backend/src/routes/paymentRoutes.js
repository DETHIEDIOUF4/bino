const express = require('express');
const {
  getPaymentConfig,
  getPaymentStatus,
  createPaymentIntentForBooking,
  confirmPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/config', getPaymentConfig);
router.use(protect);
router.post('/intent', createPaymentIntentForBooking);
router.post('/confirm', confirmPayment);
router.get('/:bookingId', getPaymentStatus);

module.exports = router;
