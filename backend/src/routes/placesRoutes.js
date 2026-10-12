const express = require('express');
const { autocomplete, placeDetails } = require('../controllers/placesController');

const router = express.Router();

router.get('/autocomplete', autocomplete);
router.get('/details/:placeId', placeDetails);
router.post('/details/:placeId', placeDetails);

module.exports = router;
