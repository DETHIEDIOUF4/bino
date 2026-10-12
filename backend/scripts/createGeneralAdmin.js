#!/usr/bin/env node
/**
 * Crée ou réinitialise un administrateur général (role: admin).
 * Usage:
 *   npm run create-admin
 *   GENERAL_ADMIN_EMAIL=x GENERAL_ADMIN_PASSWORD=y npm run create-admin
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');
const { USER_ROLES } = require('../src/config/constants');

async function main() {
  const email = (process.env.GENERAL_ADMIN_EMAIL || 'admin.general@aidafall.ca').toLowerCase();
  const password = process.env.GENERAL_ADMIN_PASSWORD || 'BinoAdmin2026!';
  const firstName = process.env.GENERAL_ADMIN_FIRST_NAME || 'Administrateur';
  const lastName = process.env.GENERAL_ADMIN_LAST_NAME || 'Général';
  const reset = process.env.RESET_ADMIN_PASSWORD === '1' || process.env.RESET_ADMIN_PASSWORD === 'true';

  if (password.length < 8) {
    console.error('Mot de passe trop court (min. 8 caractères).');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL manquant dans backend/.env');
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== USER_ROLES.ADMIN && existing.role !== USER_ROLES.AGENT) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: USER_ROLES.ADMIN,
          password: hashed,
          isSuspended: false,
          isEmailVerified: true,
          isPhoneVerified: true,
          firstName,
          lastName,
        },
      });
      console.log(`Compte promu administrateur général : ${email}`);
    } else if (reset || existing.role === USER_ROLES.ADMIN) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: USER_ROLES.ADMIN,
          password: hashed,
          isSuspended: false,
          isEmailVerified: true,
          firstName,
          lastName,
        },
      });
      console.log(`Mot de passe administrateur mis à jour : ${email}`);
    } else {
      console.log(`L'utilisateur ${email} existe déjà (rôle: ${existing.role}).`);
      console.log('Définissez RESET_ADMIN_PASSWORD=1 pour forcer la réinitialisation.');
      process.exit(0);
    }
  } else {
    await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: process.env.GENERAL_ADMIN_PHONE || '4185550199',
        password: hashed,
        role: USER_ROLES.ADMIN,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });
    console.log(`Administrateur général créé : ${email}`);
  }

  console.log('');
  console.log('══════════════════════════════════════════');
  console.log('  Connexion : /adminbino');
  console.log(`  Email     : ${email}`);
  console.log(`  Mot de passe : (voir GENERAL_ADMIN_PASSWORD ou défaut doc)`);
  console.log('══════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
