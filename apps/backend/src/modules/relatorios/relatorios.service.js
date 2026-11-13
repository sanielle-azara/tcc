const prisma = require('../../config/prisma');
const { parsePagination } = require('@psicopedagogia/shared-utils');

// A titularidade de um relatório segue a do aprendente da aplicação:
// o psicopedagogo responsável pelo aprendente acessa seus relatórios; o ADMIN acessa todos.
const ownerFilter = (userId, userRole) =>
  userRole === 'ADMIN' ? {} : { aplicacao: { aprendente: { responsavelId: userId } } };

const list = async (query, userId, userRole) => {
  const { page, limit, skip } = parsePagination(query);
  const where = ownerFilter(userId, userRole);
  const [data, total] = await Promise.all([
    prisma.relatorio.findMany({
      where,
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
    prisma.relatorio.count({ where }),
  ]);
  return { data, total, page, limit };
};

const findById = async (id, userId, userRole) => {
  const item = await prisma.relatorio.findFirst({
    where: { id, ...ownerFilter(userId, userRole) },
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

const findByAplicacao = async (aplicacaoId, userId, userRole) => {
  return prisma.relatorio.findFirst({
    where: { aplicacaoId, ...ownerFilter(userId, userRole) },
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

const createOrUpdate = async (data, userId, userRole) => {
  const aplicacao = await prisma.aplicacao.findFirst({
    where: {
      id: data.aplicacaoId,
      ...(userRole !== 'ADMIN' && { aprendente: { responsavelId: userId } }),
    },
  });
  if (!aplicacao) throw Object.assign(new Error('Aplicação não encontrada'), { status: 404 });
  if (aplicacao.status !== 'COMPLETED') {
    throw Object.assign(new Error('Só é possível criar relatório para aplicações finalizadas'), { status: 400 });
  }

  // O autor registrado na criação é preservado nas edições posteriores
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
