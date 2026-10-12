const { haversineKm, calculateSuggestedFare } = require('../utils/fareCalculator');

const MATCH_WEIGHTS = {
  departure: 0.35,
  destination: 0.35,
  time: 0.2,
  detour: 0.1,
};

const scoreTripMatch = (trip, search) => {
  if (
    trip.departure?.lat == null ||
    trip.departure?.lng == null ||
    trip.arrival?.lat == null ||
    trip.arrival?.lng == null
  ) {
    return null;
  }

  const depDist = haversineKm(
    search.lat,
    search.lng,
    trip.departure.lat,
    trip.departure.lng
  );
  const arrDist = haversineKm(
    search.destLat,
    search.destLng,
    trip.arrival.lat,
    trip.arrival.lng
  );
  const detourKm = depDist + arrDist;
  const timeDiffMin =
    Math.abs(new Date(trip.departureTime).getTime() - search.searchDate.getTime()) / 60000;
  const flexMin = Number(search.timeFlexibility) || 30;

  const depScore = Math.max(0, 1 - depDist / 5);
  const arrScore = Math.max(0, 1 - arrDist / 5);
  const timeScore = Math.max(0, 1 - timeDiffMin / flexMin);
  const detourScore = Math.max(0, 1 - detourKm / 10);

  const matchPercent = Math.round(
    (depScore * MATCH_WEIGHTS.departure +
      arrScore * MATCH_WEIGHTS.destination +
      timeScore * MATCH_WEIGHTS.time +
      detourScore * MATCH_WEIGHTS.detour) *
      100
  );

  const distanceKm = Number(trip.distanceKm) || depDist + arrDist;
  const suggestedFare = calculateSuggestedFare(distanceKm, detourKm);

  return {
    trip,
    matchScore: detourKm + timeDiffMin / flexMin,
    matchPercent,
    detourKm: Math.round(detourKm * 100) / 100,
    depDistKm: Math.round(depDist * 100) / 100,
    arrDistKm: Math.round(arrDist * 100) / 100,
    timeDiffMin: Math.round(timeDiffMin),
    suggestedFare,
    isGoodMatch: matchPercent >= 60 && depDist < 3 && detourKm < 8,
  };
};

const filterAndRankTrips = (trips, search) =>
  trips
    .map((trip) => scoreTripMatch(trip, search))
    .filter(Boolean)
    .filter((r) => r.depDistKm < 5 && r.detourKm < 12)
    .sort((a, b) => b.matchPercent - a.matchPercent || a.matchScore - b.matchScore);

module.exports = { scoreTripMatch, filterAndRankTrips };
