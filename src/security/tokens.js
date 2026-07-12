const crypto = require('crypto');

const secret = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signature(value) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function createToken(user) {
  const payload = encode({
    sub: user.id,
    rol: user.rol,
    email: user.email,
    iat: Math.floor(Date.now() / 1000)
  });
  return `${payload}.${signature(payload)}`;
}

function verifyToken(token) {
  const [payload, provided] = String(token || '').split('.');
  if (!payload || !provided) return null;
  const expected = signature(payload);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.sub || !data.rol) return null;
    return data;
  } catch {
    return null;
  }
}

function anonymousHash(value) {
  return crypto.createHmac('sha256', secret).update(String(value || '')).digest('hex').slice(0, 32);
}

module.exports = { createToken, verifyToken, anonymousHash };
