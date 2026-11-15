const usersService = require('./users.service');
const { buildPaginatedResponse, buildSuccessResponse } = require('@psicopedagogia/shared-utils');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gerenciamento de usuários do sistema
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar usuários
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE] }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [ADMIN, PSICOPEDAGOGO] }
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
const list = async (req, res, next) => {
  try {
    const { data, total, page, limit } = await usersService.list(req.query);
    res.json(buildPaginatedResponse(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Buscar usuário por ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       404:
 *         description: Usuário não encontrado
 */
const findById = async (req, res, next) => {
  try {
    const user = await usersService.findById(req.params.id);
    res.json(buildSuccessResponse(user));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Criar usuário
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               role: { type: string, enum: [ADMIN, PSICOPEDAGOGO] }
 *               status: { type: string, enum: [ACTIVE, INACTIVE] }
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 */
const create = async (req, res, next) => {
  try {
    const user = await usersService.create(req.body);
    res.status(201).json(buildSuccessResponse(user, 'Usuário criado com sucesso'));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Atualizar usuário
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               role: { type: string }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *       404:
 *         description: Usuário não encontrado
 */
const update = async (req, res, next) => {
  try {
    const user = await usersService.update(req.params.id, req.body);
    res.json(buildSuccessResponse(user, 'Usuário atualizado com sucesso'));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Excluir usuário (lógico)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Usuário excluído
 *       404:
 *         description: Usuário não encontrado
 */
const remove = async (req, res, next) => {
  try {
    await usersService.remove(req.params.id);
    res.json(buildSuccessResponse(null, 'Usuário excluído com sucesso'));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /users/{id}/transferir-aprendentes:
 *   post:
 *     summary: Transferir aprendentes e instrumentos de um profissional para outro
 *     description: >
 *       Usado quando um psicopedagogo deixa o serviço. O ADMIN não lê os dados clínicos;
 *       apenas troca o responsável. Cada aprendente transferido fica registrado na auditoria.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Profissional de origem
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [destinoId]
 *             properties:
 *               destinoId: { type: string, description: Psicopedagogo ativo que assume os aprendentes }
 *     responses:
 *       200:
 *         description: Quantidade de aprendentes e de instrumentos transferidos
 *       404:
 *         description: Origem ou destino não encontrado
 *       422:
 *         description: Destino não é um psicopedagogo ativo
 */
const transferirAprendentes = async (req, res, next) => {
  try {
    const result = await usersService.transferirAprendentes(req.params.id, req.body.destinoId);
    res.json(buildSuccessResponse(result, 'Aprendentes transferidos com sucesso'));
  } catch (err) {
    next(err);
  }
};

module.exports = { list, findById, create, update, remove, transferirAprendentes };
