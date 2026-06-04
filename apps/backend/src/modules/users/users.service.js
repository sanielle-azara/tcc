const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');
const { parsePagination } = require('@psicopedagogia/shared-utils');

const list = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {
    deletedAt: null,
    ...(query.search && {
      OR: [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
      ],
    }),
    ...(query.status && { status: query.status }),
    ...(query.role && { role: query.role }),
  };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total, page, limit };
};

const findById = async (id) => {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, updatedAt: true },
  });
  if (!user) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 });
  return user;
};

const create = async (data) => {
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw Object.assign(new Error('Email já cadastrado'), { status: 409 });

  const passwordHash = await bcrypt.hash(data.password, 12);
  return prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: data.role, status: data.status },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  });
};

const update = async (id, data) => {
  await findById(id);
  if (data.email) {
    const exists = await prisma.user.findFirst({ where: { email: data.email, NOT: { id } } });
    if (exists) throw Object.assign(new Error('Email já cadastrado'), { status: 409 });
  }
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, status: true, updatedAt: true },
  });
};

const remove = async (id) => {
  await findById(id);
  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, findById, create, update, remove };
