const express = require('express');
const { getPublicTrack, getCommunityImpact } = require('../controllers/publicController');

const router = express.Router();

router.get('/impact', getCommunityImpact);
router.get('/track/:bookingId/:token', getPublicTrack);

module.exports = router;
