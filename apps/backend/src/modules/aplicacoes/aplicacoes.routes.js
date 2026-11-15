const { Router } = require('express');
const controller = require('./aplicacoes.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createAplicacaoSchema, saveAnswersSchema } = require('@psicopedagogia/shared-validation');
const { z } = require('zod');

const router = Router();
// Dados clínicos de crianças: acessíveis somente ao psicopedagogo, e apenas os seus
// (filtro de titularidade no service). O ADMIN administra usuários, não atendimentos.
router.use(authenticate, authorize('PSICOPEDAGOGO'));

router.get('/', controller.list);
router.get('/:id', controller.findById);
router.post('/', validate(createAplicacaoSchema), controller.create);
router.put('/:id/answers', validate(saveAnswersSchema), controller.saveAnswers);
router.post(
  '/:id/finalize',
  validate(z.object({ observacoes: z.string().max(2000).optional() })),
  controller.finalize
);
router.delete('/:id', controller.remove);

module.exports = router;
