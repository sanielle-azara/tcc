# Frontend — SPA React

Interface web do Sistema de Apoio à Avaliação Psicopedagógica.

## Tecnologias

- **Framework**: React 18 + Vite 5
- **UI**: Material UI (MUI) v5
- **Roteamento**: React Router v6
- **Estado/Cache**: TanStack Query (React Query) v5
- **Formulários**: React Hook Form + Zod
- **HTTP**: Axios
- **Testes**: Vitest + React Testing Library

## Configuração

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # Build de produção
npm run test      # Rodar testes
```

## Estrutura

```
src/
├── api/          # Funções de chamada à API
├── components/
│   ├── common/   # DataTable, PageHeader, StatusChip, ConfirmDialog
│   └── layout/   # AppLayout, ProtectedRoute
├── contexts/     # AuthContext
├── hooks/        # useNotification
├── pages/        # Páginas por módulo
│   ├── auth/
│   ├── dashboard/
│   ├── aprendentes/
│   ├── avaliacoes/
│   ├── aplicacoes/
│   ├── relatorios/
│   └── users/
├── theme/        # Configuração MUI
└── utils/        # Helpers frontend
```

## Perfis de Acesso

| Perfil | Permissões |
|--------|------------|
| ADMIN | Acesso total, incluindo gestão de usuários |
| PSICOPEDAGOGO | Criar/editar aprendentes, avaliações, aplicações e relatórios |
| VIEWER | Apenas visualização |
