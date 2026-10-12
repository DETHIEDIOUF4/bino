const crypto = require('crypto');

const USER_PUBLIC = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  profilePhoto: true,
  role: true,
  driverStatus: true,
  driverLicenseNumber: true,
  driverRejectionReason: true,
  vehicle: true,
  rating: true,
  ratingCount: true,
  tripCount: true,
  isActive: true,
  isSuspended: true,
  driverVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
};

function mapId(obj) {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(mapId);
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;

  const { id, ...rest } = obj;
  const out = { ...rest, _id: id };
  if (id !== undefined) out.id = id;

  for (const key of Object.keys(out)) {
    if (out[key] && typeof out[key] === 'object' && !(out[key] instanceof Date)) {
      out[key] = mapId(out[key]);
    }
  }

  if (out.firstName && out.lastName && !out.fullName) {
    out.fullName = `${out.firstName} ${out.lastName}`;
  }

  return out;
}

function stripPassword(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  return mapId(rest);
}

function newTrackToken() {
  return crypto.randomBytes(12).toString('hex');
}

const DRIVER_TRIP_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  rating: true,
  profilePhoto: true,
  vehicle: true,
  phone: true,
  driverStatus: true,
  email: true,
};

const PASSENGER_BOOKING_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  rating: true,
  profilePhoto: true,
  phone: true,
  email: true,
};

const BOOKING_INCLUDE = {
  passenger: { select: PASSENGER_BOOKING_SELECT },
  trip: {
    include: {
      driver: { select: DRIVER_TRIP_SELECT },
    },
  },
};

function mapTrip(trip) {
  if (trip == null) return trip;
  const { driverId, driver, ...rest } = trip;
  const out = { ...rest };
  if (driver !== undefined) out.driver = stripPassword(driver);
  else if (driverId !== undefined) out.driver = driverId;
  return mapId(out);
}

function mapBooking(booking) {
  if (booking == null) return booking;
  const { tripId, passengerId, trip, passenger, ...rest } = booking;
  const out = { ...rest };
  if (trip !== undefined) out.trip = mapTrip(trip);
  else if (tripId !== undefined) out.trip = tripId;
  if (passenger !== undefined) out.passenger = stripPassword(passenger);
  else if (passengerId !== undefined) out.passenger = passengerId;
  return mapId(out);
}

function mapRideRequest(request) {
  if (request == null) return request;
  const { passengerId, driverId, tripId, passenger, driver, trip, ...rest } = request;
  const out = { ...rest };
  if (passenger !== undefined) out.passenger = stripPassword(passenger);
  else if (passengerId !== undefined) out.passenger = passengerId;
  if (driver !== undefined) out.driver = stripPassword(driver);
  else if (driverId !== undefined) out.driver = driverId;
  if (trip !== undefined) out.trip = mapTrip(trip);
  else if (tripId !== undefined) out.trip = tripId;
  return mapId(out);
}

function mapNotification(notification) {
  if (notification == null) return notification;
  const { userId, relatedTripId, relatedBookingId, ...rest } = notification;
  return mapId({
    ...rest,
    user: userId,
    relatedTrip: relatedTripId,
    relatedBooking: relatedBookingId,
  });
}

function mapPayment(payment) {
  if (payment == null) return payment;
  const { bookingId, passengerId, driverId, ...rest } = payment;
  return mapId({
    ...rest,
    booking: bookingId,
    passenger: passengerId,
    driver: driverId,
  });
}

function mapReview(review) {
  if (review == null) return review;
  const { tripId, bookingId, reviewerId, revieweeId, ...rest } = review;
  return mapId({
    ...rest,
    trip: tripId,
    booking: bookingId,
    reviewer: reviewerId,
    reviewee: revieweeId,
  });
}

function mapUser(user, { verifier } = {}) {
  if (user == null) return user;
  const { driverVerifiedById, driverVerifiedBy, municipalityId, municipality, ...rest } = user;
  const out = stripPassword(rest);
  if (driverVerifiedBy !== undefined) out.driverVerifiedBy = stripPassword(driverVerifiedBy);
  else if (driverVerifiedById !== undefined) out.driverVerifiedBy = driverVerifiedById;
  if (municipality !== undefined) out.municipality = mapId(municipality);
  else if (municipalityId !== undefined) out.municipality = municipalityId;
  return out;
}

module.exports = {
  USER_PUBLIC,
  DRIVER_TRIP_SELECT,
  PASSENGER_BOOKING_SELECT,
  BOOKING_INCLUDE,
  mapId,
  stripPassword,
  newTrackToken,
  mapTrip,
  mapBooking,
  mapRideRequest,
  mapNotification,
  mapPayment,
  mapReview,
  mapUser,
};
