const prisma = require('../lib/prisma');
const {
  TRIP_STATUS,
  BOOKING_STATUS,
  NOTIFICATION_TYPES,
  DRIVER_STATUS,
} = require('../config/constants');
const { haversineKm } = require('../utils/fareCalculator');
const { sendNotification } = require('../services/notificationService');
const { mapRideRequest, mapTrip, mapBooking } = require('../utils/mapApi');

const createRideRequest = async (req, res, next) => {
  try {
    const { departure, arrival, requestedTime, timeFlexibilityMinutes, fareAmount } = req.body;
    const userId = req.user._id || req.user.id;

    const existing = await prisma.rideRequest.findFirst({
      where: { passengerId: userId, status: 'open' },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà une demande ouverte. Attendez qu\'un conducteur accepte ou annulez-la.',
      });
    }

    const request = await prisma.rideRequest.create({
      data: {
        passengerId: userId,
        departure,
        arrival,
        requestedTime: requestedTime ? new Date(requestedTime) : new Date(),
        timeFlexibilityMinutes: timeFlexibilityMinutes ?? 30,
        fareAmount,
      },
      include: {
        passenger: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    res.status(201).json({ success: true, data: mapRideRequest(request) });
  } catch (error) {
    next(error);
  }
};

const getMyRideRequests = async (req, res, next) => {
  try {
    const list = await prisma.rideRequest.findMany({
      where: { passengerId: req.user._id || req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        driver: {
          select: { id: true, firstName: true, lastName: true, phone: true, vehicle: true, rating: true },
        },
        trip: true,
      },
    });

    res.json({ success: true, data: list.map(mapRideRequest) });
  } catch (error) {
    next(error);
  }
};

const cancelRideRequest = async (req, res, next) => {
  try {
    const request = await prisma.rideRequest.findUnique({ where: { id: req.params.id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Demande introuvable' });
    }
    if (request.passengerId !== (req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    if (request.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Demande déjà traitée' });
    }

    const updated = await prisma.rideRequest.update({
      where: { id: request.id },
      data: { status: 'cancelled' },
    });

    res.json({ success: true, data: mapRideRequest(updated) });
  } catch (error) {
    next(error);
  }
};

const listOpenForDrivers = async (req, res, next) => {
  try {
    const requests = await prisma.rideRequest.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
      include: {
        passenger: { select: { id: true, firstName: true, lastName: true, rating: true, phone: true } },
      },
    });

    res.json({ success: true, data: requests.map(mapRideRequest) });
  } catch (error) {
    next(error);
  }
};

const acceptRideRequest = async (req, res, next) => {
  try {
    const request = await prisma.rideRequest.findUnique({
      where: { id: req.params.id },
      include: {
        passenger: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    if (!request || request.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Demande non disponible' });
    }

    if (req.user.driverStatus !== DRIVER_STATUS.APPROVED) {
      return res.status(403).json({
        success: false,
        message: 'Compte conducteur non approuvé',
      });
    }

    const driver = await prisma.user.findUnique({ where: { id: req.user._id || req.user.id } });
    const vehicleSeats = driver.vehicle?.seats || 4;
    const distanceKm =
      Math.round(
        haversineKm(
          request.departure.lat,
          request.departure.lng,
          request.arrival.lat,
          request.arrival.lng
        ) * 100
      ) / 100;

    const depTime = new Date(request.requestedTime);
    const trip = await prisma.trip.create({
      data: {
        driverId: driver.id,
        departure: request.departure,
        arrival: request.arrival,
        departureTime: depTime,
        estimatedArrival: new Date(depTime.getTime() + Math.max(30, distanceKm * 3) * 60000),
        availableSeats: Math.max(1, vehicleSeats - 1),
        maxWaitMinutes: 10,
        distanceKm,
        suggestedFare: request.fareAmount,
        status: TRIP_STATUS.SCHEDULED,
      },
    });

    const booking = await prisma.booking.create({
      data: {
        tripId: trip.id,
        passengerId: request.passengerId,
        pickup: request.departure,
        dropoff: request.arrival,
        requestedTime: request.requestedTime,
        timeFlexibilityMinutes: request.timeFlexibilityMinutes,
        fareAmount: request.fareAmount,
        suggestedFare: request.fareAmount,
        distanceKm,
        status: BOOKING_STATUS.CONFIRMED,
      },
    });

    const updatedTrip = await prisma.trip.update({
      where: { id: trip.id },
      data: { availableSeats: trip.availableSeats - 1 },
    });

    const updatedRequest = await prisma.rideRequest.update({
      where: { id: request.id },
      data: {
        status: 'matched',
        driverId: driver.id,
        tripId: trip.id,
      },
    });

    await sendNotification({
      userId: request.passengerId,
      type: NOTIFICATION_TYPES.DRIVER_FOUND,
      title: 'Conducteur trouvé !',
      message: `${driver.firstName} a accepté votre demande. Le trajet est ouvert aux autres passagers jusqu\'à remplissage.`,
      relatedTrip: trip.id,
      relatedBooking: booking.id,
    });

    res.json({
      success: true,
      data: {
        request: mapRideRequest(updatedRequest),
        trip: mapTrip(updatedTrip),
        booking: mapBooking(booking),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRideRequest,
  getMyRideRequests,
  cancelRideRequest,
  listOpenForDrivers,
  acceptRideRequest,
};
