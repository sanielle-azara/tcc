import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';

// App e Prisma são carregados pelo require nativo para usar o mock registrado em setup.js
const nodeRequire = createRequire(import.meta.url);
const app = nodeRequire('../src/app');
const prisma = nodeRequire('../src/config/prisma');
const bcrypt = nodeRequire('bcryptjs');

const makeUser = (role = 'PSICOPEDAGOGO') => ({
  id: 'user-001', name: 'Prof', email: 'prof@test.com',
  role, status: 'ACTIVE', deletedAt: null,
});

async function getToken(role = 'PSICOPEDAGOGO') {
  const hash = await bcrypt.hash('Senha@123', 4);
  const user = makeUser(role);
  user.passwordHash = hash;
  prisma.user.findUnique.mockResolvedValue(user);
  prisma.refreshToken.create.mockResolvedValue({});

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'prof@test.com', password: 'Senha@123' });
  prisma.user.findUnique.mockResolvedValue(makeUser(role));
  return res.body.data.accessToken;
}

const ownerWhere = { aplicacao: { aprendente: { responsavelId: 'user-001' } } };

describe('GET /api/relatorios', () => {
  beforeEach(() => vi.clearAllMocks());

  it('filtra relatórios pelo responsável do aprendente', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.relatorio.findMany.mockResolvedValue([]);
    prisma.relatorio.count.mockResolvedValue(0);

    const res = await request(app).get('/api/relatorios').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const [queryArg] = prisma.relatorio.findMany.mock.calls[0];
    expect(queryArg.where).toMatchObject(ownerWhere);
    const [countArg] = prisma.relatorio.count.mock.calls[0];
    expect(countArg.where).toMatchObject(ownerWhere);
  });

  it('ADMIN não acessa relatórios: 403 sem consultar o banco', async () => {
    const token = await getToken('ADMIN');

    const res = await request(app).get('/api/relatorios').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(prisma.relatorio.findMany).not.toHaveBeenCalled();
  });
});

describe('Consulta de relatório de outro profissional', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET /:id retorna 404', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.relatorio.findFirst.mockResolvedValue(null);

    const res = await request(app).get('/api/relatorios/rel-outro').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    const [queryArg] = prisma.relatorio.findFirst.mock.calls[0];
    expect(queryArg.where).toMatchObject({ id: 'rel-outro', ...ownerWhere });
  });

  it('GET /aplicacao/:aplicacaoId retorna 404', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.relatorio.findFirst.mockResolvedValue(null);

    const res = await request(app).get('/api/relatorios/aplicacao/apl-outra').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    const [queryArg] = prisma.relatorio.findFirst.mock.calls[0];
    expect(queryArg.where).toMatchObject({ aplicacaoId: 'apl-outra', ...ownerWhere });
  });
});

describe('POST /api/relatorios', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 para aplicação de outro profissional e não grava', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aplicacao.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/relatorios')
      .set('Authorization', `Bearer ${token}`)
      .send({ aplicacaoId: 'apl-outra', conclusao: 'x' });

    expect(res.status).toBe(404);
    const [queryArg] = prisma.aplicacao.findFirst.mock.calls[0];
    expect(queryArg.where).toMatchObject({ id: 'apl-outra', aprendente: { responsavelId: 'user-001' } });
    expect(prisma.relatorio.upsert).not.toHaveBeenCalled();
  });

  it('preserva o autor original ao atualizar o relatório', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aplicacao.findFirst.mockResolvedValue({ id: 'apl-001', status: 'COMPLETED' });
    prisma.relatorio.upsert.mockResolvedValue({ id: 'rel-001' });

    const res = await request(app)
      .post('/api/relatorios')
      .set('Authorization', `Bearer ${token}`)
      .send({ aplicacaoId: 'apl-001', conclusao: 'Conclusão' });

    expect(res.status).toBe(200);
    const [upsertArg] = prisma.relatorio.upsert.mock.calls[0];
    expect(upsertArg.create.autorId).toBe('user-001');
    expect(upsertArg.update).not.toHaveProperty('autorId');
  });
});

describe('Dashboard e usuários', () => {
  beforeEach(() => vi.clearAllMocks());

  it('dashboard filtra aplicações pelo responsável do aprendente', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aprendente.count.mockResolvedValue(0);
    prisma.avaliacao.count.mockResolvedValue(0);
    prisma.aplicacao.count.mockResolvedValue(0);
    prisma.aplicacao.groupBy.mockResolvedValue([]);
    prisma.aplicacao.findMany.mockResolvedValue([]);
    prisma.avaliacao.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const [countArg] = prisma.aplicacao.count.mock.calls[0];
    expect(countArg.where).toMatchObject({ aprendente: { responsavelId: 'user-001' } });
  });

  it('PSICOPEDAGOGO não lista usuários do sistema', async () => {
    const token = await getToken('PSICOPEDAGOGO');

    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
