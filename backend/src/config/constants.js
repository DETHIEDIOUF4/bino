module.exports = {
  USER_ROLES: {
    PASSENGER: 'passenger',
    DRIVER: 'driver',
    BOTH: 'both',
    ADMIN: 'admin',
    AGENT: 'agent',
    MUNICIPALITY: 'municipality',
  },

  DRIVER_STATUS: {
    NONE: 'none',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  TRIP_STATUS: {
    SCHEDULED: 'scheduled',
    DRIVER_EN_ROUTE: 'driver_en_route',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  BOOKING_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PICKUP_PENDING: 'pickup_pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  NOTIFICATION_TYPES: {
    NEW_REQUEST: 'new_request',
    DRIVER_FOUND: 'driver_found',
    PASSENGER_FOUND: 'passenger_found',
    CONFIRMATION: 'confirmation',
    REMINDER: 'reminder',
    DRIVER_ARRIVING: 'driver_arriving',
    TRIP_STARTED: 'trip_started',
    TRIP_ENDED: 'trip_ended',
    CANCELLATION: 'cancellation',
    DRIVER_VERIFIED: 'driver_verified',
    DRIVER_REJECTED: 'driver_rejected',
    LOCATION_UPDATE: 'location_update',
    RATING_REQUEST: 'rating_request',
    BOOKING_ACCEPTED: 'booking_accepted',
  },

  FARE: {
    MIN: 4,
    MAX: 9.99,
    CO2_PER_KM: 0.18,
    SAVINGS_RATE: 0.6,
  },
};
