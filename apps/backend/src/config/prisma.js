const { PrismaClient } = require('@prisma/client');
const { createAuditExtension } = require('../audit/extension');

const base = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// A aplicação usa o cliente estendido: toda operação passa pela extensão de auditoria.
// O cliente base é usado apenas pela própria extensão, para gravar os registros e
// ler os valores anteriores sem gerar novos registros de auditoria.
const prisma = base.$extends(createAuditExtension(base));

module.exports = prisma;
