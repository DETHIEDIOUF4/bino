const prisma = require('../lib/prisma');

const connectDB = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL manquant. Configurez Neon PostgreSQL dans backend/.env');
    process.exit(1);
  }

  try {
    await prisma.$connect();
    console.log('PostgreSQL (Neon) connecté');
  } catch (error) {
    console.error('Erreur PostgreSQL :', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
