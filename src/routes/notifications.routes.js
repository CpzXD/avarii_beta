const express = require('express');
const controller = require('../controllers/notifications.controller');
const { requireUser } = require('../middleware/auth');
const { createRateLimit } = require('../middleware/rate-limit');

const router = express.Router();
const subscriptionLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  prefix: 'push-subscription',
  key: (req) => req.auth?.id || req.ip,
  message: 'Ai făcut prea multe modificări ale notificărilor. Încearcă din nou mai târziu.',
});

router.post('/subscription', requireUser, subscriptionLimit, controller.salveazaAbonament);
router.delete('/subscription', requireUser, subscriptionLimit, controller.stergeAbonament);

module.exports = router;
