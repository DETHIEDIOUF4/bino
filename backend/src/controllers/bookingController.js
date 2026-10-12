const prisma = require('../lib/prisma');
const { BOOKING_STATUS, TRIP_STATUS, NOTIFICATION_TYPES } = require('../config/constants');
const { sendNotification } = require('../services/notificationService');
const { createPaymentIntent, isStripeEnabled, retrievePaymentIntent } = require('../services/stripeService');
const { ensureTrackToken } = require('./publicController');
const { getIO } = require('../config/io');
const { BOOKING_INCLUDE, mapBooking, mapTrip } = require('../utils/mapApi');

const emitBookingStatus = (tripId, payload) => {
  const io = getIO();
  if (io) io.to(`trip:${tripId}`).emit('booking_status', payload);
};

const fetchBooking = (id) =>
  prisma.booking.findUnique({
    where: { id },
    include: BOOKING_INCLUDE,
  });

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { passengerId: req.user._id || req.user.id },
      orderBy: { createdAt: 'desc' },
      include: BOOKING_INCLUDE,
    });

    res.json({ success: true, data: bookings.map(mapBooking) });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await fetchBooking(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' });
    }

    const mapped = mapBooking(booking);
    const userId = req.user._id || req.user.id;
    const isPassenger = mapped.passenger._id === userId;
    const isDriver = mapped.trip.driver._id === userId;

    if (!isPassenger && !isDriver) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const payment = await prisma.payment.findUnique({
      where: { bookingId: booking.id },
    });

    let clientSecret = null;
    if (payment?.status === 'pending' && isStripeEnabled()) {
      if (payment.stripePaymentIntentId) {
        const intent = await retrievePaymentIntent(payment.stripePaymentIntentId);
        clientSecret = intent?.client_secret || null;
      }
    }

    const token = await ensureTrackToken(booking);
    const webBase = process.env.WEB_URL || 'http://localhost:5174';

    res.json({
      success: true,
      data: {
        booking: mapped,
        trackUrl: `${webBase}/suivi/${mapped._id}/${token}`,
        payment: payment
          ? {
              status: payment.status,
              amount: payment.amount,
              stripeEnabled: isStripeEnabled(),
              clientSecret,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDriverRequests = async (req, res, next) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { driverId: req.user._id || req.user.id },
      select: { id: true },
    });
    const tripIds = trips.map((t) => t.id);

    const bookings = await prisma.booking.findMany({
      where: {
        tripId: { in: tripIds },
        status: {
          in: [
            BOOKING_STATUS.PENDING,
            BOOKING_STATUS.CONFIRMED,
            BOOKING_STATUS.PICKUP_PENDING,
            BOOKING_STATUS.IN_PROGRESS,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: BOOKING_INCLUDE,
    });

    res.json({ success: true, data: bookings.map(mapBooking) });
  } catch (error) {
    next(error);
  }
};

const acceptBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        trip: true,
        passenger: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' });
    }

    if (booking.trip.driverId !== (req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      return res.status(400).json({ success: false, message: 'Réservation déjà traitée' });
    }

    const trip = await prisma.trip.findUnique({ where: { id: booking.tripId } });
    if (!trip || trip.availableSeats < 1) {
      return res.status(400).json({ success: false, message: 'Plus de places disponibles sur ce trajet' });
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BOOKING_STATUS.CONFIRMED },
    });

    const tripUpdate = {
      availableSeats: trip.availableSeats - 1,
      ...(trip.status === TRIP_STATUS.SCHEDULED ? { status: TRIP_STATUS.DRIVER_EN_ROUTE } : {}),
    };
    const updatedTrip = await prisma.trip.update({
      where: { id: trip.id },
      data: tripUpdate,
    });

    const driver = await prisma.user.findUnique({
      where: { id: req.user._id || req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        vehicle: true,
        rating: true,
      },
    });

    let payment = await prisma.payment.findUnique({ where: { bookingId: booking.id } });
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          passengerId: booking.passengerId,
          driverId: req.user._id || req.user.id,
          amount: booking.fareAmount,
          status: 'pending',
        },
      });
    }

    let clientSecret = null;
    if (isStripeEnabled()) {
      const intent = await createPaymentIntent({
        amount: booking.fareAmount,
        bookingId: booking.id,
        passengerEmail: booking.passenger.email,
      });
      if (intent) {
        payment = await prisma.payment.update({
          where: { id: payment.id },
          data: { stripePaymentIntentId: intent.id },
        });
        clientSecret = intent.client_secret;
      }
    }

    const notificationData = {
      tripId: trip.id,
      bookingId: booking.id,
      driverName: `${driver.firstName} ${driver.lastName}`,
      driverPhone: driver.phone,
      pickup: booking.pickup,
      dropoff: booking.dropoff,
      requestedTime: booking.requestedTime,
      fareAmount: booking.fareAmount,
      tripStatus: updatedTrip.status,
    };

    await sendNotification({
      userId: booking.passengerId,
      type: NOTIFICATION_TYPES.BOOKING_ACCEPTED,
      title: 'Demande acceptée !',
      message: `${driver.firstName} a accepté votre demande. Il est en route vers vous.`,
      data: notificationData,
      relatedTrip: trip.id,
      relatedBooking: booking.id,
    });

    emitBookingStatus(trip.id, {
      bookingId: booking.id,
      status: BOOKING_STATUS.CONFIRMED,
      tripStatus: updatedTrip.status,
      pickup: booking.pickup,
      dropoff: booking.dropoff,
    });

    const fullBooking = await fetchBooking(booking.id);

    res.json({
      success: true,
      data: {
        booking: mapBooking(fullBooking),
        trip: mapTrip(updatedTrip),
        payment: {
          status: payment.status,
          amount: payment.amount,
          stripeEnabled: isStripeEnabled(),
          clientSecret,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const pickupPassenger = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        trip: true,
        passenger: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' });
    }

    if (booking.trip.driverId !== (req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      return res.status(400).json({ success: false, message: 'Le passager doit être confirmé avant la prise en charge' });
    }

    const driverMarkedPickupAt = new Date();
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BOOKING_STATUS.PICKUP_PENDING,
        driverMarkedPickupAt,
      },
    });

    let trip = booking.trip;
    if (trip.status === TRIP_STATUS.SCHEDULED) {
      trip = await prisma.trip.update({
        where: { id: trip.id },
        data: { status: TRIP_STATUS.DRIVER_EN_ROUTE },
      });
    }

    await sendNotification({
      userId: booking.passengerId,
      type: NOTIFICATION_TYPES.DRIVER_ARRIVING,
      title: 'Prise en charge',
      message: `${req.user.firstName} indique vous avoir récupéré. Confirmez sur l\'app ou le web pour démarrer le trajet.`,
      data: {
        tripId: trip.id,
        bookingId: booking.id,
        tripStatus: trip.status,
      },
      relatedTrip: trip.id,
      relatedBooking: booking.id,
    });

    emitBookingStatus(trip.id, {
      bookingId: booking.id,
      status: BOOKING_STATUS.PICKUP_PENDING,
      tripStatus: trip.status,
      driverMarkedPickupAt,
      pickup: booking.pickup,
      dropoff: booking.dropoff,
    });

    const fullBooking = await fetchBooking(booking.id);

    res.json({ success: true, data: { booking: mapBooking(fullBooking), trip: mapTrip(trip) } });
  } catch (error) {
    next(error);
  }
};

const confirmPassengerPickup = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        trip: true,
        passenger: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' });
    }

    if (booking.passengerId !== (req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    if (booking.status !== BOOKING_STATUS.PICKUP_PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Aucune prise en charge en attente de votre confirmation',
      });
    }

    const pickedUpAt = booking.pickedUpAt || new Date();
    const passengerConfirmedPickupAt = new Date();
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BOOKING_STATUS.IN_PROGRESS,
        passengerConfirmedPickupAt,
        pickedUpAt,
      },
    });

    const trip = await prisma.trip.update({
      where: { id: booking.tripId },
      data: {
        status: TRIP_STATUS.IN_PROGRESS,
        startedAt: booking.trip.startedAt || new Date(),
      },
    });

    await sendNotification({
      userId: booking.trip.driverId,
      type: NOTIFICATION_TYPES.TRIP_STARTED,
      title: 'Prise en charge confirmée',
      message: `${booking.passenger.firstName} confirme être à bord. Trajet en cours.`,
      relatedTrip: trip.id,
      relatedBooking: booking.id,
    });

    emitBookingStatus(trip.id, {
      bookingId: booking.id,
      status: BOOKING_STATUS.IN_PROGRESS,
      tripStatus: trip.status,
      pickedUpAt,
      passengerConfirmedPickupAt,
    });

    const fullBooking = await fetchBooking(booking.id);
    res.json({ success: true, data: { booking: mapBooking(fullBooking), trip: mapTrip(trip) } });
  } catch (error) {
    next(error);
  }
};

const rejectBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { trip: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' });
    }

    if (booking.trip.driverId !== (req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const wasConfirmed = booking.status === BOOKING_STATUS.CONFIRMED;
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BOOKING_STATUS.CANCELLED },
    });

    if (wasConfirmed) {
      const trip = await prisma.trip.findUnique({ where: { id: booking.tripId } });
      let newStatus = trip.status;
      const availableSeats = trip.availableSeats + 1;
      if (availableSeats > 0 && trip.status === TRIP_STATUS.DRIVER_EN_ROUTE) {
        const active = await prisma.booking.count({
          where: {
            tripId: trip.id,
            status: { in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS] },
          },
        });
        if (active === 0) newStatus = TRIP_STATUS.SCHEDULED;
      }
      await prisma.trip.update({
        where: { id: trip.id },
        data: { availableSeats, status: newStatus },
      });
    }

    await sendNotification({
      userId: booking.passengerId,
      type: NOTIFICATION_TYPES.CANCELLATION,
      title: 'Demande refusée',
      message: 'Le conducteur n\'a pas pu accepter votre demande.',
      relatedBooking: booking.id,
    });

    res.json({ success: true, data: mapBooking(updatedBooking) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyBookings,
  getBookingById,
  getDriverRequests,
  acceptBooking,
  pickupPassenger,
  confirmPassengerPickup,
  rejectBooking,
};
