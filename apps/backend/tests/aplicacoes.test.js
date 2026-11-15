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

const makeAplicacao = (status = 'IN_PROGRESS') => ({
  id: 'apl-001', aprendentId: 'ap-001', avaliacaoId: 'av-001', aplicadorId: 'user-001',
  status, respostas: [], relatorio: null,
  aprendente: { id: 'ap-001', name: 'João', responsavelId: 'user-001' },
  avaliacao: { id: 'av-001', name: 'Leitura', questions: [] },
  aplicador: { id: 'user-001', name: 'Prof' },
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

describe('GET /api/aplicacoes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('filtra aplicações pelo responsável do aprendente', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aplicacao.findMany.mockResolvedValue([]);
    prisma.aplicacao.count.mockResolvedValue(0);

    const res = await request(app).get('/api/aplicacoes').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const [queryArg] = prisma.aplicacao.findMany.mock.calls[0];
    expect(queryArg.where).toMatchObject({ aprendente: { responsavelId: 'user-001' } });
    const [countArg] = prisma.aplicacao.count.mock.calls[0];
    expect(countArg.where).toMatchObject({ aprendente: { responsavelId: 'user-001' } });
  });

  it('ADMIN não acessa aplicações: 403 sem consultar o banco', async () => {
    const token = await getToken('ADMIN');

    const res = await request(app).get('/api/aplicacoes').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(prisma.aplicacao.findMany).not.toHaveBeenCalled();
  });
});

describe('GET /api/aplicacoes/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 quando a aplicação é de aprendente de outro profissional', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aplicacao.findFirst.mockResolvedValue(null);

    const res = await request(app).get('/api/aplicacoes/apl-outra').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    const [queryArg] = prisma.aplicacao.findFirst.mock.calls[0];
    expect(queryArg.where).toMatchObject({ id: 'apl-outra', aprendente: { responsavelId: 'user-001' } });
  });

  it('retorna a aplicação quando pertence ao profissional', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aplicacao.findFirst.mockResolvedValue(makeAplicacao());

    const res = await request(app).get('/api/aplicacoes/apl-001').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('apl-001');
  });
});

describe('POST /api/aplicacoes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 ao usar aprendente de outro profissional', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aprendente.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/aplicacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({ aprendentId: 'ap-outro', avaliacaoId: 'av-001' });

    expect(res.status).toBe(404);
    const [queryArg] = prisma.aprendente.findFirst.mock.calls[0];
    expect(queryArg.where).toMatchObject({ id: 'ap-outro', responsavelId: 'user-001' });
    expect(prisma.aplicacao.create).not.toHaveBeenCalled();
  });

  it('retorna 404 ao usar instrumento de outro profissional', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aprendente.findFirst.mockResolvedValue({ id: 'ap-001' });
    prisma.avaliacao.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/aplicacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({ aprendentId: 'ap-001', avaliacaoId: 'av-outra' });

    expect(res.status).toBe(404);
    const [queryArg] = prisma.avaliacao.findFirst.mock.calls[0];
    expect(queryArg.where).toMatchObject({ id: 'av-outra', autorId: 'user-001' });
    expect(prisma.aplicacao.create).not.toHaveBeenCalled();
  });

  it('cria aplicação com aprendente e instrumento próprios', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aprendente.findFirst.mockResolvedValue({ id: 'ap-001' });
    prisma.avaliacao.findFirst.mockResolvedValue({ id: 'av-001' });
    prisma.aplicacao.create.mockResolvedValue({ id: 'apl-001' });

    const res = await request(app)
      .post('/api/aplicacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({ aprendentId: 'ap-001', avaliacaoId: 'av-001' });

    expect(res.status).toBe(201);
    const [createArg] = prisma.aplicacao.create.mock.calls[0];
    expect(createArg.data.aplicadorId).toBe('user-001');
  });
});

describe('Escrita em aplicação de outro profissional', () => {
  beforeEach(() => vi.clearAllMocks());

  it('PUT /answers retorna 404 e não grava respostas', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aplicacao.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/aplicacoes/apl-outra/answers')
      .set('Authorization', `Bearer ${token}`)
      .send({ answers: [{ questionId: 'q1', value: 'x' }], isDraft: true });

    expect(res.status).toBe(404);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('POST /finalize retorna 404 e não finaliza', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aplicacao.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/aplicacoes/apl-outra/finalize')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(404);
    expect(prisma.aplicacao.update).not.toHaveBeenCalled();
  });

  it('DELETE retorna 404 e não exclui', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aplicacao.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/aplicacoes/apl-outra')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(prisma.aplicacao.delete).not.toHaveBeenCalled();
  });
});

describe('PUT /api/aplicacoes/:id/answers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('preserva o aplicador registrado na criação', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aplicacao.findFirst.mockResolvedValue(makeAplicacao());
    const tx = { resposta: { upsert: vi.fn() }, aplicacao: { update: vi.fn() } };
    prisma.$transaction.mockImplementationOnce((fn) => fn(tx));

    const res = await request(app)
      .put('/api/aplicacoes/apl-001/answers')
      .set('Authorization', `Bearer ${token}`)
      .send({ answers: [{ questionId: 'q1', value: 'x' }], isDraft: true });

    expect(res.status).toBe(200);
    const [updateArg] = tx.aplicacao.update.mock.calls[0];
    expect(updateArg.data).toEqual({ status: 'DRAFT' });
  });
});

describe('POST /api/aplicacoes/:id/finalize', () => {
  beforeEach(() => vi.clearAllMocks());

  const comRespostas = (respostas) => ({
    ...makeAplicacao(),
    avaliacao: {
      id: 'av-001', name: 'Leitura',
      questions: [
        { id: 'q1', text: 'Observações', type: 'TEXT', required: true },
        { id: 'q2', text: 'Dificuldades', type: 'MULTI_SELECT', required: true },
        { id: 'q3', text: 'Comentário livre', type: 'TEXT', required: false },
      ],
    },
    respostas,
  });

  it('recusa quando uma obrigatória foi salva em branco', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aplicacao.findFirst.mockResolvedValue(comRespostas([
      { questionId: 'q1', valor: { v: '   ' } },
      { questionId: 'q2', valor: { v: [] } },
    ]));

    const res = await request(app)
      .post('/api/aplicacoes/apl-001/finalize')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Perguntas obrigatórias sem resposta: Observações, Dificuldades');
    expect(prisma.aplicacao.update).not.toHaveBeenCalled();
  });

  it('finaliza quando as obrigatórias têm resposta, mesmo com opcional em branco', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    prisma.aplicacao.findFirst.mockResolvedValue(comRespostas([
      { questionId: 'q1', valor: { v: 'Atenta' } },
      { questionId: 'q2', valor: { v: ['Inversão'] } },
      { questionId: 'q3', valor: { v: '' } },
    ]));
    prisma.aplicacao.update.mockResolvedValue({ id: 'apl-001', status: 'COMPLETED' });

    const res = await request(app)
      .post('/api/aplicacoes/apl-001/finalize')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    const [updateArg] = prisma.aplicacao.update.mock.calls[0];
    expect(updateArg.data.status).toBe('COMPLETED');
  });

  it('aceita 0 e false como respostas válidas', async () => {
    const token = await getToken('PSICOPEDAGOGO');
    const aplicacao = comRespostas([
      { questionId: 'q1', valor: { v: 0 } },
      { questionId: 'q2', valor: { v: false } },
    ]);
    prisma.aplicacao.findFirst.mockResolvedValue(aplicacao);
    prisma.aplicacao.update.mockResolvedValue({ id: 'apl-001', status: 'COMPLETED' });

    const res = await request(app)
      .post('/api/aplicacoes/apl-001/finalize')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
  });
});
