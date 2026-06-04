const { Router } = require('express');
const controller = require('./aplicacoes.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createAplicacaoSchema, saveAnswersSchema } = require('@psicopedagogia/shared-validation');
const { z } = require('zod');

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.findById);
router.post('/', authorize('ADMIN', 'PSICOPEDAGOGO'), validate(createAplicacaoSchema), controller.create);
router.put('/:id/answers', authorize('ADMIN', 'PSICOPEDAGOGO'), validate(saveAnswersSchema), controller.saveAnswers);
router.post(
  '/:id/finalize',
  authorize('ADMIN', 'PSICOPEDAGOGO'),
  validate(z.object({ observacoes: z.string().max(2000).optional() })),
  controller.finalize
);
router.delete('/:id', authorize('ADMIN', 'PSICOPEDAGOGO'), controller.remove);

module.exports = router;
