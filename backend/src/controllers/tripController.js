const prisma = require('../lib/prisma');
const { calculateSuggestedFare, haversineKm } = require('../utils/fareCalculator');
const { TRIP_STATUS, BOOKING_STATUS, NOTIFICATION_TYPES } = require('../config/constants');
const { sendNotification } = require('../services/notificationService');
const { filterAndRankTrips } = require('../services/matchingService');
const { mapTrip, mapBooking, DRIVER_TRIP_SELECT } = require('../utils/mapApi');

const createTrip = async (req, res, next) => {
  try {
    const {
      departure,
      arrival,
      departureTime,
      estimatedArrival,
      availableSeats,
      maxWaitMinutes,
      isRecurring,
      recurringDays,
    } = req.body;

    const distanceKm = haversineKm(
      departure.lat,
      departure.lng,
      arrival.lat,
      arrival.lng
    );
    const suggestedFare = calculateSuggestedFare(distanceKm);

    const trip = await prisma.trip.create({
      data: {
        driverId: req.user._id || req.user.id,
        departure,
        arrival,
        departureTime: new Date(departureTime),
        estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : undefined,
        availableSeats,
        maxWaitMinutes,
        isRecurring: isRecurring || false,
        recurringDays: recurringDays || [],
        distanceKm: Math.round(distanceKm * 100) / 100,
        suggestedFare,
      },
    });

    res.status(201).json({ success: true, data: mapTrip(trip) });
  } catch (error) {
    next(error);
  }
};

const getMyTrips = async (req, res, next) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { driverId: req.user._id || req.user.id },
      orderBy: { departureTime: 'desc' },
      include: { driver: { select: DRIVER_TRIP_SELECT } },
    });

    res.json({ success: true, data: trips.map(mapTrip) });
  } catch (error) {
    next(error);
  }
};

const estimateFare = async (req, res, next) => {
  try {
    const { lat, lng, destLat, destLng } = req.query;
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const destLatNum = Number(destLat);
    const destLngNum = Number(destLng);

    if ([latNum, lngNum, destLatNum, destLngNum].some((n) => Number.isNaN(n))) {
      return res.status(400).json({ success: false, message: 'Coordonnées invalides' });
    }

    const distanceKm = Math.round(haversineKm(latNum, lngNum, destLatNum, destLngNum) * 100) / 100;
    const suggestedFare = calculateSuggestedFare(distanceKm);

    res.json({ success: true, data: { distanceKm, suggestedFare } });
  } catch (error) {
    next(error);
  }
};

const searchTrips = async (req, res, next) => {
  try {
    const { lat, lng, destLat, destLng, date, timeFlexibility = 30 } = req.query;

    if (!lat || !lng || !destLat || !destLng) {
      return res.status(400).json({
        success: false,
        message: 'Coordonnées de départ et destination requises',
      });
    }

    const searchDate = date ? new Date(date) : new Date();
    if (Number.isNaN(searchDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Date de recherche invalide',
      });
    }

    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    const latNum = Number(lat);
    const lngNum = Number(lng);
    const destLatNum = Number(destLat);
    const destLngNum = Number(destLng);
    if ([latNum, lngNum, destLatNum, destLngNum].some((n) => Number.isNaN(n))) {
      return res.status(400).json({
        success: false,
        message: 'Coordonnées invalides',
      });
    }

    const trips = await prisma.trip.findMany({
      where: {
        status: { in: [TRIP_STATUS.SCHEDULED, TRIP_STATUS.DRIVER_EN_ROUTE] },
        departureTime: { gte: startOfDay, lte: endOfDay },
        availableSeats: { gte: 1 },
      },
      include: { driver: { select: DRIVER_TRIP_SELECT } },
    });

    const mappedTrips = trips.map(mapTrip);
    const approvedTrips = mappedTrips.filter(
      (t) =>
        t.driver &&
        typeof t.driver === 'object' &&
        t.driver.driverStatus === 'approved' &&
        t.departure?.lat != null &&
        t.arrival?.lat != null
    );

    const flex = Math.max(1, Number(timeFlexibility) || 30);
    const results = filterAndRankTrips(approvedTrips, {
      lat: latNum,
      lng: lngNum,
      destLat: destLatNum,
      destLng: destLngNum,
      searchDate,
      timeFlexibility: flex,
    });

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

const getTripById = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { driver: { select: DRIVER_TRIP_SELECT } },
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trajet introuvable' });
    }

    res.json({ success: true, data: mapTrip(trip) });
  } catch (error) {
    next(error);
  }
};

const updateTripStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trajet introuvable' });
    }

    if (trip.driverId !== (req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const updateData = { status };
    if (status === TRIP_STATUS.IN_PROGRESS) updateData.startedAt = new Date();
    if (status === TRIP_STATUS.COMPLETED) updateData.completedAt = new Date();

    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: updateData,
    });

    const bookings = await prisma.booking.findMany({
      where: { tripId: trip.id, status: BOOKING_STATUS.CONFIRMED },
    });
    const notifType =
      status === TRIP_STATUS.IN_PROGRESS
        ? NOTIFICATION_TYPES.TRIP_STARTED
        : status === TRIP_STATUS.COMPLETED
          ? NOTIFICATION_TYPES.TRIP_ENDED
          : NOTIFICATION_TYPES.CANCELLATION;

    for (const booking of bookings) {
      await sendNotification({
        userId: booking.passengerId,
        type: notifType,
        title: status === TRIP_STATUS.IN_PROGRESS ? 'Trajet commencé' : 'Trajet terminé',
        message:
          status === TRIP_STATUS.IN_PROGRESS
            ? 'Votre conducteur a démarré le trajet.'
            : 'Votre trajet est terminé. Merci d\'avoir voyagé avec AidaFALL!',
        relatedTrip: trip.id,
        relatedBooking: booking.id,
      });
    }

    res.json({ success: true, data: mapTrip(updated) });
  } catch (error) {
    next(error);
  }
};

const bookTrip = async (req, res, next) => {
  try {
    const { pickup, dropoff, requestedTime, timeFlexibilityMinutes, fareAmount } = req.body;
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { driver: true },
    });

    if (!trip || ![TRIP_STATUS.SCHEDULED, TRIP_STATUS.DRIVER_EN_ROUTE].includes(trip.status)) {
      return res.status(400).json({ success: false, message: 'Trajet non disponible' });
    }

    const userId = req.user._id || req.user.id;
    if (trip.driverId === userId) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas réserver votre propre trajet' });
    }

    const userBooking = await prisma.booking.findFirst({
      where: {
        tripId: trip.id,
        passengerId: userId,
        status: {
          in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS],
        },
      },
    });

    if (userBooking) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà une demande sur ce trajet' });
    }

    if (trip.availableSeats <= 0) {
      return res.status(400).json({ success: false, message: 'Ce trajet est complet' });
    }

    const distanceKm = haversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    const suggestedFare = calculateSuggestedFare(distanceKm);

    const booking = await prisma.booking.create({
      data: {
        tripId: trip.id,
        passengerId: userId,
        pickup,
        dropoff,
        requestedTime: new Date(requestedTime),
        timeFlexibilityMinutes,
        fareAmount: fareAmount || suggestedFare,
        suggestedFare,
        distanceKm: Math.round(distanceKm * 100) / 100,
        status: BOOKING_STATUS.PENDING,
      },
    });

    await sendNotification({
      userId: trip.driverId,
      type: NOTIFICATION_TYPES.NEW_REQUEST,
      title: 'Nouvelle demande',
      message: `${req.user.firstName} souhaite rejoindre votre trajet.`,
      relatedTrip: trip.id,
      relatedBooking: booking.id,
    });

    res.status(201).json({ success: true, data: mapBooking(booking) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getMyTrips,
  searchTrips,
  estimateFare,
  getTripById,
  updateTripStatus,
  bookTrip,
};
