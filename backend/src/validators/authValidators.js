const { body } = require('express-validator');
const { USER_ROLES } = require('../config/constants');

const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('Prénom requis'),
  body('lastName').trim().notEmpty().withMessage('Nom requis'),
  body('email').isEmail().withMessage('Courriel invalide'),
  body('phone').trim().notEmpty().withMessage('Téléphone requis'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe min. 8 caractères'),
  body('role')
    .optional()
    .isIn([USER_ROLES.PASSENGER, USER_ROLES.DRIVER, USER_ROLES.BOTH])
    .withMessage('Rôle invalide'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Courriel invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
];

const createTripValidation = [
  body('departure.label').notEmpty(),
  body('departure.lat').isFloat(),
  body('departure.lng').isFloat(),
  body('arrival.label').notEmpty(),
  body('arrival.lat').isFloat(),
  body('arrival.lng').isFloat(),
  body('departureTime').isISO8601(),
  body('availableSeats').isInt({ min: 1, max: 8 }),
];

const bookTripValidation = [
  body('pickup.label').notEmpty(),
  body('pickup.lat').isFloat(),
  body('pickup.lng').isFloat(),
  body('dropoff.label').notEmpty(),
  body('dropoff.lat').isFloat(),
  body('dropoff.lng').isFloat(),
  body('requestedTime').isISO8601(),
  body('fareAmount').optional().isFloat({ min: 4, max: 9.99 }),
];

module.exports = {
  registerValidation,
  loginValidation,
  createTripValidation,
  bookTripValidation,
};
