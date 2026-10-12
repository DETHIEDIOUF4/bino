const prisma = require('../lib/prisma');
const { BOOKING_STATUS, NOTIFICATION_TYPES } = require('../config/constants');
const { sendNotification } = require('../services/notificationService');
const { mapBooking, mapReview } = require('../utils/mapApi');

const submitReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const userId = req.user._id || req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true },
    });
    if (!booking || booking.status !== BOOKING_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Seuls les trajets terminés peuvent être évalués',
      });
    }

    const isPassenger = booking.passengerId === userId;
    const isDriver = booking.trip.driverId === userId;

    if (!isPassenger && !isDriver) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const revieweeId = isPassenger ? booking.trip.driverId : booking.passengerId;
    const role = isPassenger ? 'passenger' : 'driver';

    const existing = await prisma.review.findFirst({
      where: { bookingId, reviewerId: userId },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà évalué ce trajet' });
    }

    const review = await prisma.review.create({
      data: {
        tripId: booking.tripId,
        bookingId,
        reviewerId: userId,
        revieweeId,
        rating,
        comment,
        role,
      },
    });

    const agg = await prisma.review.aggregate({
      where: { revieweeId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.user.update({
      where: { id: revieweeId },
      data: {
        rating: Math.round((agg._avg.rating || 0) * 10) / 10,
        ratingCount: agg._count.rating,
      },
    });

    res.status(201).json({ success: true, data: mapReview(review) });
  } catch (error) {
    next(error);
  }
};

const getPendingReviews = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    const completed = await prisma.booking.findMany({
      where: { passengerId: userId, status: BOOKING_STATUS.COMPLETED },
      include: { trip: true },
    });

    const reviewed = await prisma.review.findMany({
      where: { reviewerId: userId },
      select: { bookingId: true },
    });
    const reviewedIds = new Set(reviewed.map((r) => r.bookingId));

    const pending = completed.filter((b) => !reviewedIds.has(b.id)).map(mapBooking);

    res.json({ success: true, data: pending });
  } catch (error) {
    next(error);
  }
};

const completeTrip = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { trip: true },
    });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' });
    }

    const userId = req.user._id || req.user.id;
    if (booking.trip.driverId !== userId) {
      return res.status(403).json({ success: false, message: 'Seul le conducteur peut terminer le trajet' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BOOKING_STATUS.COMPLETED },
    });

    await prisma.trip.update({
      where: { id: booking.tripId },
      data: { status: 'completed', completedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { tripCount: { increment: 1 } },
    });
    await prisma.user.update({
      where: { id: booking.passengerId },
      data: { tripCount: { increment: 1 } },
    });

    for (const notifyUserId of [booking.passengerId, userId]) {
      await sendNotification({
        userId: notifyUserId,
        type: NOTIFICATION_TYPES.RATING_REQUEST,
        title: 'Évaluez votre trajet',
        message: 'Comment s\'est passé votre covoiturage? Laissez une note.',
        relatedTrip: booking.tripId,
        relatedBooking: booking.id,
      });
    }

    res.json({ success: true, data: mapBooking(updatedBooking) });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitReview, getPendingReviews, completeTrip };
