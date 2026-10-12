const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tripRoutes = require('./routes/tripRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const municipalityRoutes = require('./routes/municipalityRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const publicRoutes = require('./routes/publicRoutes');
const rideRequestRoutes = require('./routes/rideRequestRoutes');
const placesRoutes = require('./routes/placesRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { getCorsOrigins } = require('./config/envCheck');

const app = express();

const corsOrigins = getCorsOrigins();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!corsOrigins.length) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (corsOrigins.includes(normalized)) return callback(null, true);
      return callback(null, false);
    },
    // Bearer JWT dans Authorization — pas de cookies ; évite conflit avec MOBILE_URL=*
    credentials: false,
  })
);
app.set('trust proxy', 1);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AidaFALL API opérationnelle',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/municipality', municipalityRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/ride-requests', rideRequestRoutes);
app.use('/api/places', placesRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
