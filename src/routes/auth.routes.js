const express = require('express');
const controller = require('../controllers/auth.controller');
const { createRateLimit } = require('../middleware/rate-limit');

const router = express.Router();
const loginLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 10, prefix: 'login', key: (req) => `${req.ip}:${String(req.body.email || '').toLowerCase()}`, message: 'Prea multe încercări de conectare. Încearcă din nou peste câteva minute.' });
const registerLimit = createRateLimit({ windowMs: 60 * 60 * 1000, max: 30, prefix: 'register', message: 'Au fost create prea multe conturi de pe această conexiune.' });
const refreshLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 120, prefix: 'refresh', message: 'Prea multe reînnoiri de sesiune. Încearcă din nou peste câteva minute.' });
const logoutLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 30, prefix: 'logout' });

function requireSameOrigin(req, res, next) {
  const fetchSite = String(req.headers['sec-fetch-site'] || '').toLowerCase();
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) {
    return res.status(403).json({ eroare: 'Cererea nu este permisă din alt site.' });
  }

  const origin = String(req.headers.origin || '').trim();
  if (origin) {
    const expected = `${req.protocol}://${req.get('host')}`;
    if (origin !== expected) return res.status(403).json({ eroare: 'Originea cererii nu este validă.' });
  }
  next();
}

router.post('/register', registerLimit, controller.register);
router.post('/login', loginLimit, controller.login);
router.post('/refresh', refreshLimit, requireSameOrigin, controller.refresh);
router.post('/logout', logoutLimit, requireSameOrigin, controller.logout);

module.exports = router;
