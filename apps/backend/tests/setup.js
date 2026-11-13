import { vi } from 'vitest';
import Module, { createRequire } from 'node:module';
import path from 'node:path';

const nodeRequire = createRequire(import.meta.url);

// O código do backend é CommonJS e vi.mock não intercepta chamadas a require().
// Por isso o mock do Prisma Client é registrado diretamente no cache de módulos
// do Node, antes que qualquer arquivo de src/ seja carregado pelos testes.
const prismaMock = {
  user: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  aprendente: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  avaliacao: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
  aplicacao: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
  relatorio: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
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

// O Vitest reaproveita o processo entre arquivos de teste, e o cache do require
// sobrevive a essa troca. Os módulos de src/ são descartados para que cada arquivo
// carregue um app novo, ligado ao seu próprio mock (e com o rate limit zerado).
const srcDir = path.dirname(nodeRequire.resolve('../src/app'));
for (const cachedPath of Object.keys(nodeRequire.cache)) {
  if (cachedPath.startsWith(srcDir + path.sep)) delete nodeRequire.cache[cachedPath];
}

const prismaPath = nodeRequire.resolve('../src/config/prisma');
const prismaModule = new Module(prismaPath);
prismaModule.filename = prismaPath;
prismaModule.loaded = true;
prismaModule.exports = prismaMock;
nodeRequire.cache[prismaPath] = prismaModule;
