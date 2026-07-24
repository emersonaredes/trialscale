# TrialScale

Plataforma SaaS multi-tenant que guia centros de pesquisa clínica a elevar
sua maturidade de gestão. Freemium; jornada: cadastro → objetivos →
termômetro de dor → rodadas de melhoria por artefatos → níveis 1–5.

## Fontes de verdade
- docs/concepcao.md — decisões de produto
- docs/plano-implementacao.md — módulos e etapas
- docs/conteudo/ — catálogo dos 28 processos (seeds de conteúdo)
- docs/constitution.md — princípios INEGOCIÁVEIS (leia antes de qualquer tarefa)
- specs/NNN-*/ — especificação da feature atual (spec.md, plan.md, tasks.md)

## Stack (decidida — mudanças só via ADR em docs/adr/)
- Monorepo npm workspaces: apps/api + apps/web
- Backend: Node + TypeScript estrito + Express + Sequelize + MySQL (5.7 dev)
- Frontend: React + Vite + TypeScript + React Router + TanStack Query
  (design system Tailwind+shadcn/ui entra no Passo 3 do roadmap)
- Testes: Jest (unit/integration/isolation); Playwright E2E depois
- Auth: JWT próprio (access 15min em memória) + refresh opaco rotativo em
  cookie httpOnly; argon2id
- Escopo de tenant: MECANIZADO — ver docs/adr/001-mecanismo-escopo-tenant.md

## Comandos (raiz)
- `npm run dev` — api (3333) + web (5173, proxy /api) juntos
- `npm run lint` / `npm run typecheck` / `npm test`
- `npm run test:isolation` — suíte de isolamento (required check no CI)
- `npm run db:apply` — aplica specs/000-modelo-de-dados/schema.sql (fonte da verdade)
- `npm run seed` — 2 centros × 3 papéis + staff (senha TrialScale#2026)
- `npm run seed:content` — publica os 5 processos do MVP via fluxo real do CMS

## Design System
Siga estritamente docs/design-system/design-system.md (TrialScale DS v2
densa) para qualquer UI: tokens de referência em docs/design-system/tokens.css
(implementados em apps/web/src/index.css), referência visual em
docs/design-system/styleguide.html.
Regras inegociáveis: verde (#17B583) só para completar/conquistar; 1 botão
primário por tela; gradiente âmbar→coral só em celebrações; níveis de
maturidade usam a escala "Rota da logo" (azul→verde→âmbar); linguagem
informal encorajadora em pt-BR ("você"); nunca sugerir certificação — sempre
"autodeclarado".
Fontes: Sora (títulos), Public Sans (corpo), IBM Plex Mono (dados),
Bricolage Grotesque (só no logo). Densidade alta: corpo 13px, paddings
enxutos. Componentes base: apps/web/src/shared/components/ (badges, Logo).
Versionamento/compartilhamento de conteúdo: docs/adr/002-*.md

## Convenções
- TypeScript estrito em todo o código; validação Zod nas fronteiras da API
- Toda query com escopo de tenant via [mecanismo central] — NUNCA escopo manual
- Commits semânticos: feat(Escopo): descrição [PT-XXXX]
- Branch por tarefa → PR → revisão humana → merge; nada direto na main
- Testes acompanham a implementação; critérios de aceite da spec viram testes
- UI em português do Brasil; termos consagrados do setor podem ficar em
  inglês (site, feasibility, SAE)
- Ao implementar, explique as decisões técnicas tomadas (o dev está
  aprendendo a stack)

## Domínio (vocabulário)
tenant = centro de pesquisa · process/level/artifact = catálogo de maturidade ·
assessment = marcação de artefatos do centro · pain_score = termômetro ·
round = rodada de 3–4 processos · DoD = definição de pronto do artefato