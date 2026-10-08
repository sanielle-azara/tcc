const { describe, it, expect, beforeEach, vi } = require('vitest');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');

const makeUser = (role = 'PSICOPEDAGOGO') => ({
  id: 'user-001', name: 'Prof', email: 'prof@test.com',
  role, status: 'ACTIVE', deletedAt: null,
});

const makeAvaliacao = (autorId = 'user-001', aplicacoesCount = 0) => ({
  id: 'av-001', name: 'Avaliação de Leitura', description: null,
  category: 'Linguagem', version: 1, status: 'ACTIVE',
  parentId: null, autorId, deletedAt: null,
  createdAt: new Date(), updatedAt: new Date(),
  questions: [], _count: { aplicacoes: aplicacoesCount }, versions: [],
});

async function getToken(role = 'PSICOPEDAGOGO') {
  const hash = await bcrypt.hash('Senha@123', 12);
  const user = makeUser(role);
  user.passwordHash = hash;
  prisma.user.findUnique.mockResolvedValue(user);
  prisma.refreshToken.create.mockResolvedValue({});

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'prof@test.com', password: 'Senha@123' });
  return res.body.data.accessToken;
}

describe('GET /api/avaliacoes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).get('/api/avaliacoes');
    expect(res.status).toBe(401);
  });

  it('filtra avaliações por autorId do usuário autenticado', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.user.findUnique.mockResolvedValue(makeUser());
    prisma.avaliacao.findMany.mockResolvedValue([makeAvaliacao()]);
    prisma.avaliacao.count.mockResolvedValue(1);

    await request(app)
      .get('/api/avaliacoes')
      .set('Authorization', `Bearer ${token}`);

    const [queryArg] = prisma.avaliacao.findMany.mock.calls[0];
    expect(queryArg.where).toMatchObject({ autorId: 'user-001' });
  });

  it('ADMIN não recebe filtro de autorId', async () => {
    const token = await getToken('ADMIN');
    prisma.user.findUnique.mockResolvedValue(makeUser('ADMIN'));
    prisma.avaliacao.findMany.mockResolvedValue([]);
    prisma.avaliacao.count.mockResolvedValue(0);

    await request(app)
      .get('/api/avaliacoes')
      .set('Authorization', `Bearer ${token}`);

    const [queryArg] = prisma.avaliacao.findMany.mock.calls[0];
    expect(queryArg.where).not.toHaveProperty('autorId');
  });
});

describe('POST /api/avaliacoes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 403 para perfil VIEWER', async () => {
    const token = await getToken('VIEWER');
    prisma.user.findUnique.mockResolvedValue(makeUser('VIEWER'));

    const res = await request(app)
      .post('/api/avaliacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nova', questions: [] });
    expect(res.status).toBe(403);
  });

  it('cria avaliação com autorId do usuário logado', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.user.findUnique.mockResolvedValue(makeUser());
    const created = { ...makeAvaliacao(), questions: [] };
    prisma.avaliacao.create.mockResolvedValue(created);

    const res = await request(app)
      .post('/api/avaliacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Nova Avaliação',
        questions: [{ text: 'Pergunta 1', type: 'TEXT', required: true, order: 1 }],
      });

    expect(res.status).toBe(201);
    const [createArg] = prisma.avaliacao.create.mock.calls[0];
    expect(createArg.data.autorId).toBe('user-001');
  });
});

describe('GET /api/avaliacoes/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 quando avaliação pertence a outro usuário', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.user.findUnique.mockResolvedValue(makeUser());
    prisma.avaliacao.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/avaliacoes/av-outro')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('Versionamento de avaliações', () => {
  beforeEach(() => vi.clearAllMocks());

  it('cria nova versão quando avaliação já tem aplicações', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.user.findUnique.mockResolvedValue(makeUser());
    // findFirst retorna avaliação com 1 aplicação
    prisma.avaliacao.findFirst.mockResolvedValue(makeAvaliacao('user-001', 1));
    prisma.avaliacao.update.mockResolvedValue({});
    const novaVersao = { ...makeAvaliacao(), version: 2, parentId: 'av-001', questions: [] };
    prisma.avaliacao.create.mockResolvedValue(novaVersao);

    const res = await request(app)
      .put('/api/avaliacoes/av-001')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Avaliação v2',
        questions: [{ text: 'Nova pergunta', type: 'TEXT', required: true, order: 1 }],
      });

    expect(res.status).toBe(200);
    // deve ter chamado create (nova versão) e não apenas update
    expect(prisma.avaliacao.create).toHaveBeenCalled();
    const [createArg] = prisma.avaliacao.create.mock.calls[0];
    expect(createArg.data.parentId).toBe('av-001');
    expect(createArg.data.autorId).toBe('user-001');
  });
});
