const COOKIE_NAME = 'avarii_refresh';
const DEFAULT_REFRESH_DAYS = 365;

function refreshLifetimeMs() {
  const configured = Number.parseInt(process.env.USER_REFRESH_TOKEN_DAYS || String(DEFAULT_REFRESH_DAYS), 10);
  const days = Number.isFinite(configured) ? Math.min(Math.max(configured, 30), 730) : DEFAULT_REFRESH_DAYS;
  return days * 24 * 60 * 60 * 1000;
}

function cookieOptions(req, expiresAt) {
  const secure = Boolean(
    req.secure ||
    String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https' ||
    process.env.NODE_ENV === 'production'
  );
  return {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/auth',
    expires: expiresAt,
    priority: 'high',
  };
}

function parseCookies(req) {
  const result = {};
  const raw = String(req.headers.cookie || '');
  for (const part of raw.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (!key) continue;
    try { result[key] = decodeURIComponent(value); } catch { result[key] = value; }
  }
  return result;
}

function readRefreshCookie(req) {
  return parseCookies(req)[COOKIE_NAME] || '';
}

function setRefreshCookie(req, res, token, expiresAt) {
  res.cookie(COOKIE_NAME, token, cookieOptions(req, expiresAt));
}

function clearRefreshCookie(req, res) {
  const options = cookieOptions(req, new Date(0));
  delete options.expires;
  res.clearCookie(COOKIE_NAME, options);
}

module.exports = {
  COOKIE_NAME,
  refreshLifetimeMs,
  readRefreshCookie,
  setRefreshCookie,
  clearRefreshCookie,
};
