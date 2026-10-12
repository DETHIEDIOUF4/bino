const express = require('express');
const {
  getDashboardStats,
  getPendingDrivers,
  verifyDriver,
  getAllUsers,
  suspendUser,
  getAgents,
  createAgent,
  updateAgent,
  listTrips,
  updateTripAdmin,
  deleteTripAdmin,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

const staff = [USER_ROLES.ADMIN, USER_ROLES.AGENT];
const adminOnly = [USER_ROLES.ADMIN];

router.use(protect);

router.get('/drivers/pending', authorize(...staff), getPendingDrivers);
router.patch('/drivers/:id/verify', authorize(...staff), verifyDriver);

router.get('/stats', authorize(...adminOnly), getDashboardStats);
router.get('/users', authorize(...adminOnly), getAllUsers);
router.patch('/users/:id/suspend', authorize(...adminOnly), suspendUser);
router.get('/agents', authorize(...adminOnly), getAgents);
router.post('/agents', authorize(...adminOnly), createAgent);
router.patch('/agents/:id', authorize(...adminOnly), updateAgent);

router.get('/trips', authorize(...adminOnly), listTrips);
router.patch('/trips/:id', authorize(...adminOnly), updateTripAdmin);
router.delete('/trips/:id', authorize(...adminOnly), deleteTripAdmin);

module.exports = router;
