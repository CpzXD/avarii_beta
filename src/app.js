const fs = require('fs');
const express = require('express');
const { uploadsDir, projectRoot } = require('./config/paths');
const { reverseGeocode } = require('./services/geocoding.service');
const { securityHeaders, rejectSuspiciousRequest } = require('./middleware/security');
const { createRateLimit } = require('./middleware/rate-limit');
const { getPushConfig } = require('./config/push');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(rejectSuspiciousRequest);
  app.use(express.json({ limit: '100kb', strict: true }));
  app.use(express.urlencoded({ extended: false, limit: '50kb' }));
  app.use('/uploads', express.static(uploadsDir, { fallthrough: false, maxAge: '1d', immutable: false }));
  app.use(express.static(`${projectRoot}/public`, {
    extensions: ['html'],
    maxAge: 0,
    setHeaders(res, filePath) {
      if (/service-worker\.js$|cache-bootstrap\.js$|map-config\.js$|\.(?:html|js|css|json)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }
  }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/config/public', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const push = getPushConfig();
    res.json({
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
      push: { enabled: push.enabled, publicKey: push.enabled ? push.publicKey : '' },
    });
  });

  const geocodeLimit = createRateLimit({ windowMs: 60 * 1000, max: 120, prefix: 'geocode' });
  app.get('/geocoding/reverse', geocodeLimit, async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ eroare: 'Coordonate invalide.' });
    const adresa = await reverseGeocode(lat, lng);
    res.json({ adresa });
  });

  const apiLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 3000, prefix: 'api' });
  app.use(['/auth', '/avarii', '/notifications'], (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.use('/auth', apiLimit, require('./routes/auth.routes'));
  app.use('/avarii', apiLimit, require('./routes/avarii.routes'));
  app.use('/notifications', apiLimit, require('./routes/notifications.routes'));

  app.use((error, req, res, next) => {
    if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ eroare: 'Poza poate avea maximum 5 MB.' });
    if (error?.code === 'LIMIT_FILE_COUNT' || error?.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ eroare: 'Poți încărca o singură poză.' });
    if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ eroare: 'Datele trimise nu sunt valide.' });
    if (error) return res.status(400).json({ eroare: error.message || 'Cererea nu a putut fi procesată.' });
    next();
  });

  return app;
}

module.exports = createApp;
