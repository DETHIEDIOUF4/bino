const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { USER_ROLES } = require('../config/constants');
const { stripPassword } = require('../utils/mapApi');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Non autorisé' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.isSuspended || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Compte invalide ou suspendu' });
    }

    req.user = stripPassword(user);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Accès refusé' });
  }
  if (req.user.role === USER_ROLES.AGENT && !req.user.isActive) {
    return res.status(403).json({ success: false, message: 'Compte agent désactivé' });
  }
  next();
};

const requireDriver = (req, res, next) => {
  const allowed = [USER_ROLES.DRIVER, USER_ROLES.BOTH, USER_ROLES.ADMIN];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Vous devez être conducteur pour cette action',
    });
  }
  next();
};

const requireApprovedDriver = (req, res, next) => {
  const { DRIVER_STATUS } = require('../config/constants');
  if (req.user.driverStatus !== DRIVER_STATUS.APPROVED && req.user.role !== USER_ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Votre compte conducteur doit être validé par un administrateur',
    });
  }
  next();
};

module.exports = { protect, authorize, requireDriver, requireApprovedDriver };
