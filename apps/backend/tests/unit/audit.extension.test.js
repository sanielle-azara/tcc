import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'node:module';

const nodeRequire = createRequire(import.meta.url);
const { createAuditHandler } = nodeRequire('../../src/audit/extension');
const { storage } = nodeRequire('../../src/audit/context');

// Cliente base falso: registra as gravações de auditoria e devolve os "valores anteriores"
const makeBase = () => ({
  auditLog: { create: vi.fn().mockResolvedValue({}), createMany: vi.fn().mockResolvedValue({}) },
  aprendente: { findUnique: vi.fn(), findMany: vi.fn() },
  user: { findUnique: vi.fn() },
  question: { findMany: vi.fn() },
  resposta: { findUnique: vi.fn() },
  aplicacao: { findUnique: vi.fn() },
});

const ctx = (extra = {}) => ({ userId: 'user-001', userRole: 'PSICOPEDAGOGO', ip: '10.0.0.1', aplicacaoAprendente: new Map(), ...extra });
const run = (handler, params, context = ctx()) => storage.run(context, () => handler(params));

describe('Extensão de auditoria', () => {
  let base;
  let handler;

  beforeEach(() => {
    base = makeBase();
    handler = createAuditHandler(base, { logger: { error: vi.fn() } });
  });

  it('registra a criação com usuário, perfil, IP, aprendente e valores criados', async () => {
    const created = { id: 'ap-001', name: 'João', responsavelId: 'user-001', createdAt: new Date(), updatedAt: new Date() };
    const query = vi.fn().mockResolvedValue(created);

    const result = await run(handler, { model: 'Aprendente', operation: 'create', args: { data: {} }, query });

    expect(result).toBe(created);
    const [{ data }] = base.auditLog.create.mock.calls[0];
    expect(data).toMatchObject({
      userId: 'user-001', userRole: 'PSICOPEDAGOGO', ip: '10.0.0.1',
      action: 'CREATE', entity: 'Aprendente', entityId: 'ap-001', aprendenteId: 'ap-001',
    });
    expect(data.diff.depois).toEqual({ id: 'ap-001', name: 'João', responsavelId: 'user-001' });
  });

  it('registra a alteração com os valores anteriores e novos apenas dos campos alterados', async () => {
    base.aprendente.findUnique.mockResolvedValue({ id: 'ap-001', name: 'João', escolaSerie: '3º ano', deletedAt: null, updatedAt: new Date(1) });
    const query = vi.fn().mockResolvedValue({ id: 'ap-001', name: 'João', escolaSerie: '4º ano', deletedAt: null, updatedAt: new Date(2) });

    await run(handler, { model: 'Aprendente', operation: 'update', args: { where: { id: 'ap-001' }, data: { escolaSerie: '4º ano' } }, query });

    expect(base.aprendente.findUnique).toHaveBeenCalledWith({ where: { id: 'ap-001' } });
    const [{ data }] = base.auditLog.create.mock.calls[0];
    expect(data.action).toBe('UPDATE');
    expect(data.diff).toEqual({ escolaSerie: { de: '3º ano', para: '4º ano' } });
  });

  it('registra a exclusão lógica (deletedAt) como exclusão', async () => {
    base.aprendente.findUnique.mockResolvedValue({ id: 'ap-001', name: 'João', deletedAt: null });
    const deletedAt = new Date('2026-11-13T10:00:00.000Z');
    const query = vi.fn().mockResolvedValue({ id: 'ap-001', name: 'João', deletedAt });

    await run(handler, { model: 'Aprendente', operation: 'update', args: { where: { id: 'ap-001' }, data: { deletedAt } }, query });

    const [{ data }] = base.auditLog.create.mock.calls[0];
    expect(data.action).toBe('DELETE');
    expect(data.diff).toEqual({ deletedAt: { de: null, para: deletedAt.toISOString() } });
  });

  it('registra a leitura de dado clínico, inclusive quando feita pelo ADMIN', async () => {
    const query = vi.fn().mockResolvedValue({ id: 'apl-001', aprendentId: 'ap-009' });

    await run(handler, { model: 'Aplicacao', operation: 'findFirst', args: {}, query }, ctx({ userId: 'admin-1', userRole: 'ADMIN' }));

    const [{ data }] = base.auditLog.create.mock.calls[0];
    expect(data).toMatchObject({ action: 'READ', entity: 'Aplicacao', entityId: 'apl-001', aprendenteId: 'ap-009', userId: 'admin-1', userRole: 'ADMIN' });
  });

  it('registra uma linha por item em listagens de dados clínicos', async () => {
    const query = vi.fn().mockResolvedValue([{ id: 'ap-001' }, { id: 'ap-002' }]);

    await run(handler, { model: 'Aprendente', operation: 'findMany', args: {}, query });

    const [{ data }] = base.auditLog.createMany.mock.calls[0];
    expect(data).toHaveLength(2);
    expect(data.map((d) => [d.action, d.aprendenteId])).toEqual([['LIST', 'ap-001'], ['LIST', 'ap-002']]);
  });

  it('não registra consulta sem resultado nem leitura de modelos não clínicos', async () => {
    await run(handler, { model: 'Aprendente', operation: 'findFirst', args: {}, query: vi.fn().mockResolvedValue(null) });
    await run(handler, { model: 'User', operation: 'findUnique', args: {}, query: vi.fn().mockResolvedValue({ id: 'u1' }) });
    await run(handler, { model: 'Aprendente', operation: 'count', args: {}, query: vi.fn().mockResolvedValue(3) });

    expect(base.auditLog.create).not.toHaveBeenCalled();
    expect(base.auditLog.createMany).not.toHaveBeenCalled();
  });

  it('não grava o hash da senha, apenas indica que foi alterado', async () => {
    base.user.findUnique.mockResolvedValue({ id: 'u1', name: 'Ana', passwordHash: 'hash-antigo' });
    const query = vi.fn().mockResolvedValue({ id: 'u1', name: 'Ana', passwordHash: 'hash-novo' });

    await run(handler, { model: 'User', operation: 'update', args: { where: { id: 'u1' }, data: {} }, query });

    const [{ data }] = base.auditLog.create.mock.calls[0];
    expect(data.diff).toEqual({ passwordHash: { de: '[omitido]', para: '[omitido]' } });
    expect(JSON.stringify(data)).not.toContain('hash-');
  });

  it('liga respostas ao aprendente pela aplicação, consultando cada aplicação uma vez', async () => {
    base.aplicacao.findUnique.mockResolvedValue({ aprendentId: 'ap-001' });
    base.resposta.findUnique.mockResolvedValue(null);
    const context = ctx();

    for (const questionId of ['q1', 'q2']) {
      const query = vi.fn().mockResolvedValue({ id: `r-${questionId}`, aplicacaoId: 'apl-001', questionId, valor: { v: 'x' } });
      await run(handler, { model: 'Resposta', operation: 'upsert', args: { where: { aplicacaoId_questionId: { aplicacaoId: 'apl-001', questionId } } }, query }, context);
    }

    expect(base.auditLog.create.mock.calls.map(([{ data }]) => [data.action, data.aprendenteId])).toEqual([['CREATE', 'ap-001'], ['CREATE', 'ap-001']]);
    expect(base.aplicacao.findUnique).toHaveBeenCalledTimes(1);
  });

  it('registra exclusão em lote com os registros removidos', async () => {
    base.question.findMany.mockResolvedValue([{ id: 'q1', text: 'Pergunta antiga', avaliacaoId: 'av-1' }]);
    const query = vi.fn().mockResolvedValue({ count: 1 });

    await run(handler, { model: 'Question', operation: 'deleteMany', args: { where: { avaliacaoId: 'av-1' } }, query });

    const [{ data }] = base.auditLog.create.mock.calls[0];
    expect(data.action).toBe('DELETE');
    expect(data.diff).toEqual({ antes: [{ id: 'q1', text: 'Pergunta antiga', avaliacaoId: 'av-1' }], quantidade: 1 });
  });

  it('não registra modelos técnicos (tokens)', async () => {
    const query = vi.fn().mockResolvedValue({ id: 't1' });
    await run(handler, { model: 'RefreshToken', operation: 'create', args: { data: {} }, query });
    expect(base.auditLog.create).not.toHaveBeenCalled();
  });

  it('uma falha ao gravar a auditoria não interrompe a operação', async () => {
    base.auditLog.create.mockRejectedValue(new Error('banco indisponível'));
    const query = vi.fn().mockResolvedValue({ id: 'ap-001' });

    await expect(run(handler, { model: 'Aprendente', operation: 'create', args: { data: {} }, query })).resolves.toEqual({ id: 'ap-001' });
  });

  it('operações fora de uma requisição são registradas sem usuário', async () => {
    const query = vi.fn().mockResolvedValue({ id: 'ap-001' });
    await handler({ model: 'Aprendente', operation: 'create', args: { data: {} }, query });

    const [{ data }] = base.auditLog.create.mock.calls[0];
    expect(data).toMatchObject({ userId: null, userRole: null, ip: null });
  });
});
