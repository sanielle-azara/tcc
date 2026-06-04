const service = require('./relatorios.service');
const { buildPaginatedResponse, buildSuccessResponse } = require('@psicopedagogia/shared-utils');

/**
 * @swagger
 * tags:
 *   name: Relatorios
 *   description: Relatórios das avaliações aplicadas
 */

const list = async (req, res, next) => {
  try {
    const { data, total, page, limit } = await service.list(req.query);
    res.json(buildPaginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
};

const findById = async (req, res, next) => {
  try {
    const item = await service.findById(req.params.id);
    res.json(buildSuccessResponse(item));
  } catch (err) { next(err); }
};

const findByAplicacao = async (req, res, next) => {
  try {
    const item = await service.findByAplicacao(req.params.aplicacaoId);
    if (!item) return res.status(404).json({ success: false, message: 'Relatório não encontrado' });
    res.json(buildSuccessResponse(item));
  } catch (err) { next(err); }
};

const createOrUpdate = async (req, res, next) => {
  try {
    const item = await service.createOrUpdate(req.body, req.user.id);
    res.json(buildSuccessResponse(item, 'Relatório salvo com sucesso'));
  } catch (err) { next(err); }
};

module.exports = { list, findById, findByAplicacao, createOrUpdate };
