# Plan 001 — Fundação (decisões técnicas)

Cópia de trabalho do plano aprovado (2026-07-23), já com a revisão do
app-architect incorporada. Detalhe completo: plano da sessão + ADR 001.

## Decisões

- **Monorepo npm workspaces**: `apps/api` (Express+Sequelize+TS) e `apps/web`
  (React+Vite+TS+Router+TanStack Query). `docs/ specs/ scripts/` na raiz.
- **schema.sql é a fonte da verdade** do banco (decisão do usuário); models
  Sequelize mapeiam o schema, `sync` desligado. Bancos existentes evoluem por
  `scripts/migrations/*.sql`.
- **Mecanismo de escopo** (ADR 001): `AsyncLocalStorage` (RequestContext) +
  hooks globais Sequelize + repository base. Taxonomia: `tenant` | `global`
  (identidade: user, membership, refresh_token, audit_log,
  password_reset_token; lookups) | `catalog` (Fatia 1). Model `tenant` sem
  contexto → erro (falha por padrão). Agregações/increment direto no model:
  bloqueados por patch em `registerTenancy` + não expostos no repository.
  Escape hatch único `runWithoutTenantScope(reason, fn)` auditado.
- **Auth**: argon2id (fallback bcryptjs atrás de `PasswordHasher`); access
  JWT HS256 15min; refresh opaco 32B (SHA-256 no banco) em cookie
  `httpOnly; SameSite=Lax; Path=/api/auth` (+`Secure` em produção), TTL 30d,
  rotação com `family_id` e detecção de reuso; rate limit login/forgot;
  register devolve 201 sem autologin.
- **Same-origin**: dev via proxy do Vite (5173 → api 3333); staging: api
  serve o build estático do web.
- **Testes**: Jest projects `unit`/`integration`/`isolation` (integração
  serial); banco `trialscale_test` criado pelo globalSetup (Node+mysql2
  aplica o schema.sql — zero drift); truncateAll entre testes; supertest.
- **CI**: GitHub Actions, Ubuntu + service mysql:5.7; lint → typecheck →
  testes com step "tenant-isolation" nomeado (required check).

## Tabelas novas (schema.sql §2)

`refresh_token` (user_id, tenant_id NULL p/ staff, token_hash CHAR(64) UNIQUE,
family_id, expires_at, revoked_at, replaced_by_id) e `password_reset_token`
(user_id, token_hash UNIQUE, expires_at ~30min, used_at). Ambas identidade
(`global`), escopo por user_id via repositories de identidade.

## Endpoints

Ver tabela no plano/spec: /api/auth/{register,login,refresh,logout,
forgot-password,reset-password}, /api/me, /api/specialties, /api/health.
