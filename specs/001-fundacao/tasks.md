# Tasks 001 — Fundação

Sequência aprovada (2026-07-23). Commits semânticos `feat(Escopo): descrição [PT-XXXX]`.

- [x] PT-0001 specs/001-fundacao (este diretório)
- [x] PT-0002 monorepo apps/web + workspaces + tsconfig.base
- [x] PT-0003 bootstrap apps/api (TS estrito, Express, /api/health, ESLint TS, 1º teste)
- [x] PT-0004 schema.sql: refresh_token + password_reset_token (+ aplicar no dev)
- [x] PT-0005 Sequelize + env Zod + harness de banco de teste
- [x] PT-0006 models da fatia (User, Tenant, Membership, Consent, AuditLog, RefreshToken, PasswordResetToken, Specialty, TenantSpecialty)
- [x] PT-0007 mecanismo de escopo + ADR 001 + suíte de isolamento (model) — exceção declarada de tamanho
- [x] PT-0008 repositories (base tenant + identidade) + regras ESLint
- [x] PT-0009 HTTP base (error-handler, validate Zod, logger redaction, request-id)
- [x] PT-0010 POST /auth/register + GET /specialties (201 sem autologin)
- [x] PT-0011 login (argon2, JWT, refresh cookie, rate limit)
- [x] PT-0012 authenticate + requireRole + GET /me (banco vence token)
- [x] PT-0013 refresh rotativo + reuso→revoga família + logout
- [x] PT-0014 forgot/reset + MailAdapter console + revogação de sessões
- [x] PT-0015 seeds dev idempotentes
- [x] PT-0016 suíte de isolamento HTTP
- [x] PT-0017 CI GitHub Actions (mysql:5.7; step tenant-isolation) — required check pendente de repo remoto
- [x] PT-0018 apps/web TS + Router + Query + telas auth + home protegida + proxy
- [x] PT-0019 experiência localhost (npm run dev raiz, README quickstart, demo E2E via API)
- [x] PT-0020 staging prep (Dockerfile, deploy docs, .env.example)
- [ ] PT-0021 tarefa final guiada: subir staging (usuário no comando — pendente)

> Executadas em 2026-07-23 numa única sessão (aprovação: "Pode implementar a
> fase 0"). Código no working tree aguardando revisão humana + commits
> (constituição §3). Validação: lint ✓, typecheck ✓, 31/31 testes ✓ (incl.
> 2 suítes de isolamento), build web ✓, smoke E2E via API ✓.
