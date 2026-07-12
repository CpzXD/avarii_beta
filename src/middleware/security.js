function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://unpkg.com; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; font-src 'self' data:; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  next();
}

function rejectSuspiciousRequest(req, res, next) {
  const path = String(req.path || '');
  if (path.includes('..') || /[\u0000-\u001F]/.test(path)) return res.status(400).json({ eroare: 'Cerere invalidă.' });
  next();
}

module.exports = { securityHeaders, rejectSuspiciousRequest };
