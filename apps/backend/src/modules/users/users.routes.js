const { Router } = require('express');
const controller = require('./users.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createUserSchema, updateUserSchema } = require('@psicopedagogia/shared-validation');

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'PSICOPEDAGOGO'), controller.list);
router.get('/:id', authorize('ADMIN', 'PSICOPEDAGOGO'), controller.findById);
router.post('/', authorize('ADMIN'), validate(createUserSchema), controller.create);
router.put('/:id', authorize('ADMIN'), validate(updateUserSchema), controller.update);
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
