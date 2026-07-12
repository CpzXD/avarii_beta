const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const value = String(stored || '');
  if (!value.startsWith('scrypt$')) {
    const candidate = Buffer.from(String(password));
    const actual = Buffer.from(value);
    return candidate.length === actual.length && crypto.timingSafeEqual(candidate, actual);
  }
  const parts = value.split('$');
  if (parts.length !== 3) return false;
  const actual = Buffer.from(parts[2], 'hex');
  const candidate = crypto.scryptSync(String(password), parts[1], actual.length);
  return actual.length === candidate.length && crypto.timingSafeEqual(actual, candidate);
}

function isHashedPassword(value) {
  return String(value || '').startsWith('scrypt$');
}

module.exports = { hashPassword, verifyPassword, isHashedPassword };
