const prisma = require('../lib/prisma');
const { mapId } = require('../utils/mapApi');

const getMunicipalityStats = async (req, res, next) => {
  try {
    const municipalityId = req.user.municipality || req.user.municipalityId || req.params.id;

    const [totalUsers, totalDrivers, totalPassengers, totalTrips, completedBookings] =
      await Promise.all([
        prisma.user.count({ where: { role: { not: 'admin' } } }),
        prisma.user.count({ where: { driverStatus: 'approved' } }),
        prisma.user.count({ where: { role: { in: ['passenger', 'both'] } } }),
        prisma.trip.count(),
        prisma.booking.findMany({
          where: { status: 'completed' },
          select: { fareAmount: true, distanceKm: true },
        }),
      ]);

    const completedTrips = await prisma.trip.findMany({
      where: { status: 'completed' },
      select: { distanceKm: true },
    });
    const totalKm = completedTrips.reduce((s, t) => s + (t.distanceKm || 0), 0);
    const co2Saved = Math.round(totalKm * 0.18 * 100) / 100;
    const totalSavings = completedBookings.reduce(
      (s, b) => s + (b.fareAmount || 0) * 0.6,
      0
    );

    const municipality = municipalityId
      ? await prisma.municipality.findUnique({ where: { id: municipalityId } })
      : null;

    res.json({
      success: true,
      data: {
        municipality: municipality ? mapId(municipality) : null,
        totalUsers,
        totalDrivers,
        totalPassengers,
        totalTrips,
        totalBookings: completedBookings.length,
        totalKmShared: Math.round(totalKm * 100) / 100,
        co2SavedKg: co2Saved,
        savingsGenerated: Math.round(totalSavings * 100) / 100,
        utilizationRate:
          totalTrips > 0
            ? Math.round((completedBookings.length / totalTrips) * 100)
            : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllMunicipalities = async (req, res, next) => {
  try {
    const municipalities = await prisma.municipality.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: municipalities.map(mapId) });
  } catch (error) {
    next(error);
  }
};

const createMunicipality = async (req, res, next) => {
  try {
    const municipality = await prisma.municipality.create({ data: req.body });
    res.status(201).json({ success: true, data: mapId(municipality) });
  } catch (error) {
    next(error);
  }
};

const updateMunicipality = async (req, res, next) => {
  try {
    const existing = await prisma.municipality.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Municipalité introuvable' });
    }
    const municipality = await prisma.municipality.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: mapId(municipality) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMunicipalityStats,
  getAllMunicipalities,
  createMunicipality,
  updateMunicipality,
};
