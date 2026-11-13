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

const logs = [
  { id: 'l1', userId: 'admin-1', userRole: 'ADMIN', action: 'READ', entity: 'Aprendente', entityId: 'ap-001', aprendenteId: 'ap-001', timestamp: new Date().toISOString() },
];

describe('GET /api/auditoria', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.auditLog.findMany.mockResolvedValue(logs);
    prisma.auditLog.count.mockResolvedValue(1);
    prisma.user.findMany.mockResolvedValue([{ id: 'admin-1', name: 'Administrador', email: 'admin@x.com' }]);
  });

  it('ADMIN consulta todo o registro, com filtros e o nome do usuário', async () => {
    const token = await getToken('ADMIN');

    const res = await request(app)
      .get('/api/auditoria?entity=Aprendente&action=READ')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].user.name).toBe('Administrador');
    const [queryArg] = prisma.auditLog.findMany.mock.calls[0];
    expect(queryArg.where).toEqual({ entity: 'Aprendente', action: 'READ' });
    expect(queryArg.orderBy).toEqual({ timestamp: 'desc' });
  });

  it('PSICOPEDAGOGO consulta os acessos de um aprendente próprio, incluindo os do ADMIN', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aprendente.findFirst.mockResolvedValue({ id: 'ap-001' });

    const res = await request(app)
      .get('/api/auditoria?aprendenteId=ap-001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].userRole).toBe('ADMIN');
    const [ownerArg] = prisma.aprendente.findFirst.mock.calls[0];
    expect(ownerArg.where).toMatchObject({ id: 'ap-001', responsavelId: 'user-001' });
    const [queryArg] = prisma.auditLog.findMany.mock.calls[0];
    expect(queryArg.where).toEqual({ aprendenteId: 'ap-001' });
  });

  it('PSICOPEDAGOGO não consulta o registro geral', async () => {
    const token = await getToken('PSICOPEDAGOGO');

    const res = await request(app).get('/api/auditoria').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it('PSICOPEDAGOGO não consulta os acessos de aprendente de outro profissional', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aprendente.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/auditoria?aprendenteId=ap-outro')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it('rejeita filtros inválidos', async () => {
    const token = await getToken('ADMIN');

    const res = await request(app).get('/api/auditoria?action=APAGAR').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(422);
  });

  it('exige autenticação', async () => {
    const res = await request(app).get('/api/auditoria');
    expect(res.status).toBe(401);
  });
});

describe('Auditoria de login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registra o login bem-sucedido', async () => {
    await getToken('PSICOPEDAGOGO');

    const actions = prisma.auditLog.create.mock.calls.map(([{ data }]) => data);
    expect(actions).toContainEqual(expect.objectContaining({ action: 'LOGIN', userId: 'user-001', userRole: 'PSICOPEDAGOGO', entity: 'User' }));
  });

  it('registra a tentativa de login com senha incorreta, sem guardar a senha', async () => {
    const hash = await bcrypt.hash('SenhaCorreta@1', 4);
    prisma.user.findUnique.mockResolvedValue({ ...makeUser(), passwordHash: hash });

    const res = await request(app).post('/api/auth/login').send({ email: 'prof@test.com', password: 'SenhaErrada@1' });

    expect(res.status).toBe(401);
    const [{ data }] = prisma.auditLog.create.mock.calls[0];
    expect(data).toMatchObject({ action: 'LOGIN_FAILED', userId: 'user-001', diff: { email: 'prof@test.com', motivo: 'senha incorreta' } });
    expect(JSON.stringify(data)).not.toContain('SenhaErrada');
  });
});
