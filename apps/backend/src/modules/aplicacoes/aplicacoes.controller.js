const service = require('./aplicacoes.service');
const { buildPaginatedResponse, buildSuccessResponse } = require('@psicopedagogia/shared-utils');

/**
 * @swagger
 * tags:
 *   name: Aplicacoes
 *   description: Aplicação de avaliações a aprendentes
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
    const item = await service.create(req.body, req.user.id);
    res.status(201).json(buildSuccessResponse(item, 'Aplicação criada com sucesso'));
  } catch (err) { next(err); }
};

const saveAnswers = async (req, res, next) => {
  try {
    const item = await service.saveAnswers(
      req.params.id,
      req.body.answers,
      req.body.isDraft,
      req.user.id
    );
    res.json(buildSuccessResponse(item, req.body.isDraft ? 'Rascunho salvo' : 'Respostas salvas'));
  } catch (err) { next(err); }
};

const finalize = async (req, res, next) => {
  try {
    const item = await service.finalize(req.params.id, req.body.observacoes);
    res.json(buildSuccessResponse(item, 'Aplicação finalizada com sucesso'));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.json(buildSuccessResponse(null, 'Aplicação excluída com sucesso'));
  } catch (err) { next(err); }
};

module.exports = { list, findById, create, saveAnswers, finalize, remove };
