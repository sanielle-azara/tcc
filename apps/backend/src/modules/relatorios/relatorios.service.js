const prisma = require('../../config/prisma');
const { parsePagination } = require('@psicopedagogia/shared-utils');

const list = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const [data, total] = await Promise.all([
    prisma.relatorio.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        aplicacao: {
          include: {
            aprendente: { select: { id: true, name: true } },
            avaliacao: { select: { id: true, name: true, category: true } },
          },
        },
        autor: { select: { id: true, name: true } },
      },
    }),
    prisma.relatorio.count(),
  ]);
  return { data, total, page, limit };
};

const findById = async (id) => {
  const item = await prisma.relatorio.findUnique({
    where: { id },
    include: {
      aplicacao: {
        include: {
          aprendente: true,
          avaliacao: { include: { questions: { orderBy: { order: 'asc' } } } },
          aplicador: { select: { id: true, name: true, email: true } },
          respostas: { include: { question: true } },
        },
      },
      autor: { select: { id: true, name: true, email: true } },
    },
  });
  if (!item) throw Object.assign(new Error('Relatório não encontrado'), { status: 404 });
  return item;
};

const findByAplicacao = async (aplicacaoId) => {
  return prisma.relatorio.findUnique({
    where: { aplicacaoId },
    include: {
      aplicacao: {
        include: {
          aprendente: true,
          avaliacao: { include: { questions: { orderBy: { order: 'asc' } } } },
          aplicador: { select: { id: true, name: true } },
          respostas: { include: { question: true } },
        },
      },
      autor: { select: { id: true, name: true } },
    },
  });
};

const createOrUpdate = async (data, userId) => {
  const aplicacao = await prisma.aplicacao.findUnique({ where: { id: data.aplicacaoId } });
  if (!aplicacao) throw Object.assign(new Error('Aplicação não encontrada'), { status: 404 });
  if (aplicacao.status !== 'COMPLETED') {
    throw Object.assign(new Error('Só é possível criar relatório para aplicações finalizadas'), { status: 400 });
  }

  return prisma.relatorio.upsert({
    where: { aplicacaoId: data.aplicacaoId },
    create: {
      aplicacaoId: data.aplicacaoId,
      autorId: userId,
      conclusao: data.conclusao,
      observacoesProfissional: data.observacoesProfissional,
    },
    update: {
      conclusao: data.conclusao,
      observacoesProfissional: data.observacoesProfissional,
      autorId: userId,
    },
    include: {
      aplicacao: {
        include: {
          aprendente: true,
          avaliacao: { include: { questions: { orderBy: { order: 'asc' } } } },
          respostas: { include: { question: true } },
        },
      },
      autor: { select: { id: true, name: true } },
    },
  });
};

module.exports = { list, findById, findByAplicacao, createOrUpdate };
