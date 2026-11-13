const { AsyncLocalStorage } = require('async_hooks');

// Contexto da requisição (usuário, perfil e IP) disponível em qualquer ponto do
// processamento, inclusive dentro da extensão de auditoria do Prisma, sem
// precisar repassar esses dados de função em função.
const storage = new AsyncLocalStorage();

const requestContext = (req, res, next) => {
  storage.run({ ip: req.ip, aplicacaoAprendente: new Map() }, next);
};

const getContext = () => storage.getStore() || {};

const setUser = (user) => {
  const ctx = storage.getStore();
  if (ctx) {
    ctx.userId = user.id;
    ctx.userRole = user.role;
  }
};

module.exports = { storage, requestContext, getContext, setUser };
