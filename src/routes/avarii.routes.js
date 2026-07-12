const express = require('express');
const controller = require('../controllers/avarii.controller');
const { upload } = require('../middleware/upload');
const { optionalAuth, requireAuth, requireUser, requireAdmin } = require('../middleware/auth');
const { createRateLimit } = require('../middleware/rate-limit');

const router = express.Router();
const reportHour = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: (req) => req.auth?.rol === 'user' ? 5 : 2,
  prefix: 'report-hour',
  key: (req) => req.auth?.id || `${req.ip}:${String(req.headers['x-client-id'] || 'browser')}`,
  message: 'Ai trimis mai multe sesizări într-un interval scurt. Încearcă din nou mai târziu.',
});
const reportDay = createRateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: (req) => req.auth?.rol === 'user' ? 15 : 5,
  prefix: 'report-day',
  key: (req) => req.auth?.id || `${req.ip}:${String(req.headers['x-client-id'] || 'browser')}`,
  message: 'Ai atins limita zilnică de sesizări pentru perioada beta.',
});
const reportIpLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  prefix: 'report-ip',
  message: 'S-au trimis prea multe sesizări de pe această rețea într-un interval scurt.',
});
const messageLimit = createRateLimit({
  windowMs: 10 * 60 * 1000,
  max: (req) => req.auth?.rol === 'admin' ? 60 : 5,
  prefix: 'messages',
  key: (req) => `${req.auth?.id || req.ip}:${req.params.id || 'general'}`,
  message: 'Ai trimis prea multe mesaje în această conversație. Așteaptă câteva minute.',
});
const followLimit = createRateLimit({ windowMs: 60 * 60 * 1000, max: 30, prefix: 'follow', key: (req) => req.auth?.id || req.ip });
const feedbackLimit = createRateLimit({ windowMs: 60 * 60 * 1000, max: 8, prefix: 'feedback', key: (req) => req.auth?.id || req.ip });
const adminWriteLimit = createRateLimit({ windowMs: 60 * 1000, max: 60, prefix: 'admin-write', key: (req) => req.auth?.id || req.ip });

router.get('/', optionalAuth, controller.listaAvarii);
router.get('/:id', requireAuth, controller.detaliiAvarie);
router.post('/', optionalAuth, reportIpLimit, reportHour, reportDay, upload.single('poza'), controller.creazaAvarie);
router.patch('/:id/status', requireAdmin, adminWriteLimit, controller.actualizeazaStatus);
router.get('/:id/messages', requireAuth, controller.listaMesaje);
router.post('/:id/messages', requireAuth, messageLimit, controller.adaugaMesaj);
router.post('/:id/follow', requireUser, followLimit, controller.urmaresteAvarie);
router.post('/:id/feedback', requireUser, feedbackLimit, controller.feedbackAvarie);
router.delete('/:id', requireAdmin, adminWriteLimit, controller.stergeAvarie);

module.exports = router;
