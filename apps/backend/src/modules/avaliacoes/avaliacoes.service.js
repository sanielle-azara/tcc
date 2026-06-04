const prisma = require('../../config/prisma');
const { parsePagination } = require('@psicopedagogia/shared-utils');

const list = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {
    deletedAt: null,
    ...(query.search && {
      OR: [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
        { category: { contains: query.search } },
      ],
    }),
    ...(query.status && { status: query.status }),
    ...(query.category && { category: query.category }),
  };

  const [data, total] = await Promise.all([
    prisma.avaliacao.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, description: true, category: true,
        version: true, status: true, createdAt: true,
        _count: { select: { questions: true, aplicacoes: true } },
      },
    }),
    prisma.avaliacao.count({ where }),
  ]);

  return { data, total, page, limit };
};

const findById = async (id) => {
  const item = await prisma.avaliacao.findFirst({
    where: { id, deletedAt: null },
    include: {
      questions: { orderBy: { order: 'asc' } },
      _count: { select: { aplicacoes: true } },
      versions: { select: { id: true, version: true, status: true, createdAt: true } },
    },
  });
  if (!item) throw Object.assign(new Error('Avaliação não encontrada'), { status: 404 });
  return item;
};

const create = async (data) => {
  const { questions, ...avaliacaoData } = data;
  return prisma.avaliacao.create({
    data: {
      ...avaliacaoData,
      questions: {
        create: questions.map((q) => ({
          text: q.text,
          type: q.type,
          required: q.required ?? true,
          order: q.order,
          options: q.options ? JSON.stringify(q.options) : null,
          scaleMin: q.scaleMin,
          scaleMax: q.scaleMax,
          scaleMinLabel: q.scaleMinLabel,
          scaleMaxLabel: q.scaleMaxLabel,
          helpText: q.helpText,
        })),
      },
    },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
};

const update = async (id, data) => {
  const avaliacao = await findById(id);

  if (avaliacao._count.aplicacoes > 0 && data.questions) {
    return createNewVersion(id, data);
  }

  const { questions, ...avaliacaoData } = data;
  if (questions) {
    await prisma.question.deleteMany({ where: { avaliacaoId: id } });
    await prisma.question.createMany({
      data: questions.map((q) => ({
        avaliacaoId: id,
        text: q.text,
        type: q.type,
        required: q.required ?? true,
        order: q.order,
        options: q.options ? JSON.stringify(q.options) : null,
        scaleMin: q.scaleMin,
        scaleMax: q.scaleMax,
        scaleMinLabel: q.scaleMinLabel,
        scaleMaxLabel: q.scaleMaxLabel,
        helpText: q.helpText,
      })),
    });
  }

  return prisma.avaliacao.update({
    where: { id },
    data: avaliacaoData,
    include: { questions: { orderBy: { order: 'asc' } } },
  });
};

const createNewVersion = async (parentId, data) => {
  const parent = await findById(parentId);
  const { questions, ...avaliacaoData } = data;

  await prisma.avaliacao.update({ where: { id: parentId }, data: { status: 'ARCHIVED' } });

  return prisma.avaliacao.create({
    data: {
      name: avaliacaoData.name || parent.name,
      description: avaliacaoData.description || parent.description,
      category: avaliacaoData.category || parent.category,
      status: avaliacaoData.status || 'ACTIVE',
      version: parent.version + 1,
      parentId,
      questions: {
        create: (questions || parent.questions).map((q) => ({
          text: q.text,
          type: q.type,
          required: q.required ?? true,
          order: q.order,
          options: q.options ? JSON.stringify(q.options) : null,
          scaleMin: q.scaleMin,
          scaleMax: q.scaleMax,
          scaleMinLabel: q.scaleMinLabel,
          scaleMaxLabel: q.scaleMaxLabel,
          helpText: q.helpText,
        })),
      },
    },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
};

const remove = async (id) => {
  await findById(id);
  await prisma.avaliacao.update({ where: { id }, data: { deletedAt: new Date() } });
};

const getCategories = async () => {
  const result = await prisma.avaliacao.groupBy({
    by: ['category'],
    where: { deletedAt: null, category: { not: null } },
  });
  return result.map((r) => r.category).filter(Boolean);
};

module.exports = { list, findById, create, update, remove, getCategories };
