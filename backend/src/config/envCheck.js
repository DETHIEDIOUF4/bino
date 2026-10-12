const normalizeOrigin = (url) => {
  if (!url || url === '*') return null;
  return String(url).trim().replace(/\/$/, '');
};

/** Origines navigateur (admin + web). MOBILE_URL n’entre pas ici — apps natives ≠ CORS. */
const getCorsOrigins = () =>
  [
    process.env.CLIENT_URL,
    process.env.WEB_URL,
    ...(process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
      : []),
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

const assertProductionEnv = () => {
  if (process.env.NODE_ENV !== 'production') return;

  if (!process.env.JWT_SECRET?.trim()) {
    console.error('JWT_SECRET manquant sur Render — login/inscription impossible.');
    process.exit(1);
  }

  if (!normalizeOrigin(process.env.WEB_URL)) {
    console.error(
      'WEB_URL manquant sur Render — ex. WEB_URL=https://binoa.netlify.app (sans slash final).'
    );
    process.exit(1);
  }

  const origins = getCorsOrigins();
  console.log('CORS autorisé pour:', origins.join(', '));
};

module.exports = { getCorsOrigins, assertProductionEnv, normalizeOrigin };
