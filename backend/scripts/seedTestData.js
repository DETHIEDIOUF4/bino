#!/usr/bin/env node
/**
 * Données de test pour le matching IA.
 * Usage: npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');
const { USER_ROLES, DRIVER_STATUS, TRIP_STATUS } = require('../src/config/constants');
const { haversineKm, calculateSuggestedFare } = require('../src/utils/fareCalculator');

const TEST_PASSWORD = 'Test1234!';

const LOCATIONS = {
  laval: { label: 'Université Laval, Québec', lat: 46.7815, lng: -71.2771 },
  sainteFoy: { label: 'Place de la Cité, Sainte-Foy', lat: 46.7698, lng: -71.2886 },
  garePalais: { label: 'Gare du Palais, Québec', lat: 46.8139, lng: -71.2269 },
  vieuxQuebec: { label: 'Place Royale, Vieux-Québec', lat: 46.8139, lng: -71.2025 },
  rivieres: { label: 'Les Rivières, Québec', lat: 46.813, lng: -71.247 },
  charlesbourg: { label: 'Charlesbourg, Québec', lat: 46.866, lng: -71.256 },
  levis: { label: 'Lévis (centre)', lat: 46.803, lng: -71.178 },
};

const DRIVERS = [
  {
    firstName: 'Marie',
    lastName: 'Tremblay',
    email: 'marie.conducteur@test.aidafall.ca',
    phone: '4185550101',
    rating: 4.8,
    ratingCount: 24,
    vehicle: { brand: 'Toyota', model: 'Corolla', year: 2020, color: 'Blanc', licensePlate: 'ABC123', seats: 4 },
  },
  {
    firstName: 'Jean',
    lastName: 'Gagnon',
    email: 'jean.conducteur@test.aidafall.ca',
    phone: '4185550102',
    rating: 4.6,
    ratingCount: 18,
    vehicle: { brand: 'Honda', model: 'Civic', year: 2019, color: 'Gris', licensePlate: 'DEF456', seats: 4 },
  },
  {
    firstName: 'Sophie',
    lastName: 'Roy',
    email: 'sophie.conducteur@test.aidafall.ca',
    phone: '4185550103',
    rating: 4.9,
    ratingCount: 31,
    vehicle: { brand: 'Mazda', model: 'CX-5', year: 2021, color: 'Bleu', licensePlate: 'GHI789', seats: 4 },
  },
  {
    firstName: 'Pierre',
    lastName: 'Bouchard',
    email: 'pierre.conducteur@test.aidafall.ca',
    phone: '4185550104',
    rating: 4.5,
    ratingCount: 12,
    vehicle: { brand: 'Hyundai', model: 'Elantra', year: 2018, color: 'Noir', licensePlate: 'JKL012', seats: 4 },
  },
];

const PASSENGER = {
  firstName: 'Alex',
  lastName: 'Martin',
  email: 'passager.test@aidafall.ca',
  phone: '4185550200',
};

function tripTime(minutesFromNow) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutesFromNow);
  return d;
}

function buildTrip(driverId, departure, arrival, minutesFromNow, seats = 3) {
  const distanceKm = Math.round(haversineKm(departure.lat, departure.lng, arrival.lat, arrival.lng) * 100) / 100;
  const depTime = tripTime(minutesFromNow);
  const estArrival = new Date(depTime.getTime() + distanceKm * 2.5 * 60000);

  return {
    driverId,
    departure,
    arrival,
    departureTime: depTime,
    estimatedArrival: estArrival,
    availableSeats: seats,
    maxWaitMinutes: 10,
    distanceKm,
    suggestedFare: calculateSuggestedFare(distanceKm),
    status: TRIP_STATUS.SCHEDULED,
  };
}

async function upsertUser(data, role, extra = {}) {
  const hashed = await bcrypt.hash(TEST_PASSWORD, 12);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });

  const payload = {
    ...data,
    role,
    password: hashed,
    isEmailVerified: true,
    isPhoneVerified: true,
    ...extra,
  };

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return prisma.user.create({ data: payload });
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL manquant dans backend/.env');
    process.exit(1);
  }

  console.log('PostgreSQL (Prisma) — insertion des données de test…\n');

  const passenger = await upsertUser(PASSENGER, USER_ROLES.PASSENGER);
  console.log(`✓ Passager : ${passenger.email}`);

  const driverIds = [];
  for (const d of DRIVERS) {
    const { vehicle, rating, ratingCount, ...userData } = d;
    const driver = await upsertUser(userData, USER_ROLES.DRIVER, {
      driverLicenseNumber: `QC-${d.phone.slice(-6)}`,
      driverStatus: DRIVER_STATUS.APPROVED,
      vehicle,
      rating,
      ratingCount,
      tripCount: ratingCount,
    });
    driverIds.push(driver.id);
    console.log(`✓ Conducteur approuvé : ${driver.email}`);
  }

  const testEmails = DRIVERS.map((d) => d.email);
  const testDrivers = await prisma.user.findMany({
    where: { email: { in: testEmails } },
    select: { id: true },
  });
  const ids = testDrivers.map((d) => d.id);

  const deleted = await prisma.trip.deleteMany({ where: { driverId: { in: ids } } });
  console.log(`\n↻ ${deleted.count} ancien(s) trajet(s) de test supprimé(s)`);

  const trips = [
    buildTrip(driverIds[0], LOCATIONS.laval, LOCATIONS.sainteFoy, 20),
    buildTrip(driverIds[0], LOCATIONS.sainteFoy, LOCATIONS.laval, 90, 2),
    buildTrip(driverIds[1], LOCATIONS.sainteFoy, LOCATIONS.garePalais, 35),
    buildTrip(driverIds[1], LOCATIONS.rivieres, LOCATIONS.vieuxQuebec, 55),
    buildTrip(driverIds[2], LOCATIONS.laval, LOCATIONS.garePalais, 45),
    buildTrip(driverIds[2], LOCATIONS.charlesbourg, LOCATIONS.laval, 75),
    buildTrip(driverIds[3], LOCATIONS.sainteFoy, LOCATIONS.levis, 60),
    buildTrip(driverIds[3], LOCATIONS.laval, LOCATIONS.rivieres, 25, 2),
  ];

  await prisma.trip.createMany({ data: trips });
  console.log(`✓ ${trips.length} trajets créés pour aujourd'hui\n`);

  console.log('═══════════════════════════════════════════════════════');
  console.log('  COMPTES DE TEST (mot de passe : Test1234!)');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Passager  → ${PASSENGER.email}`);
  for (const d of DRIVERS) {
    console.log(`  Conducteur → ${d.email}`);
  }
  console.log('\n  TRAJETS POPULAIRES POUR TESTER LE MATCHING :');
  console.log('  • Départ : Université Laval  →  Destination : Sainte-Foy');
  console.log('  • Départ : Sainte-Foy       →  Destination : Gare du Palais');
  console.log('  • Départ : Les Rivières     →  Destination : Vieux-Québec');
  console.log('  • Départ : Université Laval →  Destination : Gare du Palais');
  console.log('\n  Connectez-vous avec le compte passager dans l\'app mobile,');
  console.log('  puis lancez une recherche avec ces adresses.');
  console.log('═══════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('Erreur seed :', err);
  process.exit(1);
});
