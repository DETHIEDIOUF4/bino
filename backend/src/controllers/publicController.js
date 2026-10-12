const prisma = require('../lib/prisma');
const { BOOKING_STATUS, TRIP_STATUS } = require('../config/constants');
const { mapBooking, mapTrip, newTrackToken } = require('../utils/mapApi');

const buildTimeline = (booking, trip) => {
  const steps = [
    { id: 'requested', label: 'Demande envoyée', done: true, at: booking.createdAt },
    {
      id: 'confirmed',
      label: 'Conducteur confirmé',
      done: [
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.PICKUP_PENDING,
        BOOKING_STATUS.IN_PROGRESS,
        BOOKING_STATUS.COMPLETED,
      ].includes(booking.status),
      at: booking.status !== BOOKING_STATUS.PENDING ? booking.updatedAt : null,
    },
    {
      id: 'en_route',
      label: 'Conducteur en route',
      done:
        trip.status === TRIP_STATUS.DRIVER_EN_ROUTE ||
        trip.status === TRIP_STATUS.IN_PROGRESS ||
        trip.status === TRIP_STATUS.COMPLETED,
      at: null,
    },
    {
      id: 'pickup_driver',
      label: 'Prise en charge (conducteur)',
      done: [
        BOOKING_STATUS.PICKUP_PENDING,
        BOOKING_STATUS.IN_PROGRESS,
        BOOKING_STATUS.COMPLETED,
      ].includes(booking.status),
      at: booking.driverMarkedPickupAt,
    },
    {
      id: 'pickup',
      label: 'Confirmé par le passager',
      done: booking.status === BOOKING_STATUS.IN_PROGRESS || booking.status === BOOKING_STATUS.COMPLETED,
      at: booking.passengerConfirmedPickupAt || booking.pickedUpAt,
    },
    {
      id: 'completed',
      label: 'Trajet terminé',
      done: booking.status === BOOKING_STATUS.COMPLETED,
      at: trip.completedAt,
    },
  ];

  if (booking.status === BOOKING_STATUS.CANCELLED) {
    return [
      { id: 'cancelled', label: 'Demande annulée', done: true, at: booking.updatedAt, error: true },
    ];
  }

  return steps;
};

const ensureTrackToken = async (booking) => {
  if (!booking.publicTrackToken) {
    const token = newTrackToken();
    await prisma.booking.update({
      where: { id: booking.id },
      data: { publicTrackToken: token },
    });
    booking.publicTrackToken = token;
  }
  return booking.publicTrackToken;
};

const getPublicTrack = async (req, res, next) => {
  try {
    const { bookingId, token } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: {
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                rating: true,
                vehicle: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Lien de suivi invalide' });
    }

    const validToken = await ensureTrackToken(booking);
    if (validToken !== token) {
      return res.status(404).json({ success: false, message: 'Lien de suivi invalide' });
    }

    const trip = booking.trip;
    const locations = await prisma.tripLocation.findMany({
      where: { tripId: trip.id },
      orderBy: { recordedAt: 'desc' },
      take: 30,
      select: { lat: true, lng: true, recordedAt: true, speed: true },
    });

    const lastLocation = locations[0] || null;
    const driver = trip.driver;
    const mappedTrip = mapTrip(trip);

    res.json({
      success: true,
      data: {
        bookingId: booking.id,
        status: booking.status,
        fareAmount: booking.fareAmount,
        pickup: booking.pickup,
        dropoff: booking.dropoff,
        requestedTime: booking.requestedTime,
        pickedUpAt: booking.pickedUpAt,
        trip: {
          id: mappedTrip._id,
          status: trip.status,
          departureTime: trip.departureTime,
          estimatedArrival: trip.estimatedArrival,
          completedAt: trip.completedAt,
        },
        driver: driver
          ? {
              firstName: driver.firstName,
              rating: driver.rating,
              vehicle: driver.vehicle
                ? `${driver.vehicle.brand} ${driver.vehicle.model} · ${driver.vehicle.color}`
                : null,
            }
          : null,
        timeline: buildTimeline(booking, trip),
        lastLocation: lastLocation
          ? {
              lat: lastLocation.lat,
              lng: lastLocation.lng,
              recordedAt: lastLocation.recordedAt,
            }
          : null,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPublicTrack, ensureTrackToken, buildTimeline };
