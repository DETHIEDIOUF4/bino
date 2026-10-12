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
      return res.status(400).json({ success: false, message: 'Courriel déjà utilisé' });
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
