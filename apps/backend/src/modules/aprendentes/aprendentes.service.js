const prisma = require('../../config/prisma');
const { parsePagination } = require('@psicopedagogia/shared-utils');

const ownerFilter = (userId, userRole) =>
  userRole === 'ADMIN' ? {} : { responsavelId: userId };

const list = async (query, userId, userRole) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {
    deletedAt: null,
    ...ownerFilter(userId, userRole),
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

const findById = async (id, userId, userRole) => {
  const where = { id, deletedAt: null, ...ownerFilter(userId, userRole) };
  const item = await prisma.aprendente.findFirst({
    where,
    include: {
      historico: { orderBy: { data: 'desc' } },
      _count: { select: { aplicacoes: true } },
    },
  });
  if (!item) throw Object.assign(new Error('Aprendente não encontrado'), { status: 404 });
  return item;
};

const create = async (data, userId) => {
  return prisma.aprendente.create({
    data: {
      ...data,
      birthDate: new Date(data.birthDate),
      responsavelId: userId,
    },
  });
};

const update = async (id, data, userId, userRole) => {
  await findById(id, userId, userRole);
  const updateData = { ...data };
  if (data.birthDate) updateData.birthDate = new Date(data.birthDate);
  return prisma.aprendente.update({ where: { id }, data: updateData });
};

const remove = async (id, userId, userRole) => {
  await findById(id, userId, userRole);
  await prisma.aprendente.update({ where: { id }, data: { deletedAt: new Date() } });
};

const addHistorico = async (aprendentId, descricao, userId, userRole) => {
  await findById(aprendentId, userId, userRole);
  return prisma.historicoAprendente.create({
    data: { aprendentId, descricao },
  });
};

const listHistorico = async (aprendentId, userId, userRole) => {
  await findById(aprendentId, userId, userRole);
  return prisma.historicoAprendente.findMany({
    where: { aprendentId },
    orderBy: { data: 'desc' },
  });
};

module.exports = { list, findById, create, update, remove, addHistorico, listHistorico };
