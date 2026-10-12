const express = require('express');
const {
  getMunicipalityStats,
  getAllMunicipalities,
  createMunicipality,
  updateMunicipality,
} = require('../controllers/municipalityController');
const { protect, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

router.get('/stats', protect, authorize(USER_ROLES.MUNICIPALITY, USER_ROLES.ADMIN), getMunicipalityStats);
router.get('/stats/:id', protect, authorize(USER_ROLES.ADMIN), getMunicipalityStats);
router.get('/', protect, authorize(USER_ROLES.ADMIN), getAllMunicipalities);
router.post('/', protect, authorize(USER_ROLES.ADMIN), createMunicipality);
router.patch('/:id', protect, authorize(USER_ROLES.ADMIN), updateMunicipality);

module.exports = router;
