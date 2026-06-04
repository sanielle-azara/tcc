const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const dashboardService = require('./dashboard.service');
const { buildSuccessResponse } = require('@psicopedagogia/shared-utils');

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Estatísticas do dashboard
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dados do dashboard
 */
router.get('/', async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats();
    res.json(buildSuccessResponse(stats));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
