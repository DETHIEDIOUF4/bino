const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const {
  DRIVER_STATUS,
  NOTIFICATION_TYPES,
  USER_ROLES,
  TRIP_STATUS,
  BOOKING_STATUS,
} = require('../config/constants');
const { sendNotification } = require('../services/notificationService');
const { haversineKm, calculateSuggestedFare } = require('../utils/fareCalculator');
const { mapUser, mapTrip, stripPassword } = require('../utils/mapApi');

const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalDrivers, pendingDrivers, totalTrips, totalBookings, totalAgents] =
      await Promise.all([
        prisma.user.count({
          where: { role: { notIn: [USER_ROLES.ADMIN, USER_ROLES.AGENT] } },
        }),
        prisma.user.count({ where: { driverStatus: DRIVER_STATUS.APPROVED } }),
        prisma.user.count({ where: { driverStatus: DRIVER_STATUS.PENDING } }),
        prisma.trip.count(),
        prisma.booking.count({ where: { status: 'completed' } }),
        prisma.user.count({ where: { role: USER_ROLES.AGENT, isActive: true } }),
      ]);

    const completedTrips = await prisma.trip.findMany({
      where: { status: 'completed' },
      select: { distanceKm: true },
    });
    const totalKm = completedTrips.reduce((s, t) => s + (t.distanceKm || 0), 0);
    const co2Saved = Math.round(totalKm * 0.18 * 100) / 100;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDrivers,
        pendingDrivers,
        totalTrips,
        totalBookings,
        totalAgents,
        totalKmShared: Math.round(totalKm * 100) / 100,
        co2SavedKg: co2Saved,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getPendingDrivers = async (req, res, next) => {
  try {
    const drivers = await prisma.user.findMany({
      where: { driverStatus: DRIVER_STATUS.PENDING },
      orderBy: { createdAt: 'asc' },
      omit: { password: true },
    });

    res.json({ success: true, data: drivers.map(stripPassword) });
  } catch (error) {
    next(error);
  }
};

const verifyDriver = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const driver = await prisma.user.findUnique({ where: { id: req.params.id } });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    if (driver.driverStatus !== DRIVER_STATUS.PENDING) {
      return res.status(400).json({ success: false, message: 'Ce conducteur n\'est plus en attente' });
    }

    if (![DRIVER_STATUS.APPROVED, DRIVER_STATUS.REJECTED].includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    await prisma.user.update({
      where: { id: driver.id },
      data: {
        driverStatus: status,
        driverRejectionReason: status === DRIVER_STATUS.REJECTED ? rejectionReason : null,
        driverVerifiedById: req.user._id || req.user.id,
        driverVerifiedAt: new Date(),
      },
    });

    await sendNotification({
      userId: driver.id,
      type:
        status === DRIVER_STATUS.APPROVED
          ? NOTIFICATION_TYPES.DRIVER_VERIFIED
          : NOTIFICATION_TYPES.DRIVER_REJECTED,
      title:
        status === DRIVER_STATUS.APPROVED
          ? 'Compte conducteur validé'
          : 'Compte conducteur refusé',
      message:
        status === DRIVER_STATUS.APPROVED
          ? 'Félicitations! Vous pouvez maintenant proposer des trajets.'
          : rejectionReason || 'Votre demande conducteur a été refusée.',
    });

    const populated = await prisma.user.findUnique({
      where: { id: driver.id },
      omit: { password: true },
      include: {
        driverVerifiedBy: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });

    res.json({ success: true, data: mapUser(populated) });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { notIn: [USER_ROLES.ADMIN, USER_ROLES.AGENT] } },
      orderBy: { createdAt: 'desc' },
      omit: { password: true },
      include: {
        driverVerifiedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.json({ success: true, data: users.map(mapUser) });
  } catch (error) {
    next(error);
  }
};

const suspendUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isSuspended: req.body.suspend !== false },
      omit: { password: true },
    });

    res.json({
      success: true,
      message: updated.isSuspended ? 'Compte suspendu' : 'Compte réactivé',
      data: stripPassword(updated),
    });
  } catch (error) {
    next(error);
  }
};

const getAgents = async (req, res, next) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: USER_ROLES.AGENT },
      orderBy: { createdAt: 'desc' },
      omit: { password: true },
    });

    res.json({ success: true, data: agents.map(stripPassword) });
  } catch (error) {
    next(error);
  }
};

const createAgent = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Mot de passe min. 8 caractères' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Courriel déjà utilisé' });
    }

    const agent = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        password: await bcrypt.hash(password, 12),
        role: USER_ROLES.AGENT,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
      omit: { password: true },
    });

    res.status(201).json({ success: true, data: stripPassword(agent) });
  } catch (error) {
    next(error);
  }
};

const updateAgent = async (req, res, next) => {
  try {
    const agent = await prisma.user.findFirst({
      where: { id: req.params.id, role: USER_ROLES.AGENT },
    });
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent introuvable' });
    }

    const data = {};
    if (typeof req.body.isActive === 'boolean') {
      data.isActive = req.body.isActive;
    }

    if (req.body.password) {
      if (req.body.password.length < 8) {
        return res.status(400).json({ success: false, message: 'Mot de passe min. 8 caractères' });
      }
      data.password = await bcrypt.hash(req.body.password, 12);
    }

    const updated = await prisma.user.update({
      where: { id: agent.id },
      data,
      omit: { password: true },
    });

    res.json({
      success: true,
      message: updated.isActive ? 'Agent réactivé' : 'Agent désactivé',
      data: stripPassword(updated),
    });
  } catch (error) {
    next(error);
  }
};

const listTrips = async (req, res, next) => {
  try {
    const { status } = req.query;
    const trips = await prisma.trip.findMany({
      where: status ? { status } : {},
      orderBy: { departureTime: 'desc' },
      take: 200,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            driverStatus: true,
          },
        },
      },
    });

    res.json({ success: true, data: trips.map(mapTrip) });
  } catch (error) {
    next(error);
  }
};

const updateTripAdmin = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trajet introuvable' });
    }

    const {
      departure,
      arrival,
      departureTime,
      estimatedArrival,
      availableSeats,
      maxWaitMinutes,
      status,
      suggestedFare,
    } = req.body;

    const data = {};
    const currentDeparture = trip.departure || {};
    const currentArrival = trip.arrival || {};

    if (departure?.label) {
      data.departure = {
        label: departure.label,
        lat: departure.lat ?? currentDeparture.lat,
        lng: departure.lng ?? currentDeparture.lng,
      };
    }
    if (arrival?.label) {
      data.arrival = {
        label: arrival.label,
        lat: arrival.lat ?? currentArrival.lat,
        lng: arrival.lng ?? currentArrival.lng,
      };
    }
    if (departureTime) data.departureTime = new Date(departureTime);
    if (estimatedArrival) data.estimatedArrival = new Date(estimatedArrival);
    if (availableSeats !== undefined) {
      const seats = Number(availableSeats);
      if (!Number.isInteger(seats) || seats < 0 || seats > 8) {
        return res.status(400).json({ success: false, message: 'Places invalides (0–8)' });
      }
      data.availableSeats = seats;
    }
    if (maxWaitMinutes !== undefined) data.maxWaitMinutes = Number(maxWaitMinutes);
    if (status !== undefined) {
      if (!Object.values(TRIP_STATUS).includes(status)) {
        return res.status(400).json({ success: false, message: 'Statut de trajet invalide' });
      }
      data.status = status;
    }
    if (suggestedFare !== undefined) {
      data.suggestedFare = Number(suggestedFare);
    }

    const dep = data.departure || currentDeparture;
    const arr = data.arrival || currentArrival;
    const distanceKm = haversineKm(dep.lat, dep.lng, arr.lat, arr.lng);
    data.distanceKm = Math.round(distanceKm * 100) / 100;
    if (suggestedFare === undefined && (departure || arrival)) {
      data.suggestedFare = calculateSuggestedFare(distanceKm);
    }

    await prisma.trip.update({ where: { id: trip.id }, data });

    const populated = await prisma.trip.findUnique({
      where: { id: trip.id },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            driverStatus: true,
          },
        },
      },
    });

    res.json({ success: true, data: mapTrip(populated) });
  } catch (error) {
    next(error);
  }
};

const deleteTripAdmin = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trajet introuvable' });
    }

    if (trip.status === TRIP_STATUS.IN_PROGRESS) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un trajet en cours. Annulez-le ou marquez-le terminé d\'abord.',
      });
    }

    await prisma.booking.updateMany({
      where: {
        tripId: trip.id,
        status: {
          in: [
            BOOKING_STATUS.PENDING,
            BOOKING_STATUS.CONFIRMED,
            BOOKING_STATUS.IN_PROGRESS,
          ],
        },
      },
      data: { status: BOOKING_STATUS.CANCELLED },
    });

    await prisma.trip.delete({ where: { id: trip.id } });

    res.json({ success: true, message: 'Trajet supprimé' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
