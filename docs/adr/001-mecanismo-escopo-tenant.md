# ADR 001 — Mecanismo central de escopo de tenant

**Status:** aceito (2026-07-23) · **Decisores:** Emerson (aprovação), plano da Fatia 0
revisado pelo agente app-architect · **Materializa:** constituição §1.

## Contexto

O TrialScale é multi-tenant em banco MySQL único, com isolamento lógico por
`tenant_id`. A constituição exige que nenhuma query acesse dados sem escopo de
tenant aplicado por mecanismo central — escopo manual por query é proibido
porque UMA omissão vaza dados entre centros de pesquisa.

## Decisão

Tripé **AsyncLocalStorage + hooks globais do Sequelize + repository base**:

1. **`RequestContext` em `AsyncLocalStorage`** (`src/context/request-context.ts`),
   populado pelo middleware `authenticate` a partir do **token JWT** — nunca de
   body/query. Propaga por async/await sem passar parâmetro.
2. **Registro de tenancy por model** (`src/db/tenancy.ts`):
   - `'tenant'` — dados de centro (`tenant_id NOT NULL`). Hooks em
     find/count/create/bulkCreate/update/bulkUpdate/destroy/bulkDestroy:
     injetam `tenant_id` do contexto (sobrescrevendo qualquer valor externo)
     ou verificam igualdade. **Sem contexto → `MissingTenantContextError`**
     (falha por padrão: perda de contexto é erro barulhento, nunca vazamento).
   - `'global'` — identidade e lookups: `user`, `tenant` (raiz), `membership`,
     `refresh_token`, `password_reset_token`, `audit_log`, `specialty`, `plan`.
     **Racional:** login/refresh/authenticate rodam ANTES de existir contexto
     de tenant; se identidade fosse `'tenant'`, todo login passaria pelo escape
     hatch e a garantia viraria ruído. O escopo de identidade é por **user_id**,
     aplicado explicitamente nos repositories de identidade.
   - `'catalog'` — `tenant_id` anulável (conteúdo global + personalizado,
     Fatia 1): leitura = `tenant_id IS NULL OR tenant_id = ctx.tenantId`.
3. **Repositories**: services nunca tocam models. ESLint `no-restricted-imports`
   permite models só em `repositories/` e `db/`. Repositories de dados de centro
   NÃO aceitam `tenantId` como parâmetro (vem do contexto).

## Operações bloqueadas

`sum/min/max/aggregate/increment/decrement/upsert` **direto no model** de
tenancy `'tenant'` são bloqueados em runtime (patch em `registerTenancy`) e no
lint (`no-restricted-syntax`): não disparam `beforeFind` e agregariam
cross-tenant em silêncio. Raw `sequelize.query()` é proibida fora de
repositories; dentro, exige escopo explícito + justificativa na revisão de PR.

## Escape hatch único

`runWithoutTenantScope(reason, fn)` — para fluxos internos documentados.
Toda utilização deve ser auditada (`audit_log`, evento `tenant_scope.bypass`).

## Consequências

- (+) Esquecer escopo é impossível de passar em silêncio: ou o hook injeta, ou lança erro.
- (+) A suíte de isolamento (CI, required check) prova o comportamento a cada PR.
- (−) `include` aninhado e raw query têm cobertura parcial → teste obrigatório
  ao introduzir associações (Fatia 1); raw restrita a repositories.
- (−) Perda de contexto em callbacks fora da cadeia async vira erro 500 — é o
  comportamento seguro; corrigir mantendo o trabalho dentro da cadeia.
