const prisma = require('../../config/prisma');

const ownerFilter = (userId, userRole) =>
  userRole === 'ADMIN' ? {} : { responsavelId: userId };

const ownerFilterAvaliacoes = (userId, userRole) =>
  userRole === 'ADMIN' ? {} : { autorId: userId };

const getStats = async (userId, userRole) => {
  const aprendenteWhere = { deletedAt: null, ...ownerFilter(userId, userRole) };
  const avaliacaoWhere = { deletedAt: null, status: 'ACTIVE', ...ownerFilterAvaliacoes(userId, userRole) };
  const aplicacaoWhere = userRole === 'ADMIN' ? {} : { aplicadorId: userId };

  const [
    totalAprendentes,
    totalAvaliacoes,
    totalAplicacoes,
    aplicacoesPorStatus,
    ultimasAplicacoes,
    avaliacoesAtivas,
  ] = await Promise.all([
    prisma.aprendente.count({ where: aprendenteWhere }),
    prisma.avaliacao.count({ where: avaliacaoWhere }),
    prisma.aplicacao.count({ where: aplicacaoWhere }),
    prisma.aplicacao.groupBy({ by: ['status'], where: aplicacaoWhere, _count: { id: true } }),
    prisma.aplicacao.findMany({
      where: aplicacaoWhere,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        aprendente: { select: { id: true, name: true } },
        avaliacao: { select: { id: true, name: true } },
        aplicador: { select: { id: true, name: true } },
      },
    }),
    prisma.avaliacao.findMany({
      where: avaliacaoWhere,
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, category: true, _count: { select: { aplicacoes: true } } },
    }),
  ]);

  const statusMap = Object.fromEntries(aplicacoesPorStatus.map((s) => [s.status, s._count.id]));

  return {
    totalAprendentes,
    totalAvaliacoes,
    totalAplicacoes,
    aplicacoesPendentes: statusMap.PENDING || 0,
    aplicacoesEmAndamento: statusMap.IN_PROGRESS || 0,
    aplicacoesRascunho: statusMap.DRAFT || 0,
    aplicacoesFinalizadas: statusMap.COMPLETED || 0,
    ultimasAplicacoes,
    avaliacoesAtivas,
  };
};

module.exports = { getStats };
