const { Router } = require('express');
const controller = require('./relatorios.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createRelatorioSchema } = require('@psicopedagogia/shared-validation');

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.findById);
router.get('/aplicacao/:aplicacaoId', controller.findByAplicacao);
router.post('/', authorize('ADMIN', 'PSICOPEDAGOGO'), validate(createRelatorioSchema), controller.createOrUpdate);

module.exports = router;
