const { vi } = require('vitest');

// Mock do Prisma Client para todos os testes
vi.mock('../src/config/prisma', () => ({
  default: {
    user: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    aprendente: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    avaliacao: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    aplicacao: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    relatorio: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    refreshToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    passwordReset: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    historicoAprendente: { create: vi.fn(), findMany: vi.fn() },
    question: { deleteMany: vi.fn(), createMany: vi.fn() },
    resposta: { upsert: vi.fn() },
    $transaction: vi.fn((ops) => (Array.isArray(ops) ? Promise.all(ops) : ops({
      resposta: { upsert: vi.fn() },
      aplicacao: { update: vi.fn() },
    }))),
    $disconnect: vi.fn(),
  },
}));
