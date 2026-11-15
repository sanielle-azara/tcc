const prisma = require('../../config/prisma');
const { parsePagination } = require('@psicopedagogia/shared-utils');

// Entidades com dados clínicos de crianças, cujos valores o ADMIN não pode ver
const CLINICAL_ENTITIES = new Set(['Aprendente', 'HistoricoAprendente', 'Aplicacao', 'Resposta', 'Relatorio']);

// Mantém só os metadados do diff: nas alterações, os nomes dos campos alterados;
// nas criações, exclusões e operações em lote, apenas a quantidade, quando houver.
const redactDiff = (diff) => {
  if (!diff || typeof diff !== 'object') return diff;
  const lote = 'depois' in diff || 'antes' in diff || 'alteracao' in diff;
  return lote
    ? { omitido: true, ...(diff.quantidade !== undefined && { quantidade: diff.quantidade }) }
    : { omitido: true, campos: Object.keys(diff) };
};

// O ADMIN consulta todo o registro de auditoria, mas, nas entidades clínicas, sem os
// valores registrados (sigilo profissional). O psicopedagogo consulta apenas o registro
// de acessos de um aprendente sob sua responsabilidade, com os valores completos.
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
  const data = logs.map((l) => ({
    ...l,
    diff: userRole === 'ADMIN' && CLINICAL_ENTITIES.has(l.entity) ? redactDiff(l.diff) : l.diff,
    user: l.userId ? byId[l.userId] || null : null,
  }));

  return { data, total, page, limit };
};

module.exports = { list, redactDiff };
