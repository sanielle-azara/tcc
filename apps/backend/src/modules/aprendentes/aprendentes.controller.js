const service = require('./aprendentes.service');
const { buildPaginatedResponse, buildSuccessResponse } = require('@psicopedagogia/shared-utils');

/**
 * @swagger
 * tags:
 *   name: Aprendentes
 *   description: Gerenciamento de aprendentes (estudantes)
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

const create = async (req, res, next) => {
  try {
    const item = await service.create(req.body);
    res.status(201).json(buildSuccessResponse(item, 'Aprendente cadastrado com sucesso'));
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const item = await service.update(req.params.id, req.body);
    res.json(buildSuccessResponse(item, 'Aprendente atualizado com sucesso'));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.json(buildSuccessResponse(null, 'Aprendente excluído com sucesso'));
  } catch (err) { next(err); }
};

const addHistorico = async (req, res, next) => {
  try {
    const item = await service.addHistorico(req.params.id, req.body.descricao);
    res.status(201).json(buildSuccessResponse(item, 'Histórico registrado com sucesso'));
  } catch (err) { next(err); }
};

const listHistorico = async (req, res, next) => {
  try {
    const items = await service.listHistorico(req.params.id);
    res.json(buildSuccessResponse(items));
  } catch (err) { next(err); }
};

module.exports = { list, findById, create, update, remove, addHistorico, listHistorico };
