# Arquitetura do Sistema

## Visão Geral

```
┌─────────────────────────────────────────────────────┐
│                    Docker Network                    │
│                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐  │
│  │ Frontend │───▶│  Backend │───▶│    MySQL     │  │
│  │  React   │    │  Node.js │    │   (Prisma)   │  │
│  │  :80     │    │  :3001   │    │   :3306      │  │
│  └──────────┘    └──────────┘    └──────────────┘  │
│       │               │                             │
│    Nginx          Express.js                        │
│    (SPA + proxy)  REST API                          │
└─────────────────────────────────────────────────────┘
```

## Fluxo de Autenticação

```
Cliente                    Backend
  │                           │
  │──POST /auth/login─────────▶│
  │◀──{ accessToken (15m),     │
  │     refreshToken (7d) }────│
  │                           │
  │──GET /api/... ─────────────▶│ (Bearer accessToken)
  │◀──{ data }─────────────────│
  │                           │
  │    (token expira)          │
  │──POST /auth/refresh───────▶│ (refreshToken)
  │◀──{ novo accessToken }─────│
```

## Camadas da Aplicação

### Backend

```
Request ──▶ Rate Limiter ──▶ Auth Middleware ──▶ Validate Middleware
         ──▶ Controller ──▶ Service ──▶ Prisma ──▶ MySQL
         ◀── Response   ◀── DTO     ◀── Model
```

### Frontend

```
Page Component
  │
  ├── useQuery (TanStack Query) ──▶ api/[module].js ──▶ axios ──▶ API
  │
  ├── useMutation ──▶ api/[module].js
  │
  └── useForm (React Hook Form + Zod)
```

## Módulos do Backend

| Módulo | Responsabilidade |
|--------|-----------------|
| auth | Login, refresh token, recuperação de senha |
| users | CRUD de usuários do sistema |
| aprendentes | CRUD de estudantes + histórico |
| avaliacoes | Formulários dinâmicos com versionamento |
| aplicacoes | Aplicação de avaliações, respostas, finalização |
| relatorios | Relatórios das aplicações finalizadas |
| dashboard | Métricas e últimas atividades |
| auditoria | Consulta do registro de auditoria (ADMIN: completo; psicopedagogo: acessos aos próprios aprendentes) |

## Segurança

- JWT access token (15 min) + refresh token (7 dias)
- Bcrypt hash de senhas (salt rounds: 12)
- Rate limiting: 100 req/15min por IP
- Helmet (headers de segurança HTTP)
- CORS restrito ao domínio do frontend
- Validação com Zod do corpo das requisições de login, criação e alteração e dos filtros da auditoria (os demais parâmetros de consulta, como paginação e busca, não passam por schema)
- Soft delete (deletedAt) para dados sensíveis
- Registro de auditoria (tabela audit_logs) preenchido por extensão do Prisma: criações, alterações e exclusões com valores anteriores e novos, consultas a dados clínicos e logins, com usuário, perfil, IP e data
