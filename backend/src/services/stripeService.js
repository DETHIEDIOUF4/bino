let stripe = null;

if (process.env.STRIPE_SECRET_KEY) {
  // eslint-disable-next-line global-require
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

const isStripeEnabled = () => Boolean(stripe);

const createPaymentIntent = async ({ amount, bookingId, passengerEmail }) => {
  if (!stripe) return null;

  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'cad',
    automatic_payment_methods: { enabled: true },
    metadata: { bookingId: bookingId.toString() },
    receipt_email: passengerEmail || undefined,
  });
};

const retrievePaymentIntent = async (paymentIntentId) => {
  if (!stripe || !paymentIntentId) return null;
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

module.exports = { isStripeEnabled, createPaymentIntent, retrievePaymentIntent };
