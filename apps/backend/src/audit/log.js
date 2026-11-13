const { getContext } = require('./context');

// Registro explícito de eventos que não passam pela extensão do Prisma (ex.: login).
// Falhas são apenas registradas no console para não interromper a operação principal.
const logEvent = async ({ action, userId, userRole, entity = 'User', entityId = null, diff }) => {
  const prisma = require('../config/prisma');
  const ctx = getContext();
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? ctx.userId ?? null,
        userRole: userRole ?? ctx.userRole ?? null,
        action,
        entity,
        entityId,
        diff,
        ip: ctx.ip || null,
      },
    });
  } catch (err) {
    console.error('[audit] falha ao registrar evento:', err.message);
  }
};

module.exports = { logEvent };
