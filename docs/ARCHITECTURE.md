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

## Segurança

- JWT access token (15 min) + refresh token (7 dias)
- Bcrypt hash de senhas (salt rounds: 12)
- Rate limiting: 100 req/15min por IP
- Helmet (headers de segurança HTTP)
- CORS restrito ao domínio do frontend
- Validação de entrada com Zod em todas as rotas
- Soft delete (deletedAt) para dados sensíveis
