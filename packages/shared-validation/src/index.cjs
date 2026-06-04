'use strict';

const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  role: z.enum(['ADMIN', 'PSICOPEDAGOGO', 'VIEWER']).default('PSICOPEDAGOGO'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'PSICOPEDAGOGO', 'VIEWER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const createAprendentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(150),
  birthDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Data de nascimento inválida' }),
  sexo: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
  responsavelNome: z.string().min(2).max(150),
  responsavelRelacao: z.string().max(50).optional(),
  contatoPrincipal: z.string().min(8).max(20),
  contatoSecundario: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  escolaNome: z.string().max(150).optional(),
  escolaSerie: z.string().max(50).optional(),
  escolaTurno: z.string().max(50).optional(),
  observacoes: z.string().max(2000).optional(),
});

const updateAprendentSchema = createAprendentSchema.partial();

const questionSchema = z.object({
  text: z.string().min(1, 'Texto da pergunta é obrigatório').max(500),
  type: z.enum(['TEXT', 'LONG_TEXT', 'NUMERIC', 'DATE', 'SINGLE_SELECT', 'MULTI_SELECT', 'SCALE', 'YES_NO']),
  required: z.boolean().default(true),
  order: z.number().int().min(0),
  options: z.array(z.string()).optional(),
  scaleMin: z.number().optional(),
  scaleMax: z.number().optional(),
  scaleMinLabel: z.string().max(50).optional(),
  scaleMaxLabel: z.string().max(50).optional(),
  helpText: z.string().max(300).optional(),
});

const createAvaliacaoSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(150),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  questions: z.array(questionSchema).min(1, 'Avaliação deve ter pelo menos uma pergunta'),
});

const updateAvaliacaoSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  questions: z.array(questionSchema).optional(),
});

const answerSchema = z.object({
  questionId: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).nullable(),
});

const createAplicacaoSchema = z.object({
  aprendentId: z.string().min(1, 'Aprendente é obrigatório'),
  avaliacaoId: z.string().min(1, 'Avaliação é obrigatória'),
  dataAplicacao: z.string().optional(),
  observacoes: z.string().max(2000).optional(),
});

const saveAnswersSchema = z.object({
  answers: z.array(answerSchema),
  isDraft: z.boolean().default(false),
});

const createRelatorioSchema = z.object({
  aplicacaoId: z.string().min(1, 'Aplicação é obrigatória'),
  conclusao: z.string().max(5000).optional(),
  observacoesProfissional: z.string().max(2000).optional(),
});

const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  search: z.string().max(100).optional(),
});

module.exports = {
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  createUserSchema,
  updateUserSchema,
  createAprendentSchema,
  updateAprendentSchema,
  questionSchema,
  createAvaliacaoSchema,
  updateAvaliacaoSchema,
  answerSchema,
  saveAnswersSchema,
  createAplicacaoSchema,
  createRelatorioSchema,
  paginationSchema,
};
