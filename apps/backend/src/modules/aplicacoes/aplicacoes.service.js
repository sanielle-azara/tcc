const prisma = require('../../config/prisma');
const { parsePagination } = require('@psicopedagogia/shared-utils');

// A titularidade de uma aplicação segue a do aprendente: o psicopedagogo
// responsável pelo aprendente acessa suas aplicações; o ADMIN acessa todas.
const ownerFilter = (userId, userRole) =>
  userRole === 'ADMIN' ? {} : { aprendente: { responsavelId: userId } };

const list = async (query, userId, userRole) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {
    ...ownerFilter(userId, userRole),
    ...(query.aprendentId && { aprendentId: query.aprendentId }),
    ...(query.avaliacaoId && { avaliacaoId: query.avaliacaoId }),
    ...(query.aplicadorId && { aplicadorId: query.aplicadorId }),
    ...(query.status && { status: query.status }),
  };

  const [data, total] = await Promise.all([
    prisma.aplicacao.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        aprendente: { select: { id: true, name: true, birthDate: true } },
        avaliacao: { select: { id: true, name: true, category: true, version: true } },
        aplicador: { select: { id: true, name: true } },
        _count: { select: { respostas: true } },
      },
    }),
    prisma.aplicacao.count({ where }),
  ]);

  return { data, total, page, limit };
};

const findById = async (id, userId, userRole) => {
  const item = await prisma.aplicacao.findFirst({
    where: { id, ...ownerFilter(userId, userRole) },
    include: {
      aprendente: true,
      avaliacao: { include: { questions: { orderBy: { order: 'asc' } } } },
      aplicador: { select: { id: true, name: true, email: true } },
      respostas: true,
      relatorio: true,
    },
  });
  if (!item) throw Object.assign(new Error('Aplicação não encontrada'), { status: 404 });
  return item;
};

const create = async (data, userId, userRole) => {
  const isAdmin = userRole === 'ADMIN';

  const aprendente = await prisma.aprendente.findFirst({
    where: { id: data.aprendentId, deletedAt: null, ...(!isAdmin && { responsavelId: userId }) },
  });
  if (!aprendente) throw Object.assign(new Error('Aprendente não encontrado'), { status: 404 });

  const avaliacao = await prisma.avaliacao.findFirst({
    where: { id: data.avaliacaoId, deletedAt: null, ...(!isAdmin && { autorId: userId }) },
  });
  if (!avaliacao) throw Object.assign(new Error('Avaliação não encontrada'), { status: 404 });

  return prisma.aplicacao.create({
    data: {
      aprendentId: data.aprendentId,
      avaliacaoId: data.avaliacaoId,
      aplicadorId: userId,
      status: 'PENDING',
      dataAplicacao: data.dataAplicacao ? new Date(data.dataAplicacao) : null,
      observacoes: data.observacoes,
    },
    include: {
      aprendente: { select: { id: true, name: true } },
      avaliacao: { select: { id: true, name: true } },
      aplicador: { select: { id: true, name: true } },
    },
  });
};

const saveAnswers = async (id, answers, isDraft, userId, userRole) => {
  const aplicacao = await findById(id, userId, userRole);
  if (aplicacao.status === 'COMPLETED') {
    throw Object.assign(new Error('Aplicação já finalizada'), { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    for (const answer of answers) {
      await tx.resposta.upsert({
        where: { aplicacaoId_questionId: { aplicacaoId: id, questionId: answer.questionId } },
        create: {
          aplicacaoId: id,
          questionId: answer.questionId,
          valor: answer.value !== undefined ? JSON.parse(JSON.stringify({ v: answer.value })) : null,
        },
        update: {
          valor: answer.value !== undefined ? JSON.parse(JSON.stringify({ v: answer.value })) : null,
        },
      });
    }

    // O aplicador registrado na criação é preservado, mantendo a autoria da aplicação
    const newStatus = isDraft ? 'DRAFT' : aplicacao.status === 'PENDING' ? 'IN_PROGRESS' : aplicacao.status;
    await tx.aplicacao.update({
      where: { id },
      data: { status: newStatus },
    });
  });

  return findById(id, userId, userRole);
};

const finalize = async (id, observacoes, userId, userRole) => {
  const aplicacao = await findById(id, userId, userRole);
  if (aplicacao.status === 'COMPLETED') {
    throw Object.assign(new Error('Aplicação já finalizada'), { status: 400 });
  }

  const requiredQuestions = aplicacao.avaliacao.questions.filter((q) => q.required);
  const answeredIds = aplicacao.respostas.map((r) => r.questionId);
  const missing = requiredQuestions.filter((q) => !answeredIds.includes(q.id));
  if (missing.length > 0) {
    throw Object.assign(
      new Error(`Perguntas obrigatórias sem resposta: ${missing.map((q) => q.text).join(', ')}`),
      { status: 400 }
    );
  }

  return prisma.aplicacao.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      finalizadaAt: new Date(),
      ...(observacoes && { observacoes }),
    },
  });
};

const remove = async (id, userId, userRole) => {
  const aplicacao = await findById(id, userId, userRole);
  if (aplicacao.status === 'COMPLETED') {
    throw Object.assign(new Error('Não é possível excluir uma aplicação finalizada'), { status: 400 });
  }
  await prisma.aplicacao.delete({ where: { id } });
};

module.exports = { list, findById, create, saveAnswers, finalize, remove };
