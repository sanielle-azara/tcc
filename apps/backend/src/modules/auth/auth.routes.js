const { Router } = require('express');
const controller = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const {
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('@psicopedagogia/shared-validation');

const router = Router();

router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh', validate(refreshTokenSchema), controller.refresh);
router.post('/logout', authenticate, controller.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), controller.changePassword);
router.get('/me', authenticate, controller.me);

module.exports = router;
