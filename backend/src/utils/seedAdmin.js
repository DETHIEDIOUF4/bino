const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { USER_ROLES } = require('../config/constants');

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@aidafall.ca';
  const exists = await prisma.user.findUnique({ where: { email } });

  if (!exists) {
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';
    await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'AidaFALL',
        email,
        phone: '0000000000',
        password: await bcrypt.hash(password, 12),
        role: USER_ROLES.ADMIN,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });
    console.log(`Admin créé : ${email}`);
  }

  const agentEmail = process.env.AGENT_EMAIL || 'agent@aidafall.ca';
  const agentExists = await prisma.user.findUnique({ where: { email: agentEmail } });
  if (!agentExists) {
    const agentPassword = process.env.AGENT_PASSWORD || 'Agent123!';
    await prisma.user.create({
      data: {
        firstName: 'Agent',
        lastName: 'Validation',
        email: agentEmail,
        phone: '4185559999',
        password: await bcrypt.hash(agentPassword, 12),
        role: USER_ROLES.AGENT,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });
    console.log(`Agent validateur créé : ${agentEmail}`);
  }

  const muniExists = await prisma.municipality.findUnique({ where: { slug: 'demo' } });
  if (!muniExists) {
    await prisma.municipality.create({
      data: {
        name: 'Municipalité Démo',
        slug: 'demo',
        primaryColor: '#1A6B4A',
        secondaryColor: '#145A3D',
        region: 'Québec',
        contactEmail: 'municipalite@aidafall.ca',
      },
    });
    console.log('Municipalité démo créée');
  }
};

module.exports = seedAdmin;
