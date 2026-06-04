const prisma = require('../../config/prisma');

const getStats = async () => {
  const [
    totalAprendentes,
    totalAvaliacoes,
    totalAplicacoes,
    aplicacoesPorStatus,
    ultimasAplicacoes,
    avaliacoesAtivas,
  ] = await Promise.all([
    prisma.aprendente.count({ where: { deletedAt: null } }),
    prisma.avaliacao.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
    prisma.aplicacao.count(),
    prisma.aplicacao.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.aplicacao.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        aprendente: { select: { id: true, name: true } },
        avaliacao: { select: { id: true, name: true } },
        aplicador: { select: { id: true, name: true } },
      },
    }),
    prisma.avaliacao.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
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
