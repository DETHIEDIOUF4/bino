const { searchPlaces, resolvePlace } = require('../services/placesService');

const autocomplete = async (req, res, next) => {
  try {
    const input = req.query.input || '';
    const result = await searchPlaces(input);
    res.json({
      success: true,
      data: result.suggestions,
      meta: { provider: result.provider },
    });
  } catch (error) {
    next(error);
  }
};

const placeDetails = async (req, res, next) => {
  try {
    const { placeId } = req.params;
    let payload;
    if (req.body && Object.keys(req.body).length > 0) {
      payload = req.body;
    }

    const point = await resolvePlace(placeId, payload);
    if (!point) {
      return res.status(404).json({ success: false, message: 'Lieu introuvable' });
    }

    res.json({ success: true, data: point });
  } catch (error) {
    next(error);
  }
};

module.exports = { autocomplete, placeDetails };
