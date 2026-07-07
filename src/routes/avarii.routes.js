const express = require('express');
const router = express.Router();

const controller = require('../controllers/avarii.controller');
const upload = require('../middleware/upload');

router.get('/', controller.listaAvarii);
router.get('/:id', controller.detaliiAvarie);
router.post('/', upload.single('poza'), controller.creazaAvarie);
router.patch('/:id/status', controller.actualizeazaStatus);
router.get('/:id/messages', controller.listaMesaje);
router.post('/:id/messages', controller.adaugaMesaj);
router.post('/:id/follow', controller.urmaresteAvarie);
router.post('/:id/feedback', controller.feedbackAvarie);
router.delete('/:id', controller.stergeAvarie);

module.exports = router;
