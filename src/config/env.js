const { getPushConfig } = require('./push');
const REQUIRED_RUNTIME_ENV = ['DATABASE_URL', 'AUTH_SECRET'];

function validateRuntimeEnv(env = process.env) {
  const missing = REQUIRED_RUNTIME_ENV.filter((name) => !String(env[name] || '').trim());

  if (missing.length) {
    throw new Error(
      `Lipsesc variabilele de mediu obligatorii: ${missing.join(', ')}. ` +
      'Configurează-le în fișierul .env local sau în Environment pe Render.'
    );
  }

  const push = getPushConfig(env);

  return {
    databaseUrl: String(env.DATABASE_URL).trim(),
    authSecret: String(env.AUTH_SECRET).trim(),
    push,
  };
}

module.exports = { REQUIRED_RUNTIME_ENV, validateRuntimeEnv };
