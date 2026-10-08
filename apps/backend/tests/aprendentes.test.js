const { describe, it, expect, beforeEach, vi } = require('vitest');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');

const makeUser = (role = 'PSICOPEDAGOGO') => ({
  id: 'user-001', name: 'Prof', email: 'prof@test.com',
  role, status: 'ACTIVE', deletedAt: null,
});

const makeAprendente = (responsavelId = 'user-001') => ({
  id: 'ap-001', name: 'João', birthDate: new Date('2015-01-01'),
  sexo: 'MASCULINO', responsavelNome: 'Maria', contatoPrincipal: '(31)99999-0001',
  responsavelId, createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
  historico: [], _count: { aplicacoes: 0 },
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

describe('GET /api/aprendentes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).get('/api/aprendentes');
    expect(res.status).toBe(401);
  });

  it('retorna lista filtrada pelo responsavelId do usuário autenticado', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.user.findUnique.mockResolvedValue(makeUser());
    prisma.aprendente.findMany.mockResolvedValue([makeAprendente()]);
    prisma.aprendente.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/aprendentes')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    // confirma que o filtro de ownership foi aplicado na query
    const [queryArg] = prisma.aprendente.findMany.mock.calls[0];
    expect(queryArg.where).toMatchObject({ responsavelId: 'user-001' });
  });

  it('ADMIN não recebe filtro de responsavelId', async () => {
    const token = await getToken('ADMIN');
    prisma.user.findUnique.mockResolvedValue(makeUser('ADMIN'));
    prisma.aprendente.findMany.mockResolvedValue([]);
    prisma.aprendente.count.mockResolvedValue(0);

    await request(app)
      .get('/api/aprendentes')
      .set('Authorization', `Bearer ${token}`);

    const [queryArg] = prisma.aprendente.findMany.mock.calls[0];
    expect(queryArg.where).not.toHaveProperty('responsavelId');
  });
});

describe('POST /api/aprendentes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 403 para perfil VIEWER', async () => {
    const token = await getToken('VIEWER');
    prisma.user.findUnique.mockResolvedValue(makeUser('VIEWER'));

    const res = await request(app)
      .post('/api/aprendentes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Novo', birthDate: '2015-01-01', sexo: 'MASCULINO',
        responsavelNome: 'Mãe', contatoPrincipal: '(31)99999-0001',
      });
    expect(res.status).toBe(403);
  });

  it('cria aprendente com responsavelId do usuário logado', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.user.findUnique.mockResolvedValue(makeUser());
    prisma.aprendente.create.mockResolvedValue(makeAprendente());

    const res = await request(app)
      .post('/api/aprendentes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Novo', birthDate: '2015-01-01', sexo: 'MASCULINO',
        responsavelNome: 'Mãe', contatoPrincipal: '(31)99999-0001',
      });

    expect(res.status).toBe(201);
    const [createArg] = prisma.aprendente.create.mock.calls[0];
    expect(createArg.data.responsavelId).toBe('user-001');
  });
});

describe('GET /api/aprendentes/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 quando aprendente pertence a outro usuário', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.user.findUnique.mockResolvedValue(makeUser());
    // findFirst retorna null pois o filtro de responsavelId não bate
    prisma.aprendente.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/aprendentes/ap-outro')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('retorna o aprendente quando pertence ao usuário', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.user.findUnique.mockResolvedValue(makeUser());
    prisma.aprendente.findFirst.mockResolvedValue(makeAprendente());

    const res = await request(app)
      .get('/api/aprendentes/ap-001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('ap-001');
  });
});
