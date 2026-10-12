const express = require('express');
const { getPublicTrack } = require('../controllers/publicController');

const router = express.Router();

router.get('/track/:bookingId/:token', getPublicTrack);

module.exports = router;
