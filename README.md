# TrialScale

Plataforma SaaS multi-tenant que guia centros de pesquisa clínica a elevar sua
maturidade de gestão. Monorepo npm workspaces: **apps/api** (Express + Sequelize +
TypeScript) e **apps/web** (React + Vite + TypeScript).

## Pré-requisitos

- Node.js 24+ e npm 11+
- MySQL 5.7+ local em execução
- Git

## Quickstart (dev local)

```bash
# 1. Configuração (uma vez): copie o template e preencha a senha do MySQL
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
#    → edite DB_PASSWORD e gere um JWT_SECRET (>=32 chars)

# 2. Dependências
npm install

# 3. Banco: aplica specs/000-modelo-de-dados/schema.sql (idempotente, sem DROP)
npm run db:apply

# 4. Dados de teste: 2 centros × (admin, coordenador, membro) + 1 staff
npm run seed

# 5. Sobe api (http://localhost:3333) + web (http://localhost:5173) juntos
npm run dev
```

Abra **http://localhost:5173** e entre com uma conta seedada — senha de todas:
`TrialScale#2026` (somente dev):

| Centro | Administrador | Coordenador | Membro |
|---|---|---|---|
| Centro Alfa (SP) | admin@alfa.dev | coord@alfa.dev | membro@alfa.dev |
| Instituto Beta (MG) | admin@beta.dev | coord@beta.dev | membro@beta.dev |
| — staff TrialScale | staff@trialscale.dev | | |

Fluxos disponíveis: cadastro de centro (com consentimento LGPD e especialidades),
login/logout, sessão persistente (refresh rotativo), recuperação de senha
(o link aparece no **console do api** em dev) e página inicial protegida.

## Scripts (raiz)

| Comando | Faz |
|---|---|
| `npm run dev` | api + web em watch |
| `npm run lint` / `npm run typecheck` | qualidade em todo o monorepo |
| `npm test` | Jest do api (unit + integration + isolation) |
| `npm run test:isolation` | só a suíte de isolamento multi-tenant |
| `npm run db:apply` | aplica o schema.sql no banco do .env |
| `npm run seed` | seeds dev idempotentes |

## Regras do projeto (leia antes de contribuir)

- [docs/constitution.md](docs/constitution.md) — princípios inegociáveis.
  Destaque: **isolamento de tenant** é mecanizado (ADR 001) e provado pela
  suíte `test/isolation/` — falha ali bloqueia merge.
- [docs/adr/001-mecanismo-escopo-tenant.md](docs/adr/001-mecanismo-escopo-tenant.md)
  — como o escopo por tenant funciona (AsyncLocalStorage + hooks + repositories).
- `specs/000-modelo-de-dados/schema.sql` — **fonte da verdade** do banco;
  bancos existentes evoluem por `scripts/migrations/*.sql`.
- Fluxo: branch de tarefa (PT-XXXX) → PR → revisão humana → merge.

## Deploy

Staging: ver [docs/deploy-staging.md](docs/deploy-staging.md). O CI
(.github/workflows/ci.yml) roda lint, typecheck e as três suítes com
MySQL 5.7 de serviço; o step `tenant-isolation` deve ser required check.
