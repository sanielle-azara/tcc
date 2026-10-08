const { describe, it, expect, beforeEach, vi } = require('vitest');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 422 quando body está vazio', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(422);
  });

  it('retorna 401 para credenciais inválidas — usuário inexistente', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nao@existe.com', password: 'Senha@123' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('retorna 401 para senha incorreta', async () => {
    const hash = await bcrypt.hash('SenhaCorreta@1', 12);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'prof@test.com', passwordHash: hash,
      role: 'PSICOPEDAGOGO', status: 'ACTIVE', deletedAt: null,
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'prof@test.com', password: 'SenhaErrada@1' });
    expect(res.status).toBe(401);
  });

  it('retorna 403 para usuário inativo', async () => {
    const hash = await bcrypt.hash('Senha@123', 12);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'prof@test.com', passwordHash: hash,
      role: 'PSICOPEDAGOGO', status: 'INACTIVE', deletedAt: null,
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'prof@test.com', password: 'Senha@123' });
    expect(res.status).toBe(403);
  });

  it('retorna 200 com tokens para credenciais válidas', async () => {
    const hash = await bcrypt.hash('Senha@123', 12);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', name: 'Prof', email: 'prof@test.com', passwordHash: hash,
      role: 'PSICOPEDAGOGO', status: 'ACTIVE', deletedAt: null,
    });
    prisma.refreshToken.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'prof@test.com', password: 'Senha@123' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe('prof@test.com');
  });
});

describe('GET /api/auth/me', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('retorna dados do usuário autenticado', async () => {
    const hash = await bcrypt.hash('Senha@123', 12);
    const user = {
      id: 'u1', name: 'Prof', email: 'prof@test.com', passwordHash: hash,
      role: 'PSICOPEDAGOGO', status: 'ACTIVE', deletedAt: null,
    };
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.refreshToken.create.mockResolvedValue({});

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'prof@test.com', password: 'Senha@123' });

    const token = loginRes.body.data.accessToken;

    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', name: 'Prof', email: 'prof@test.com', role: 'PSICOPEDAGOGO', status: 'ACTIVE',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('prof@test.com');
  });
});
