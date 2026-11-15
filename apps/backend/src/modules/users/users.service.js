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
      select: {
        id: true, name: true, email: true, role: true, status: true, createdAt: true,
        // Apenas a contagem: o ADMIN sabe quantos aprendentes transferir, não quem são
        _count: { select: { aprendentes: { where: { deletedAt: null } } } },
      },
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

const countAprendentes = (userId) =>
  prisma.aprendente.count({ where: { responsavelId: userId, deletedAt: null } });

const conflict = (message) => Object.assign(new Error(message), { status: 409 });

const update = async (id, data) => {
  const current = await findById(id);
  // O ADMIN não acessa dados clínicos: promover quem ainda é responsável por
  // aprendentes deixaria essas crianças sem profissional com acesso a elas
  if (data.role === 'ADMIN' && current.role !== 'ADMIN' && (await countAprendentes(id)) > 0) {
    throw conflict('Transfira os aprendentes deste profissional antes de torná-lo administrador');
  }
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
  if ((await countAprendentes(id)) > 0) {
    throw conflict('Transfira os aprendentes deste profissional antes de excluí-lo');
  }
  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
};

// Continuidade do atendimento quando um profissional deixa o serviço: o ADMIN passa
// os aprendentes ativos e os instrumentos de um psicopedagogo para outro, sem ler os
// dados clínicos. Os ids vêm pela relação do usuário, cuja leitura não é auditada como
// acesso às crianças; cada aprendente transferido gera um registro de alteração
// (responsavelId de/para) associado a ele na auditoria.
const transferirAprendentes = async (origemId, destinoId) => {
  if (origemId === destinoId) {
    throw Object.assign(new Error('Origem e destino devem ser profissionais diferentes'), { status: 400 });
  }
  const origem = await prisma.user.findFirst({
    where: { id: origemId, deletedAt: null },
    select: { id: true, aprendentes: { where: { deletedAt: null }, select: { id: true } } },
  });
  if (!origem) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 });

  const destino = await prisma.user.findFirst({
    where: { id: destinoId, deletedAt: null },
    select: { id: true, role: true, status: true },
  });
  if (!destino) throw Object.assign(new Error('Profissional de destino não encontrado'), { status: 404 });
  if (destino.role !== 'PSICOPEDAGOGO' || destino.status !== 'ACTIVE') {
    throw Object.assign(new Error('O destino deve ser um psicopedagogo ativo'), { status: 422 });
  }

  const ids = origem.aprendentes.map((a) => a.id);
  const results = await prisma.$transaction([
    ...ids.map((id) => prisma.aprendente.update({
      where: { id },
      data: { responsavelId: destinoId },
      select: { id: true, responsavelId: true },
    })),
    // Sem os instrumentos, o novo responsável não poderia aplicar os mesmos protocolos
    prisma.avaliacao.updateMany({ where: { autorId: origemId, deletedAt: null }, data: { autorId: destinoId } }),
  ]);

  return { aprendentes: ids.length, avaliacoes: results[results.length - 1].count };
};

module.exports = { list, findById, create, update, remove, transferirAprendentes };
