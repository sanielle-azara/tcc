const { Router } = require('express');
const controller = require('./avaliacoes.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createAvaliacaoSchema, updateAvaliacaoSchema } = require('@psicopedagogia/shared-validation');

const router = Router();
router.use(authenticate);

router.get('/categories', controller.getCategories);
router.get('/', controller.list);
router.get('/:id', controller.findById);
router.post('/', authorize('ADMIN', 'PSICOPEDAGOGO'), validate(createAvaliacaoSchema), controller.create);
router.put('/:id', authorize('ADMIN', 'PSICOPEDAGOGO'), validate(updateAvaliacaoSchema), controller.update);
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
