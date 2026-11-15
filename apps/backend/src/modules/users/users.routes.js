const { Router } = require('express');
const controller = require('./users.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createUserSchema, updateUserSchema } = require('@psicopedagogia/shared-validation');
const { z } = require('zod');

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN'), controller.list);
router.get('/:id', authorize('ADMIN'), controller.findById);
router.post('/', authorize('ADMIN'), validate(createUserSchema), controller.create);
router.put('/:id', authorize('ADMIN'), validate(updateUserSchema), controller.update);
router.delete('/:id', authorize('ADMIN'), controller.remove);
router.post(
  '/:id/transferir-aprendentes',
  authorize('ADMIN'),
  validate(z.object({ destinoId: z.string().min(1) })),
  controller.transferirAprendentes
);

module.exports = router;
