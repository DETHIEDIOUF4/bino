const prisma = require('../lib/prisma');
const { stripPassword } = require('../utils/mapApi');
const { DRIVER_STATUS } = require('../config/constants');

const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { USER_ROLES } = require('../config/constants');
    const userId = req.user._id || req.user.id;
    const data = {};

    if (req.body.becomeDriver) {
      const { driverLicenseNumber, vehicle } = req.body;

      if (!driverLicenseNumber?.trim()) {
        return res.status(400).json({ success: false, message: 'Numéro de permis requis' });
      }
      if (!vehicle?.brand || !vehicle?.model || !vehicle?.licensePlate) {
        return res.status(400).json({
          success: false,
          message: 'Informations du véhicule incomplètes (marque, modèle, plaque)',
        });
      }

      data.driverLicenseNumber = driverLicenseNumber.trim();
      data.vehicle = vehicle;

      if (req.user.role === USER_ROLES.PASSENGER) {
        data.role = USER_ROLES.BOTH;
      } else if (req.user.role !== USER_ROLES.DRIVER && req.user.role !== USER_ROLES.BOTH) {
        return res.status(400).json({
          success: false,
          message: 'Seuls les passagers peuvent devenir conducteur via l\'app',
        });
      }

      if ([DRIVER_STATUS.NONE, DRIVER_STATUS.REJECTED].includes(req.user.driverStatus)) {
        data.driverStatus = DRIVER_STATUS.PENDING;
        data.driverRejectionReason = null;
      }
    }

    const allowed = [
      'firstName',
      'lastName',
      'phone',
      'profilePhoto',
      'fcmToken',
      'vehicle',
      'driverLicenseNumber',
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined && !req.body.becomeDriver) {
        data[field] = req.body[field];
      }
    });

    if (req.body.role && !req.body.becomeDriver) {
      const newRole = req.body.role;
      if ([USER_ROLES.PASSENGER, USER_ROLES.DRIVER, USER_ROLES.BOTH].includes(newRole)) {
        data.role = newRole;
        if (
          (newRole === USER_ROLES.DRIVER || newRole === USER_ROLES.BOTH) &&
          req.user.driverStatus === DRIVER_STATUS.NONE
        ) {
          data.driverStatus = DRIVER_STATUS.PENDING;
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    res.json({ success: true, data: stripPassword(updated) });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const isDriver =
      req.user.role === 'driver' || req.user.role === 'both' || req.user.role === 'admin';

    const [tripsAsDriver, bookingsAsPassenger, completedBookings] = await Promise.all([
      isDriver
        ? prisma.trip.count({ where: { driverId: userId, status: 'completed' } })
        : 0,
      prisma.booking.count({ where: { passengerId: userId } }),
      prisma.booking.findMany({
        where: { passengerId: userId, status: 'completed' },
        select: { fareAmount: true, distanceKm: true },
      }),
    ]);

    const totalSpent = completedBookings.reduce((sum, b) => sum + (b.fareAmount || 0), 0);
    const totalDistance = completedBookings.reduce((sum, b) => sum + (b.distanceKm || 0), 0);
    const co2Saved = Math.round(totalDistance * 0.18 * 1000) / 1000;
    const moneySaved = Math.round(totalSpent * 0.6 * 100) / 100;

    res.json({
      success: true,
      data: {
        tripCount: req.user.tripCount,
        tripsAsDriver,
        bookingsAsPassenger,
        totalSpent,
        totalDistance,
        co2SavedKg: co2Saved,
        moneySaved,
        rating: req.user.rating,
        ratingCount: req.user.ratingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMe, updateProfile, getStats };
