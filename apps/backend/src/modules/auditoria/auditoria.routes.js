const { Router } = require('express');
const { z } = require('zod');
const controller = require('./auditoria.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');

const ENTITIES = ['User', 'Aprendente', 'HistoricoAprendente', 'Avaliacao', 'Question', 'Aplicacao', 'Resposta', 'Relatorio'];
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'READ', 'LIST', 'LOGIN', 'LOGIN_FAILED'];
const isDate = (d) => !isNaN(Date.parse(d));

const auditQuerySchema = z.object({
  aprendenteId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  entity: z.enum(ENTITIES).optional(),
  action: z.enum(ACTIONS).optional(),
  from: z.string().refine(isDate, { message: 'Data inicial inválida' }).optional(),
  to: z.string().refine(isDate, { message: 'Data final inválida' }).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const router = Router();
router.use(authenticate);

// A autorização por perfil e por titularidade é feita no service
router.get('/', validate(auditQuerySchema, 'query'), controller.list);

module.exports = router;
