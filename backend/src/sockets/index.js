const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { stripPassword } = require('../utils/mapApi');
const { setIO: setSocketIO } = require('../config/io');
const { setIO: setNotifIO } = require('../services/notificationService');

const setupSockets = (io) => {
  setSocketIO(io);
  setNotifIO(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentification requise'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return next(new Error('Utilisateur introuvable'));

      socket.userId = user.id;
      socket.user = stripPassword(user);
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    console.log(`Socket connecté : ${socket.userId}`);

    socket.on('join_trip', (tripId) => {
      socket.join(`trip:${tripId}`);
    });

    socket.on('leave_trip', (tripId) => {
      socket.leave(`trip:${tripId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket déconnecté : ${socket.userId}`);
    });
  });
};

module.exports = setupSockets;
