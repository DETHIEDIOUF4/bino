const prisma = require('../lib/prisma');
const { mapPayment } = require('../utils/mapApi');
const {
  isStripeEnabled,
  createPaymentIntent,
  retrievePaymentIntent,
} = require('../services/stripeService');

const platformPaymentsActive = () =>
  isStripeEnabled() && process.env.PLATFORM_PAYMENTS !== 'false';

const getPaymentConfig = async (req, res) => {
  res.json({
    success: true,
    data: {
      stripeEnabled: isStripeEnabled(),
      platformPaymentsEnabled: platformPaymentsActive(),
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
      currency: 'CAD',
    },
  });
};

const getPaymentStatus = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { bookingId: req.params.bookingId },
    });
    if (!payment) {
      return res.json({
        success: true,
        data: { status: 'not_found', stripeEnabled: isStripeEnabled() },
      });
    }

    res.json({
      success: true,
      data: {
        status: payment.status,
        amount: payment.amount,
        stripeEnabled: isStripeEnabled(),
        stripePaymentIntentId: payment.stripePaymentIntentId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createPaymentIntentForBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        passenger: { select: { id: true, email: true } },
        trip: { select: { driverId: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' });
    }

    if (booking.passengerId !== (req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    if (!platformPaymentsActive()) {
      return res.status(501).json({
        success: false,
        message: 'Paiement plateforme désactivé. Réglez la contribution directement au conducteur.',
        stripeEnabled: isStripeEnabled(),
        platformPaymentsEnabled: false,
      });
    }

    let payment = await prisma.payment.findUnique({ where: { bookingId } });
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          bookingId,
          passengerId: booking.passengerId,
          driverId: booking.trip.driverId,
          amount: booking.fareAmount,
          status: 'pending',
        },
      });
    }

    const intent = await createPaymentIntent({
      amount: booking.fareAmount,
      bookingId,
      passengerEmail: booking.passenger.email,
    });

    payment = await prisma.payment.update({
      where: { id: payment.id },
      data: { stripePaymentIntentId: intent.id },
    });

    res.json({
      success: true,
      data: {
        clientSecret: intent.client_secret,
        amount: payment.amount,
        stripeEnabled: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

const confirmPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const payment = await prisma.payment.findUnique({ where: { bookingId } });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Paiement introuvable' });
    }

    if (payment.passengerId !== (req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    if (!isStripeEnabled()) {
      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'completed' },
      });
      return res.json({ success: true, data: mapPayment(updated), simulated: true });
    }

    const intent = await retrievePaymentIntent(payment.stripePaymentIntentId);
    if (!intent || intent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Le paiement n\'est pas encore confirmé',
        stripeStatus: intent?.status,
      });
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' },
    });

    res.json({ success: true, data: mapPayment(updated) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPaymentConfig,
  getPaymentStatus,
  createPaymentIntentForBooking,
  confirmPayment,
};
