# DER — Diagrama Entidade-Relacionamento

## Diagrama Textual

```
users
├── id (PK, UUID)
├── name (VARCHAR 100)
├── email (VARCHAR 150, UNIQUE)
├── passwordHash (VARCHAR 255)
├── role (ENUM: ADMIN, PSICOPEDAGOGO, VIEWER)
├── status (ENUM: ACTIVE, INACTIVE)
├── createdAt, updatedAt, deletedAt

refresh_tokens
├── id (PK, UUID)
├── token (VARCHAR 512, UNIQUE)
├── userId (FK → users.id)
├── expiresAt
├── revokedAt, createdAt

password_resets
├── id (PK, UUID)
├── token (VARCHAR 512, UNIQUE)
├── userId (FK → users.id)
├── expiresAt
├── usedAt, createdAt

aprendentes
├── id (PK, UUID)
├── name (VARCHAR 150)
├── birthDate (DATE)
├── sexo (ENUM: MASCULINO, FEMININO, OUTRO)
├── responsavelNome (VARCHAR 150)
├── responsavelRelacao (VARCHAR 50)
├── contatoPrincipal (VARCHAR 20)
├── contatoSecundario (VARCHAR 20)
├── email (VARCHAR 150)
├── escolaNome, escolaSerie, escolaTurno
├── observacoes (TEXT)
├── createdAt, updatedAt, deletedAt

historico_aprendentes
├── id (PK, UUID)
├── aprendentId (FK → aprendentes.id)
├── descricao (TEXT)
├── data
├── createdAt

avaliacoes
├── id (PK, UUID)
├── name (VARCHAR 150)
├── description (TEXT)
├── category (VARCHAR 100)
├── version (INT, default 1)
├── status (ENUM: DRAFT, ACTIVE, ARCHIVED)
├── parentId (FK → avaliacoes.id, self-reference para versões)
├── createdAt, updatedAt, deletedAt

questions
├── id (PK, UUID)
├── avaliacaoId (FK → avaliacoes.id)
├── text (VARCHAR 500)
├── type (ENUM: TEXT, LONG_TEXT, NUMERIC, DATE, SINGLE_SELECT,
│         MULTI_SELECT, SCALE, YES_NO)
├── required (BOOLEAN)
├── order (INT)
├── options (JSON, para SINGLE/MULTI_SELECT)
├── scaleMin, scaleMax, scaleMinLabel, scaleMaxLabel
├── helpText
├── createdAt, updatedAt

aplicacoes
├── id (PK, UUID)
├── aprendentId (FK → aprendentes.id)
├── avaliacaoId (FK → avaliacoes.id)
├── aplicadorId (FK → users.id)
├── status (ENUM: PENDING, IN_PROGRESS, DRAFT, COMPLETED)
├── dataAplicacao
├── observacoes (TEXT)
├── finalizadaAt
├── createdAt, updatedAt

respostas
├── id (PK, UUID)
├── aplicacaoId (FK → aplicacoes.id)
├── questionId (FK → questions.id)
├── valor (JSON)
├── createdAt, updatedAt
├── UNIQUE(aplicacaoId, questionId)

relatorios
├── id (PK, UUID)
├── aplicacaoId (FK → aplicacoes.id, UNIQUE)
├── autorId (FK → users.id)
├── conclusao (TEXT)
├── observacoesProfissional (TEXT)
├── createdAt, updatedAt
```

## Relacionamentos

```
users            1──N  refresh_tokens
users            1──N  password_resets
users            1──N  aplicacoes (como aplicador)
users            1──N  relatorios (como autor)

aprendentes      1──N  historico_aprendentes
aprendentes      1──N  aplicacoes

avaliacoes       1──N  questions
avaliacoes       1──N  aplicacoes
avaliacoes       0─1   avaliacoes (parent/versão anterior)

aplicacoes       1──N  respostas
aplicacoes       0─1   relatorios

questions        1──N  respostas
```

## Índices

| Tabela | Índice |
|--------|--------|
| users | email (unique), status |
| aprendentes | name, deletedAt |
| avaliacoes | status, category, deletedAt |
| aplicacoes | aprendentId, avaliacaoId, status |
| respostas | aplicacaoId |
| refresh_tokens | token (unique), userId |
