# Backend — API REST

API REST do Sistema de Apoio à Avaliação Psicopedagógica.

## Tecnologias

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4
- **ORM**: Prisma 5 (MySQL)
- **Autenticação**: JWT (access + refresh token)
- **Validação**: Zod
- **Documentação**: Swagger/OpenAPI
- **Testes**: Vitest + Supertest

## Endpoints Principais

| Módulo | Prefixo |
|--------|---------|
| Autenticação | `POST /api/auth/login` |
| Usuários | `GET/POST/PUT/DELETE /api/users` |
| Aprendentes | `GET/POST/PUT/DELETE /api/aprendentes` |
| Avaliações | `GET/POST/PUT/DELETE /api/avaliacoes` |
| Aplicações | `GET/POST /api/aplicacoes` |
| Relatórios | `GET/POST /api/relatorios` |
| Dashboard | `GET /api/dashboard` |

Documentação completa em `http://localhost:3001/api-docs`.

## Configuração

```bash
cp .env.example .env
# Editar variáveis no .env

npm install
npm run db:generate   # Gerar Prisma Client
npm run db:migrate    # Executar migrations
npm run db:seed       # Popular banco de dados
npm run dev           # Iniciar em desenvolvimento
```

## Testes

```bash
npm run test          # Rodar testes
npm run test:coverage # Cobertura de testes
```

## Estrutura

```
src/
├── config/           # env, prisma, swagger
├── middlewares/      # auth, validate, error
├── modules/          # Módulos de negócio
│   ├── auth/
│   ├── users/
│   ├── aprendentes/
│   ├── avaliacoes/
│   ├── aplicacoes/
│   ├── relatorios/
│   └── dashboard/
└── utils/            # jwt, email
prisma/
├── schema.prisma
└── seeds/
```
