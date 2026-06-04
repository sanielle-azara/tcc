const service = require('./avaliacoes.service');
const { buildPaginatedResponse, buildSuccessResponse } = require('@psicopedagogia/shared-utils');

/**
 * @swagger
 * tags:
 *   name: Avaliacoes
 *   description: Gerenciamento de avaliações psicopedagógicas
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
    res.status(201).json(buildSuccessResponse(item, 'Avaliação criada com sucesso'));
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const item = await service.update(req.params.id, req.body);
    res.json(buildSuccessResponse(item, 'Avaliação atualizada com sucesso'));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.json(buildSuccessResponse(null, 'Avaliação excluída com sucesso'));
  } catch (err) { next(err); }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await service.getCategories();
    res.json(buildSuccessResponse(categories));
  } catch (err) { next(err); }
};

module.exports = { list, findById, create, update, remove, getCategories };
