const express = require('express');
const controller = require('../controllers/auth.controller');
const { createRateLimit } = require('../middleware/rate-limit');

const router = express.Router();
const loginLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 10, prefix: 'login', key: (req) => `${req.ip}:${String(req.body.email || '').toLowerCase()}`, message: 'Prea multe încercări de conectare. Încearcă din nou peste câteva minute.' });
const registerLimit = createRateLimit({ windowMs: 60 * 60 * 1000, max: 30, prefix: 'register', message: 'Au fost create prea multe conturi de pe această conexiune.' });

router.post('/register', registerLimit, controller.register);
router.post('/login', loginLimit, controller.login);

module.exports = router;
