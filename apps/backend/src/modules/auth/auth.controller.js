const authService = require('./auth.service');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticação e controle de acesso
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realizar login
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renovar access token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *       401:
 *         description: Refresh token inválido
 */
const refresh = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Realizar logout
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 */
const logout = async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.json({ success: true, message: 'Logout realizado com sucesso' });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicitar recuperação de senha
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email de recuperação enviado (se o email existir)
 */
const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.json({ success: true, message: 'Se o email existir, você receberá as instruções de recuperação.' });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Redefinir senha com token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *       400:
 *         description: Token inválido ou expirado
 */
const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, message: 'Senha redefinida com sucesso' });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Alterar senha do usuário autenticado
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, confirmPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Senha atual incorreta
 */
const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Retorna dados do usuário autenticado
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Dados do usuário
 */
const me = (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = { login, refresh, logout, forgotPassword, resetPassword, changePassword, me };
