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

const calculateMoneySaved = (farePaid, taxiEstimate) =>
  Math.round((taxiEstimate - farePaid) * 100) / 100;

module.exports = {
  haversineKm,
  calculateSuggestedFare,
  calculateCo2Saved,
  calculateMoneySaved,
};
