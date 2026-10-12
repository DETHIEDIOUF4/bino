const prisma = require('../lib/prisma');
const { TRIP_STATUS } = require('../config/constants');
const { getIO } = require('../config/io');
const { mapNotification, mapId } = require('../utils/mapApi');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user._id || req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: notifications.map(mapNotification) });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user._id || req.user.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'Notifications marquées comme lues' });
  } catch (error) {
    next(error);
  }
};

const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, speed, heading } = req.body;
    const trip = await prisma.trip.findUnique({ where: { id: req.params.tripId } });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trajet introuvable' });
    }

    if (trip.driverId !== (req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const location = await prisma.tripLocation.create({
      data: {
        tripId: trip.id,
        driverId: req.user._id || req.user.id,
        lat,
        lng,
        speed: speed || 0,
      },
    });

    let status = trip.status;
    if (trip.status === TRIP_STATUS.SCHEDULED && (speed || 0) > 5) {
      await prisma.trip.update({
        where: { id: trip.id },
        data: { status: TRIP_STATUS.IN_PROGRESS, startedAt: new Date() },
      });
      status = TRIP_STATUS.IN_PROGRESS;
    }

    const payload = {
      tripId: trip.id,
      lat,
      lng,
      speed,
      heading,
      status,
      recordedAt: location.recordedAt,
    };

    const io = getIO();
    if (io) io.to(`trip:${trip.id}`).emit('location_update', payload);

    res.json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
};

const getTripTracking = async (req, res, next) => {
  try {
    const locations = await prisma.tripLocation.findMany({
      where: { tripId: req.params.tripId },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    });

    res.json({ success: true, data: locations.reverse().map(mapId) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  updateLocation,
  getTripTracking,
};
