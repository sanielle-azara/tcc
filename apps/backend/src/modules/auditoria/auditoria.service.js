const prisma = require('../../config/prisma');
const { parsePagination } = require('@psicopedagogia/shared-utils');

// O ADMIN consulta todo o registro de auditoria. O psicopedagogo consulta apenas o
// registro de acessos de um aprendente sob sua responsabilidade, o que inclui os
// acessos feitos pelo ADMIN aos dados dessa criança.
const list = async (query, userId, userRole) => {
  const { page, limit, skip } = parsePagination(query);

  if (userRole !== 'ADMIN') {
    if (!query.aprendenteId) {
      throw Object.assign(new Error('Informe o aprendente para consultar o registro de acessos'), { status: 403 });
    }
    const aprendente = await prisma.aprendente.findFirst({
      where: { id: query.aprendenteId, responsavelId: userId, deletedAt: null },
      select: { id: true },
    });
    if (!aprendente) throw Object.assign(new Error('Aprendente não encontrado'), { status: 404 });
  }

  const where = {
    ...(query.aprendenteId && { aprendenteId: query.aprendenteId }),
    ...(query.userId && { userId: query.userId }),
    ...(query.entity && { entity: query.entity }),
    ...(query.action && { action: query.action }),
    ...((query.from || query.to) && {
      timestamp: {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(query.to) }),
      },
    }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { timestamp: 'desc' } }),
    prisma.auditLog.count({ where }),
  ]);

  const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    : [];
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  const data = logs.map((l) => ({ ...l, user: l.userId ? byId[l.userId] || null : null }));

  return { data, total, page, limit };
};

module.exports = { list };
