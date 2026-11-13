import { vi } from 'vitest';
import Module, { createRequire } from 'node:module';

const nodeRequire = createRequire(import.meta.url);

// O código do backend é CommonJS e vi.mock não intercepta chamadas a require().
// Por isso o mock do Prisma Client é registrado diretamente no cache de módulos
// do Node, antes que qualquer arquivo de src/ seja carregado pelos testes.
const prismaMock = {
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
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

const prismaPath = nodeRequire.resolve('../src/config/prisma');
const prismaModule = new Module(prismaPath);
prismaModule.filename = prismaPath;
prismaModule.loaded = true;
prismaModule.exports = prismaMock;
nodeRequire.cache[prismaPath] = prismaModule;
