# Sistema de Apoio à Avaliação Psicopedagógica

Sistema completo para gerenciamento de avaliações psicopedagógicas, desenvolvido como TCC.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Backend | Node.js, Express.js, Prisma ORM, MySQL, JWT |
| Frontend | React, Vite, Material UI, React Query, React Hook Form |
| Infra | Docker, Docker Compose, Nginx |
| Testes | Vitest, React Testing Library |

## Início Rápido

### Com Docker (recomendado)

```bash
# 1. Copiar e configurar variáveis de ambiente
cp .env.example .env

# 2. Subir todos os serviços
docker compose up -d

# 3. Acessar o sistema
# Frontend: http://localhost
# Backend API: http://localhost:3001/api
# Swagger: http://localhost:3001/api-docs
```

**Credenciais de acesso (seed):**
- Admin: `admin@psicopedagogia.com` / `Admin@123`
- Profissional: `profissional@psicopedagogia.com` / `Prof@123`

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar backend
cp apps/backend/.env.example apps/backend/.env
# Editar DATABASE_URL e demais variáveis

# Criar as tabelas a partir do schema e popular o banco
# (o projeto ainda não tem migrações versionadas; ver observação abaixo)
npx prisma db push --schema apps/backend/prisma/schema.prisma
npm run db:seed

# Iniciar todos os serviços em paralelo
npm run dev
```

> **Migrações:** a pasta `apps/backend/prisma/migrations` ainda está vazia. O Docker cria e atualiza as tabelas com `prisma db push`, que sincroniza o banco com o schema sem gerar histórico de migrações. O comando `npm run db:migrate` (`prisma migrate dev`) cria uma migração inicial a partir do schema atual; se for usado, as migrações geradas devem ser versionadas e o Docker deve passar a usar `prisma migrate deploy`.

## Estrutura do Monorepo

```
/
├── apps/
│   ├── backend/          # API REST (Express + Prisma)
│   └── frontend/         # SPA (React + MUI)
├── packages/
│   ├── shared-types/     # Constantes e tipos compartilhados
│   ├── shared-utils/     # Utilitários (formatação, paginação)
│   └── shared-validation/ # Schemas Zod reutilizáveis
├── docker/               # Dockerfiles e configs Nginx/MySQL
├── docs/                 # Documentação da arquitetura
└── docker-compose.yml
```

## Funcionalidades

- **Autenticação**: Login, logout, refresh token, recuperação e alteração de senha
- **Usuários**: Cadastro, edição, exclusão lógica com controle de perfis (Admin, Psicopedagogo)
- **Aprendentes**: Cadastro completo com histórico de acompanhamento
- **Avaliações**: Formulários dinâmicos com 8 tipos de perguntas e versionamento automático
- **Aplicações**: Associar avaliação ao aprendente, salvar rascunho, finalizar
- **Relatórios**: Geração, visualização, edição e impressão/PDF
- **Dashboard**: Métricas e últimas atividades
- **Auditoria**: Registro de quem criou, alterou, excluiu ou consultou dados clínicos (inclusive o ADMIN), com valores anteriores e novos

## Comandos Úteis

```bash
npm run test          # Rodar todos os testes
npm run lint          # Verificar qualidade do código
npm run db:studio     # Abrir Prisma Studio
docker compose logs -f backend  # Ver logs do backend
```

## Documentação

- [README Backend](apps/backend/README.md)
- [README Frontend](apps/frontend/README.md)
- [Arquitetura do Sistema](docs/ARCHITECTURE.md)
- [DER do Banco de Dados](docs/DER.md)
