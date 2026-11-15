const { Router } = require('express');
const controller = require('./relatorios.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createRelatorioSchema } = require('@psicopedagogia/shared-validation');

const router = Router();
// Dados clínicos de crianças: acessíveis somente ao psicopedagogo, e apenas os seus
// (filtro de titularidade no service). O ADMIN administra usuários, não atendimentos.
router.use(authenticate, authorize('PSICOPEDAGOGO'));

router.get('/', controller.list);
router.get('/:id', controller.findById);
router.get('/aplicacao/:aplicacaoId', controller.findByAplicacao);
router.post('/', validate(createRelatorioSchema), controller.createOrUpdate);

module.exports = router;
