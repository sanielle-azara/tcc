const { Router } = require('express');
const controller = require('./aprendentes.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createAprendentSchema, updateAprendentSchema } = require('@psicopedagogia/shared-validation');
const { z } = require('zod');

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.findById);
router.post('/', authorize('ADMIN', 'PSICOPEDAGOGO'), validate(createAprendentSchema), controller.create);
router.put('/:id', authorize('ADMIN', 'PSICOPEDAGOGO'), validate(updateAprendentSchema), controller.update);
router.delete('/:id', authorize('ADMIN', 'PSICOPEDAGOGO'), controller.remove);

router.get('/:id/historico', controller.listHistorico);
router.post(
  '/:id/historico',
  authorize('ADMIN', 'PSICOPEDAGOGO'),
  validate(z.object({ descricao: z.string().min(1).max(2000) })),
  controller.addHistorico
);

module.exports = router;
