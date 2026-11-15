const prisma = require('../../config/prisma');
const { parsePagination } = require('@psicopedagogia/shared-utils');

// A titularidade de uma aplicação segue a do aprendente: somente o psicopedagogo
// responsável pelo aprendente acessa suas aplicações.
const ownerFilter = (userId) => ({ aprendente: { responsavelId: userId } });

const list = async (query, userId) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {
    ...ownerFilter(userId),
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

const findById = async (id, userId) => {
  const item = await prisma.aplicacao.findFirst({
    where: { id, ...ownerFilter(userId) },
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

const create = async (data, userId) => {
  const aprendente = await prisma.aprendente.findFirst({
    where: { id: data.aprendentId, deletedAt: null, responsavelId: userId },
  });
  if (!aprendente) throw Object.assign(new Error('Aprendente não encontrado'), { status: 404 });

  const avaliacao = await prisma.avaliacao.findFirst({
    where: { id: data.avaliacaoId, deletedAt: null, autorId: userId },
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

const saveAnswers = async (id, answers, isDraft, userId) => {
  const aplicacao = await findById(id, userId);
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

  return findById(id, userId);
};

// Resposta em branco (nula, texto vazio ou nenhuma opção marcada) não conta como respondida;
// 0 e false são respostas válidas
const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

const finalize = async (id, observacoes, userId) => {
  const aplicacao = await findById(id, userId);
  if (aplicacao.status === 'COMPLETED') {
    throw Object.assign(new Error('Aplicação já finalizada'), { status: 400 });
  }

  const requiredQuestions = aplicacao.avaliacao.questions.filter((q) => q.required);
  const answeredIds = aplicacao.respostas.filter((r) => hasValue(r.valor?.v)).map((r) => r.questionId);
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

const remove = async (id, userId) => {
  const aplicacao = await findById(id, userId);
  if (aplicacao.status === 'COMPLETED') {
    throw Object.assign(new Error('Não é possível excluir uma aplicação finalizada'), { status: 400 });
  }
  await prisma.aplicacao.delete({ where: { id } });
};

module.exports = { list, findById, create, saveAnswers, finalize, remove };
