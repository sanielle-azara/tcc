const { Prisma } = require('@prisma/client');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  console.error('[Error]', err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Registro duplicado. Verifique os dados informados.',
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Registro não encontrado' });
    }
  }

  if (err.name === 'ValidationError') {
    return res.status(422).json({ success: false, message: err.message });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Erro interno do servidor';

  return res.status(status).json({ success: false, message });
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Rota não encontrada: ${req.originalUrl}` });
};

module.exports = { errorHandler, notFound };
