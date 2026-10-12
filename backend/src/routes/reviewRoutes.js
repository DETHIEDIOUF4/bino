const express = require('express');
const { submitReview, getPendingReviews, completeTrip } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/pending', getPendingReviews);
router.post('/', submitReview);
router.patch('/complete/:id', completeTrip);

module.exports = router;
