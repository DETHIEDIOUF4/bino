const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { generateToken } = require('../utils/generateToken');
const { stripPassword } = require('../utils/mapApi');
const { USER_ROLES, DRIVER_STATUS } = require('../config/constants');

const register = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role = USER_ROLES.PASSENGER,
      driverLicenseNumber,
      vehicle,
    } = req.body;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      const wantsDriver = role === USER_ROLES.DRIVER || role === USER_ROLES.BOTH;
      const isExistingDriver =
        existing.role === USER_ROLES.DRIVER || existing.role === USER_ROLES.BOTH;
      const isExistingPassenger =
        existing.role === USER_ROLES.PASSENGER || existing.role === USER_ROLES.BOTH;

      if (wantsDriver && isExistingDriver) {
        return res.status(409).json({
          success: false,
          code: 'ACCOUNT_EXISTS_DRIVER',
          existingRole: existing.role,
          loginPath: '/connexion-conducteur',
          message:
            'Ce courriel a déjà un compte conducteur. Connectez-vous directement — pas besoin de recréer un compte.',
        });
      }

      if (wantsDriver && isExistingPassenger) {
        return res.status(409).json({
          success: false,
          code: 'ACCOUNT_EXISTS_PASSENGER',
          existingRole: existing.role,
          loginPath: '/connexion',
          switchPath: '/inscription-conducteur',
          message:
            'Ce courriel a déjà un compte passager. Connectez-vous, puis passez en mode conducteur (permis et véhicule).',
        });
      }

      if (!wantsDriver && isExistingPassenger) {
        return res.status(409).json({
          success: false,
          code: 'ACCOUNT_EXISTS',
          existingRole: existing.role,
          loginPath: '/connexion',
          message: 'Ce courriel a déjà un compte. Connectez-vous plutôt que de créer un nouveau profil.',
        });
      }

      return res.status(409).json({
        success: false,
        code: 'ACCOUNT_EXISTS',
        existingRole: existing.role,
        loginPath: wantsDriver ? '/connexion-conducteur' : '/connexion',
        message: 'Courriel déjà utilisé. Connectez-vous avec ce compte.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const isDriver = role === USER_ROLES.DRIVER || role === USER_ROLES.BOTH;
    const userData = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role,
    };

    if (isDriver) {
      userData.driverLicenseNumber = driverLicenseNumber || null;
      userData.vehicle = vehicle || undefined;
      userData.driverStatus = DRIVER_STATUS.PENDING;
    }

    const user = await prisma.user.create({ data: userData });
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: isDriver
        ? 'Inscription réussie. Votre compte conducteur est en attente de validation.'
        : 'Inscription réussie',
      data: { user: stripPassword(user), token },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Compte suspendu' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      data: { user: stripPassword(user), token },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };
