const { Router } = require('express');
const controller = require('./aprendentes.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createAprendentSchema, updateAprendentSchema } = require('@psicopedagogia/shared-validation');
const { z } = require('zod');

const router = Router();
// Dados clínicos de crianças: acessíveis somente ao psicopedagogo, e apenas os seus
// (filtro de titularidade no service). O ADMIN administra usuários, não atendimentos.
router.use(authenticate, authorize('PSICOPEDAGOGO'));

router.get('/', controller.list);
router.get('/:id', controller.findById);
router.post('/', validate(createAprendentSchema), controller.create);
router.put('/:id', validate(updateAprendentSchema), controller.update);
router.delete('/:id', controller.remove);

router.get('/:id/historico', controller.listHistorico);
router.post(
  '/:id/historico',
  validate(z.object({ descricao: z.string().min(1).max(2000) })),
  controller.addHistorico
);

module.exports = router;
