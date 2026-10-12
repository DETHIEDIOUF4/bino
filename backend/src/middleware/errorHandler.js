const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'champ';
    return res.status(400).json({
      success: false,
      message: `Ce ${field} est déjà utilisé`,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'champ';
    return res.status(400).json({
      success: false,
      message: `Ce ${field} est déjà utilisé`,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Identifiant invalide' });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur',
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFound };
