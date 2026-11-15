const service = require('./auditoria.service');
const { buildPaginatedResponse } = require('@psicopedagogia/shared-utils');

/**
 * @swagger
 * tags:
 *   name: Auditoria
 *   description: Registro de operações e de acessos a dados clínicos
 */

/**
 * @swagger
 * /auditoria:
 *   get:
 *     summary: Consultar o registro de auditoria
 *     description: >
 *       O ADMIN consulta todo o registro, mas, nas entidades clínicas (aprendente,
 *       histórico, aplicação, resposta e relatório), o diff chega sem os valores:
 *       apenas os nomes dos campos alterados ou a quantidade de registros. O
 *       PSICOPEDAGOGO consulta apenas o registro de acessos de um aprendente sob sua
 *       responsabilidade (aprendenteId obrigatório), com os valores completos.
 *     tags: [Auditoria]
 *     parameters:
 *       - in: query
 *         name: aprendenteId
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: entity
 *         schema: { type: string, enum: [User, Aprendente, HistoricoAprendente, Avaliacao, Question, Aplicacao, Resposta, Relatorio] }
 *       - in: query
 *         name: action
 *         schema: { type: string, enum: [CREATE, UPDATE, DELETE, READ, LIST, LOGIN, LOGIN_FAILED] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Registros de auditoria, do mais recente para o mais antigo
 *       403:
 *         description: PSICOPEDAGOGO sem aprendenteId
 *       404:
 *         description: Aprendente inexistente ou de outro profissional
 */
const list = async (req, res, next) => {
  try {
    const { data, total, page, limit } = await service.list(req.query, req.user.id, req.user.role);
    res.json(buildPaginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
};

module.exports = { list };
