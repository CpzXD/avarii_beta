const crypto = require('crypto');

const secret = String(process.env.AUTH_SECRET || '').trim();
if (!secret) {
  throw new Error('AUTH_SECRET nu este configurat. Serverul nu poate genera sau valida token-uri în siguranță.');
}

const configuredAccessTtl = Number.parseInt(process.env.USER_ACCESS_TOKEN_TTL_SECONDS || '900', 10) || 900;
const ACCESS_TOKEN_TTL_SECONDS = Math.min(Math.max(configuredAccessTtl, 60), 3600);

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signature(value) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function createToken(user, { expiresInSeconds = null, type = 'legacy' } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const data = {
    sub: user.id,
    rol: user.rol,
    email: user.email,
    typ: type,
    iat: now,
    jti: crypto.randomUUID(),
  };
  if (Number.isFinite(expiresInSeconds) && expiresInSeconds > 0) {
    data.exp = now + Math.floor(expiresInSeconds);
  }
  const payload = encode(data);
  return `${payload}.${signature(payload)}`;
}

function createAccessToken(user) {
  return createToken(user, { expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS, type: 'access' });
}

function verifyToken(token) {
  const [payload, provided, extra] = String(token || '').split('.');
  if (!payload || !provided || extra) return null;
  const expected = signature(payload);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (!data.sub || !data.rol) return null;
    if (data.exp && now >= Number(data.exp)) return null;
    return data;
  } catch {
    return null;
  }
}

function createRefreshToken(sessionId) {
  return `${sessionId}.${crypto.randomBytes(48).toString('base64url')}`;
}

function parseRefreshToken(token) {
  const value = String(token || '');
  const separator = value.indexOf('.');
  if (separator < 1 || separator === value.length - 1) return null;
  const sessionId = value.slice(0, separator);
  const secretPart = value.slice(separator + 1);
  if (!/^[0-9a-f-]{36}$/i.test(sessionId) || secretPart.length < 40 || secretPart.length > 128) return null;
  return { sessionId, token: value };
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}


function safeTokenHashEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function anonymousHash(value) {
  return crypto.createHmac('sha256', secret).update(String(value || '')).digest('hex').slice(0, 32);
}

module.exports = {
  ACCESS_TOKEN_TTL_SECONDS,
  createToken,
  createAccessToken,
  verifyToken,
  createRefreshToken,
  parseRefreshToken,
  hashRefreshToken,
  safeTokenHashEqual,
  anonymousHash,
};
