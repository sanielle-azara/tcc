const prisma = require('../../config/prisma');
const { parsePagination } = require('@psicopedagogia/shared-utils');

const list = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {
    deletedAt: null,
    ...(query.search && {
      OR: [
        { name: { contains: query.search } },
        { responsavelNome: { contains: query.search } },
        { escolaNome: { contains: query.search } },
      ],
    }),
    ...(query.sexo && { sexo: query.sexo }),
  };

  const [data, total] = await Promise.all([
    prisma.aprendente.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, birthDate: true, sexo: true,
        responsavelNome: true, contatoPrincipal: true, escolaNome: true, escolaSerie: true, createdAt: true,
      },
    }),
    prisma.aprendente.count({ where }),
  ]);

  return { data, total, page, limit };
};

const findById = async (id) => {
  const item = await prisma.aprendente.findFirst({
    where: { id, deletedAt: null },
    include: {
      historico: { orderBy: { data: 'desc' } },
      _count: { select: { aplicacoes: true } },
    },
  });
  if (!item) throw Object.assign(new Error('Aprendente não encontrado'), { status: 404 });
  return item;
};

const create = async (data) => {
  return prisma.aprendente.create({
    data: {
      ...data,
      birthDate: new Date(data.birthDate),
    },
  });
};

const update = async (id, data) => {
  await findById(id);
  const updateData = { ...data };
  if (data.birthDate) updateData.birthDate = new Date(data.birthDate);
  return prisma.aprendente.update({ where: { id }, data: updateData });
};

const remove = async (id) => {
  await findById(id);
  await prisma.aprendente.update({ where: { id }, data: { deletedAt: new Date() } });
};

const addHistorico = async (aprendentId, descricao) => {
  await findById(aprendentId);
  return prisma.historicoAprendente.create({
    data: { aprendentId, descricao },
  });
};

const listHistorico = async (aprendentId) => {
  await findById(aprendentId);
  return prisma.historicoAprendente.findMany({
    where: { aprendentId },
    orderBy: { data: 'desc' },
  });
};

module.exports = { list, findById, create, update, remove, addHistorico, listHistorico };
