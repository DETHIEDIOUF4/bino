require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const setupSockets = require('./sockets');
const seedAdmin = require('./utils/seedAdmin');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await seedAdmin();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  setupSockets(io);

  server.listen(PORT, () => {
    console.log(`Serveur AidaFALL démarré sur le port ${PORT}`);
  });
};

start();
