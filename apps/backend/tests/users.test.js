import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';

// App e Prisma são carregados pelo require nativo para usar o mock registrado em setup.js
const nodeRequire = createRequire(import.meta.url);
const app = nodeRequire('../src/app');
const prisma = nodeRequire('../src/config/prisma');
const bcrypt = nodeRequire('bcryptjs');

const makeUser = (role = 'ADMIN') => ({
  id: 'admin-1', name: 'Admin', email: 'admin@test.com',
  role, status: 'ACTIVE', deletedAt: null,
});

async function getToken(role = 'ADMIN') {
  const hash = await bcrypt.hash('Senha@123', 4);
  const user = makeUser(role);
  user.passwordHash = hash;
  prisma.user.findUnique.mockResolvedValue(user);
  prisma.refreshToken.create.mockResolvedValue({});

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'Senha@123' });
  prisma.user.findUnique.mockResolvedValue(makeUser(role));
  return res.body.data.accessToken;
}

const profissional = (id, extra = {}) => ({
  id, name: `Prof ${id}`, email: `${id}@test.com`, role: 'PSICOPEDAGOGO', status: 'ACTIVE', ...extra,
});

describe('POST /api/users/:id/transferir-aprendentes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('transfere aprendentes e instrumentos sem ler os dados clínicos', async () => {
    const token = await getToken('ADMIN');
    prisma.user.findFirst
      .mockResolvedValueOnce({ id: 'u-orig', aprendentes: [{ id: 'ap-1' }, { id: 'ap-2' }] })
      .mockResolvedValueOnce(profissional('u-dest'));
    prisma.aprendente.update.mockImplementation(({ where, data }) =>
      Promise.resolve({ id: where.id, responsavelId: data.responsavelId }));
    prisma.avaliacao.updateMany.mockResolvedValue({ count: 3 });

    const res = await request(app)
      .post('/api/users/u-orig/transferir-aprendentes')
      .set('Authorization', `Bearer ${token}`)
      .send({ destinoId: 'u-dest' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ aprendentes: 2, avaliacoes: 3 });
    expect(prisma.aprendente.update).toHaveBeenCalledTimes(2);
    const [updateArg] = prisma.aprendente.update.mock.calls[0];
    expect(updateArg).toMatchObject({ where: { id: 'ap-1' }, data: { responsavelId: 'u-dest' } });
    const [instrumentosArg] = prisma.avaliacao.updateMany.mock.calls[0];
    expect(instrumentosArg).toMatchObject({ where: { autorId: 'u-orig' }, data: { autorId: 'u-dest' } });
    // A transferência não consulta o conteúdo dos aprendentes
    expect(prisma.aprendente.findMany).not.toHaveBeenCalled();
    expect(prisma.aprendente.findFirst).not.toHaveBeenCalled();
  });

  it('recusa destino que não é psicopedagogo ativo', async () => {
    const token = await getToken('ADMIN');
    prisma.user.findFirst
      .mockResolvedValueOnce({ id: 'u-orig', aprendentes: [{ id: 'ap-1' }] })
      .mockResolvedValueOnce(profissional('u-dest', { role: 'ADMIN' }));

    const res = await request(app)
      .post('/api/users/u-orig/transferir-aprendentes')
      .set('Authorization', `Bearer ${token}`)
      .send({ destinoId: 'u-dest' });

    expect(res.status).toBe(422);
    expect(prisma.aprendente.update).not.toHaveBeenCalled();
  });

  it('recusa origem igual ao destino', async () => {
    const token = await getToken('ADMIN');

    const res = await request(app)
      .post('/api/users/u-orig/transferir-aprendentes')
      .set('Authorization', `Bearer ${token}`)
      .send({ destinoId: 'u-orig' });

    expect(res.status).toBe(400);
    expect(prisma.aprendente.update).not.toHaveBeenCalled();
  });

  it('é exclusiva do ADMIN', async () => {
    const token = await getToken('PSICOPEDAGOGO');

    const res = await request(app)
      .post('/api/users/u-orig/transferir-aprendentes')
      .set('Authorization', `Bearer ${token}`)
      .send({ destinoId: 'u-dest' });

    expect(res.status).toBe(403);
  });
});

describe('Proteção dos aprendentes na gestão de usuários', () => {
  beforeEach(() => vi.clearAllMocks());

  it('não exclui profissional que ainda é responsável por aprendentes', async () => {
    const token = await getToken('ADMIN');
    prisma.user.findFirst.mockResolvedValue(profissional('u-orig'));
    prisma.aprendente.count.mockResolvedValue(2);

    const res = await request(app).delete('/api/users/u-orig').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('não promove a ADMIN profissional que ainda é responsável por aprendentes', async () => {
    const token = await getToken('ADMIN');
    prisma.user.findFirst.mockResolvedValue(profissional('u-orig'));
    prisma.aprendente.count.mockResolvedValue(1);

    const res = await request(app)
      .put('/api/users/u-orig')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(409);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('lista usuários com a contagem de aprendentes, sem dados das crianças', async () => {
    const token = await getToken('ADMIN');
    prisma.user.findMany.mockResolvedValue([{ ...profissional('u-orig'), _count: { aprendentes: 2 } }]);
    prisma.user.count.mockResolvedValue(1);

    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0]._count.aprendentes).toBe(2);
    const [queryArg] = prisma.user.findMany.mock.calls[0];
    expect(queryArg.select._count).toEqual({ select: { aprendentes: { where: { deletedAt: null } } } });
    expect(queryArg.select).not.toHaveProperty('aprendentes');
  });
});

describe('GET /api/dashboard', () => {
  beforeEach(() => vi.clearAllMocks());

  const mockStats = () => {
    prisma.aprendente.count.mockResolvedValue(4);
    prisma.avaliacao.count.mockResolvedValue(2);
    prisma.aplicacao.count.mockResolvedValue(5);
    prisma.aplicacao.groupBy.mockResolvedValue([{ status: 'COMPLETED', _count: { id: 5 } }]);
    prisma.aplicacao.findMany.mockResolvedValue([{ id: 'apl-1', aprendente: { id: 'ap-1', name: 'João' } }]);
    prisma.avaliacao.findMany.mockResolvedValue([]);
  };

  it('ADMIN recebe só contagens, sem a lista que identifica as crianças', async () => {
    const token = await getToken('ADMIN');
    mockStats();

    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalAprendentes).toBe(4);
    expect(res.body.data.ultimasAplicacoes).toBeNull();
    expect(prisma.aplicacao.findMany).not.toHaveBeenCalled();
  });

  it('PSICOPEDAGOGO recebe as últimas aplicações dos próprios aprendentes', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    mockStats();

    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.ultimasAplicacoes).toHaveLength(1);
    const [queryArg] = prisma.aplicacao.findMany.mock.calls[0];
    expect(queryArg.where).toEqual({ aprendente: { responsavelId: 'admin-1' } });
  });
});
