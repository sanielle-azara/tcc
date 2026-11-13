// Conversões entre o formato do formulário de instrumentos e o formato da API.
// No formulário, as opções são editadas como texto (uma por linha) e campos vazios
// vêm como '' ou null; a API espera arrays, números e campos opcionais ausentes.

export const QUESTION_TYPES = [
  { value: 'TEXT', label: 'Texto curto' },
  { value: 'LONG_TEXT', label: 'Texto longo' },
  { value: 'NUMERIC', label: 'Numérico' },
  { value: 'DATE', label: 'Data' },
  { value: 'SINGLE_SELECT', label: 'Seleção única' },
  { value: 'MULTI_SELECT', label: 'Seleção múltipla' },
  { value: 'SCALE', label: 'Escala' },
  { value: 'YES_NO', label: 'Sim/Não' },
];

export const questionTypeLabel = (type) => QUESTION_TYPES.find((t) => t.value === type)?.label || type;

export const SELECT_TYPES = ['SINGLE_SELECT', 'MULTI_SELECT'];

export const parseOptions = (options) => {
  if (!options) return [];
  if (Array.isArray(options)) return options;
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
};

const optionsToArray = (value) =>
  Array.isArray(value)
    ? value
    : String(value ?? '').split('\n').map((o) => o.trim()).filter(Boolean);

// Instrumento vindo da API -> valores iniciais do formulário
export const toFormValues = (avaliacao) => ({
  name: avaliacao.name ?? '',
  description: avaliacao.description ?? '',
  category: avaliacao.category ?? '',
  status: avaliacao.status ?? 'DRAFT',
  questions: (avaliacao.questions || []).map((q) => ({
    text: q.text ?? '',
    type: q.type ?? 'TEXT',
    required: q.required ?? true,
    helpText: q.helpText ?? '',
    options: parseOptions(q.options).join('\n'),
    scaleMin: q.scaleMin ?? '',
    scaleMax: q.scaleMax ?? '',
    scaleMinLabel: q.scaleMinLabel ?? '',
    scaleMaxLabel: q.scaleMaxLabel ?? '',
  })),
});

// Valores do formulário -> payload da API (antes da validação com Zod)
export const toAvaliacaoPayload = (values) => ({
  name: values.name ?? '',
  description: values.description ?? '',
  category: values.category ?? '',
  status: values.status || 'DRAFT',
  questions: (values.questions || []).map((q, i) => {
    const isScale = q.type === 'SCALE';
    return {
      text: q.text ?? '',
      type: q.type || 'TEXT',
      required: q.required === true || q.required === 'true',
      order: i + 1,
      helpText: q.helpText ?? '',
      options: SELECT_TYPES.includes(q.type) ? optionsToArray(q.options) : undefined,
      scaleMin: isScale ? toNumber(q.scaleMin) : undefined,
      scaleMax: isScale ? toNumber(q.scaleMax) : undefined,
      scaleMinLabel: isScale ? (q.scaleMinLabel ?? '') : undefined,
      scaleMaxLabel: isScale ? (q.scaleMaxLabel ?? '') : undefined,
    };
  }),
});

const canonicalQuestion = (q) => JSON.stringify([
  q.text, q.type, q.required, q.order, q.options ?? [],
  q.scaleMin ?? null, q.scaleMax ?? null, q.scaleMinLabel || '', q.scaleMaxLabel || '', q.helpText || '',
]);

// Indica se as perguntas do payload são iguais às do instrumento carregado,
// para não gerar uma nova versão quando só os metadados foram alterados.
export const sameQuestions = (payloadQuestions, avaliacao) => {
  const original = toAvaliacaoPayload(toFormValues(avaliacao)).questions;
  if (original.length !== payloadQuestions.length) return false;
  return payloadQuestions.every((q, i) => canonicalQuestion(q) === canonicalQuestion(original[i]));
};
