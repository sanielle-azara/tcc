const { getContext } = require('./context');

// Modelos cujas criações, alterações e exclusões são auditadas
const AUDITED_WRITES = new Set([
  'User', 'Aprendente', 'HistoricoAprendente', 'Avaliacao', 'Question', 'Aplicacao', 'Resposta', 'Relatorio',
]);
// Modelos com dados clínicos de crianças: também as consultas são auditadas
const AUDITED_READS = new Set(['Aprendente', 'HistoricoAprendente', 'Aplicacao', 'Relatorio']);

const READ_OPS = new Set(['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany']);
const WRITE_OPS = new Set(['create', 'update', 'upsert', 'delete', 'createMany', 'updateMany', 'deleteMany']);
const IGNORED_FIELDS = new Set(['createdAt', 'updatedAt']);
const REDACTED_FIELDS = new Set(['passwordHash']);

const delegateName = (model) => model.charAt(0).toLowerCase() + model.slice(1);

const toJson = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);

// Remove relações incluídas, campos de controle e campos sensíveis (hash de senha)
const clean = (record) => {
  if (!isObject(record)) return record;
  const out = {};
  for (const [key, value] of Object.entries(record)) {
    if (IGNORED_FIELDS.has(key)) continue;
    if (REDACTED_FIELDS.has(key)) { out[key] = '[omitido]'; continue; }
    if (Array.isArray(value) && value.some(isObject)) continue;
    if (isObject(value) && !('v' in value)) continue; // relação incluída (Json de resposta usa { v })
    out[key] = value;
  }
  return toJson(out);
};

// Campos alterados: { campo: { de, para } }, considerando só os escalares do registro anterior
const changes = (before, after) => {
  const diff = {};
  for (const key of Object.keys(clean(before))) {
    if (!(key in after)) continue;
    const de = toJson(before[key]);
    const para = toJson(after[key]);
    if (JSON.stringify(de) !== JSON.stringify(para)) {
      diff[key] = REDACTED_FIELDS.has(key) ? { de: '[omitido]', para: '[omitido]' } : { de, para };
    }
  }
  return diff;
};

const createAuditHandler = (base, { logger = console } = {}) => {
  const safe = async (fn) => {
    try {
      return await fn();
    } catch (err) {
      logger.error('[audit] falha ao registrar auditoria:', err.message);
      return null;
    }
  };

  // Aprendente a que o registro pertence, para responder "quem acessou os dados desta criança"
  const aprendenteOfAplicacao = async (aplicacaoId) => {
    if (!aplicacaoId) return null;
    const cache = getContext().aplicacaoAprendente;
    if (cache?.has(aplicacaoId)) return cache.get(aplicacaoId);
    const ap = await base.aplicacao.findUnique({ where: { id: aplicacaoId }, select: { aprendentId: true } });
    const id = ap?.aprendentId || null;
    cache?.set(aplicacaoId, id);
    return id;
  };

  const aprendenteOf = async (model, record) => {
    if (!record) return null;
    switch (model) {
      case 'Aprendente': return record.id || null;
      case 'HistoricoAprendente':
      case 'Aplicacao': return record.aprendentId || null;
      case 'Relatorio': return record.aplicacao?.aprendentId || aprendenteOfAplicacao(record.aplicacaoId);
      case 'Resposta': return aprendenteOfAplicacao(record.aplicacaoId);
      default: return null;
    }
  };

  const entry = (action, model, entityId, aprendenteId, diff) => {
    const ctx = getContext();
    return {
      userId: ctx.userId || null,
      userRole: ctx.userRole || null,
      action,
      entity: model,
      entityId: entityId || null,
      aprendenteId: aprendenteId || null,
      diff: diff === undefined ? undefined : toJson(diff),
      ip: ctx.ip || null,
    };
  };

  const logRead = async (model, operation, result) => {
    if (operation === 'findMany') {
      if (!Array.isArray(result) || result.length === 0) return;
      // Um registro por item listado, para que cada criança tenha seu histórico de acessos
      const rows = await Promise.all(result.map(async (r) => entry('LIST', model, r.id, await aprendenteOf(model, r))));
      await base.auditLog.createMany({ data: rows });
      return;
    }
    if (!result) return;
    await base.auditLog.create({ data: entry('READ', model, result.id, await aprendenteOf(model, result)) });
  };

  const logWrite = async (model, operation, args, before, result) => {
    switch (operation) {
      case 'create':
        return base.auditLog.create({ data: entry('CREATE', model, result.id, await aprendenteOf(model, result), { depois: clean(result) }) });
      case 'update': {
        // Exclusão lógica (preenchimento de deletedAt) é registrada como exclusão
        const softDelete = before && !before.deletedAt && result.deletedAt;
        return base.auditLog.create({
          data: entry(softDelete ? 'DELETE' : 'UPDATE', model, result.id, await aprendenteOf(model, result), before ? changes(before, result) : undefined),
        });
      }
      case 'upsert':
        return base.auditLog.create({
          data: before
            ? entry('UPDATE', model, result.id, await aprendenteOf(model, result), changes(before, result))
            : entry('CREATE', model, result.id, await aprendenteOf(model, result), { depois: clean(result) }),
        });
      case 'delete':
        return base.auditLog.create({ data: entry('DELETE', model, result.id, await aprendenteOf(model, before || result), { antes: clean(before || result) }) });
      case 'createMany': {
        const data = Array.isArray(args.data) ? args.data : [args.data];
        return base.auditLog.create({ data: entry('CREATE', model, null, null, { quantidade: result.count, depois: data.map(clean) }) });
      }
      case 'updateMany':
        return base.auditLog.create({ data: entry('UPDATE', model, null, null, { filtro: args.where, alteracao: clean(args.data), quantidade: result.count }) });
      case 'deleteMany':
        return base.auditLog.create({ data: entry('DELETE', model, null, null, { antes: (before || []).map(clean), quantidade: result.count }) });
      default:
        return null;
    }
  };

  return async ({ model, operation, args, query }) => {
    if (READ_OPS.has(operation)) {
      const result = await query(args);
      if (AUDITED_READS.has(model)) await safe(() => logRead(model, operation, result));
      return result;
    }

    if (!AUDITED_WRITES.has(model) || !WRITE_OPS.has(operation)) return query(args);

    // Valores anteriores, lidos pelo cliente sem auditoria para não gerar registros de leitura
    const delegate = base[delegateName(model)];
    let before = null;
    if (['update', 'upsert', 'delete'].includes(operation)) {
      before = await safe(() => delegate.findUnique({ where: args.where }));
    } else if (operation === 'deleteMany') {
      before = await safe(() => delegate.findMany({ where: args.where }));
    }

    const result = await query(args);
    await safe(() => logWrite(model, operation, args, before, result));
    return result;
  };
};

const createAuditExtension = (base, options) => ({
  name: 'auditoria',
  query: { $allModels: { $allOperations: createAuditHandler(base, options) } },
});

module.exports = { createAuditExtension, createAuditHandler, changes, clean };
