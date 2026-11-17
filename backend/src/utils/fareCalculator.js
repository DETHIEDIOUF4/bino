const { FARE } = require('../config/constants');

const toRad = (deg) => (deg * Math.PI) / 180;

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calculateSuggestedFare = (distanceKm, detourKm = 0) => {
  const base = 4;
  const perKm = 0.35;
  const detourFactor = detourKm * 0.15;
  const raw = base + distanceKm * perKm + detourFactor;
  return Math.min(FARE.MAX, Math.max(FARE.MIN, Math.round(raw * 100) / 100));
};

const calculateCo2Saved = (distanceKm) =>
  Math.round(distanceKm * FARE.CO2_PER_KM * 1000) / 1000;

/** Estimation taxi Québec (prise en charge + $/km) — ordre de grandeur, pas un tarif officiel. */
const estimateTaxiFare = (distanceKm) => {
  const flagDrop = 3.7;
  const perKm = 1.85;
  const raw = flagDrop + Math.max(0, distanceKm) * perKm;
  return Math.round(Math.max(8.5, raw) * 100) / 100;
};

const calculateMoneySaved = (farePaid, taxiEstimate) =>
  Math.round((taxiEstimate - farePaid) * 100) / 100;

/** Points bino provisoires (barème à confirmer avec la propriétaire). */
const calculateGratificationPoints = ({ distanceKm = 0, moneySaved = 0 } = {}) => {
  const fromKm = Math.round(Math.max(0, distanceKm) * 2);
  const fromSavings = moneySaved > 0 ? 5 : 0;
  return fromKm + fromSavings;
};

const tripImpact = (distanceKm, farePaid) => {
  const taxiEstimate = estimateTaxiFare(distanceKm);
  const moneySaved = Math.max(0, calculateMoneySaved(farePaid, taxiEstimate));
  const co2SavedKg = calculateCo2Saved(distanceKm);
  const gratificationPoints = calculateGratificationPoints({ distanceKm, moneySaved });
  return { taxiEstimate, moneySaved, co2SavedKg, gratificationPoints };
};

module.exports = {
  haversineKm,
  calculateSuggestedFare,
  calculateCo2Saved,
  calculateMoneySaved,
  estimateTaxiFare,
  calculateGratificationPoints,
  tripImpact,
};
