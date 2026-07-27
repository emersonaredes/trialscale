# Inventário dos models Sequelize — TrialScale

Pacote de revisão externa. Gerado a partir de `apps/api/src/models/*.ts` em 2026-07-27.
Complementa `docs/db/schema.sql` (DDL, estrutura) e `docs/db/lookups.sql` (vocabulário fixo).

## Convenções globais (`apps/api/src/db/sequelize.ts`)

- `sync` **nunca** é chamado: o schema SQL é a fonte da verdade; os models apenas
  **mapeiam** tabelas existentes.
- `define`: `freezeTableName: true` (nome de tabela = nome do model, singular),
  `underscored: true`, `timestamps: false` (colunas `created_at`/`updated_at` têm
  `DEFAULT` no banco e só são mapeadas quando o código as lê).
- Timezone `+00:00` (DATETIME sempre em UTC); charset `utf8mb4`.
- Valores `DECIMAL` chegam como **string** no runtime (dinheiro nunca em float).

## Escopo de tenant (ADR 001)

Não há associações Sequelize; o vínculo transversal de cada model é a **zona de
tenancy**, registrada por `registerTenancy(Model, zona)` e aplicada por hooks
globais + `AsyncLocalStorage`:

| Zona | Semântica |
|---|---|
| `tenant` | Dados do centro — filtro automático por `tenant_id` do contexto da request |
| `catalog` | Catálogo versionado — `tenant_id IS NULL` (global) nesta fase; preparado para personalizados |
| `global` | Sem filtro automático (identidade, lookups, junções globais); escopo por `user_id` nos repositories de identidade |

## Associações

**Nenhuma associação Sequelize é declarada** (`hasMany`/`belongsTo`/`hasOne`/
`belongsToMany` não são usados no código). A integridade referencial vive nas
FKs do `schema.sql`; os joins são feitos manualmente nos repositories
(`apps/api/src/repositories/`), única camada autorizada a importar models
(regra de lint do ADR 001). As colunas `*_id` de cada model indicam a FK
correspondente no DDL.

## Enums de domínio (`apps/api/src/types/domain.ts`)

| Tipo | Valores |
|---|---|
| `Role` | `administrador`, `coordenador`, `membro` |
| `TipoInstituicao` | `publica`, `privada`, `terceiro_setor` |
| `ProtocolosFaixa` | `0_10`, `11_30`, `31_50`, `51_100`, `101_200`, `200_mais` |
| `ProcessGroup` | `central`, `suporte`, `gestao`, `personalizado` |
| `VersionStatus` | `rascunho`, `publicado`, `arquivado` |
| `Classification` | `essencial`, `complementar` |
| `AssessmentState` | `nao_iniciado`, `em_elaboracao`, `completo` |
| `RoundStatus` | `aberta`, `concluida` |
| `AchievementType` | `selo`, `medalha` |

---

## 1. Identidade e centro — `models/index.ts`

### User → `user` (zona: global)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| email | STRING(255) | não | único no DDL |
| password_hash | STRING(255) | não | argon2id |
| name | STRING(200) | não | |
| is_staff | BOOLEAN | não | default `false`; libera o CMS/backoffice |
| created_at | DATE | sim | default no banco |

### Tenant → `tenant` (zona: global)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| name | STRING(200) | não | |
| tipo_instituicao | ENUM(`publica`,`privada`,`terceiro_setor`) | sim | "tipo de tenant" — ENUM inline, não é tabela de lookup |
| cidade | STRING(120) | sim | |
| estado | CHAR(2) | sim | UF |
| protocolos_ativos_faixa | ENUM(`0_10`,`11_30`,`31_50`,`51_100`,`101_200`,`200_mais`) | sim | |
| tamanho | STRING(40) | sim | |
| fase_estudos | STRING(40) | sim | |
| tempo_existencia | STRING(40) | sim | |
| plan_id | SMALLINT UNSIGNED | sim | FK → `plan`; null = gratuito |
| possui_pi_refrigerado | BOOLEAN | sim | insumo das condições de aplicabilidade |
| possui_amostras | BOOLEAN | sim | idem |

### Membership → `membership` (zona: global)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| tenant_id | BIGINT UNSIGNED | não | FK → `tenant` |
| user_id | BIGINT UNSIGNED | não | FK → `user` |
| role | ENUM(`administrador`,`coordenador`,`membro`) | não | |
| created_at | DATE | sim | |

### Consent → `consent` (zona: tenant)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| tenant_id | BIGINT UNSIGNED | não | preenchido pelo hook de tenancy |
| user_id | BIGINT UNSIGNED | não | FK → `user` |
| consent_version | STRING(40) | não | |
| consented_at | DATE | não | |
| text_ref | STRING(255) | não | referência do texto aceito (LGPD) |

### AuditLog → `audit_log` (zona: global)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| tenant_id | BIGINT UNSIGNED | sim | null em eventos de plataforma |
| user_id | BIGINT UNSIGNED | sim | |
| event_type | STRING(80) | não | ex.: `content.published` |
| entity | STRING(80) | não | |
| entity_id | STRING(80) | sim | |
| metadata | JSON | sim | |
| created_at | DATE | sim | |

### RefreshToken → `refresh_token` (zona: global)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| user_id | BIGINT UNSIGNED | não | FK → `user` |
| tenant_id | BIGINT UNSIGNED | sim | tenant ativo da sessão |
| token_hash | CHAR(64) | não | SHA-256 do token opaco |
| family_id | CHAR(36) | não | detecção de reuso (rotação) |
| expires_at | DATE | não | |
| revoked_at | DATE | sim | |
| replaced_by_id | BIGINT UNSIGNED | sim | elo da rotação |
| created_at | DATE | sim | |

### PasswordResetToken → `password_reset_token` (zona: global)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| user_id | BIGINT UNSIGNED | não | FK → `user` |
| token_hash | CHAR(64) | não | single-use |
| expires_at | DATE | não | |
| used_at | DATE | sim | |
| created_at | DATE | sim | |

### Specialty → `specialty` (zona: global — lookup)
| Campo | Tipo | Null |
|---|---|---|
| id | SMALLINT UNSIGNED | não (PK, AI) |
| code | STRING(60) | não |
| name | STRING(120) | não |

### TenantSpecialty → `tenant_specialty` (zona: tenant)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| tenant_id | BIGINT UNSIGNED | não | hook de tenancy |
| specialty_id | SMALLINT UNSIGNED | não | FK → `specialty` |

---

## 2. Catálogo de conteúdo — `models/catalog.ts`

### Process → `process` (zona: catalog)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| tenant_id | BIGINT UNSIGNED | sim | null = catálogo global (ADR 002) |
| code | STRING(20) | sim | ex.: `2.5` |
| name | STRING(200) | não | |
| process_group | ENUM(`central`,`suporte`,`gestao`,`personalizado`) | não | |
| one_line_description | TEXT | sim | |
| objective_text | TEXT | sim | |

### ContentVersion → `content_version` (zona: catalog)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| process_id | BIGINT UNSIGNED | não | FK → `process` |
| tenant_id | BIGINT UNSIGNED | sim | |
| version_no | INTEGER UNSIGNED | não | |
| status | ENUM(`rascunho`,`publicado`,`arquivado`) | não | default `rascunho`; 1 publicada por processo |
| published_at | DATE | sim | |
| created_by | BIGINT UNSIGNED | sim | FK → `user` |
| notes | TEXT | sim | |

### Level → `level` (zona: catalog)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| content_version_id | BIGINT UNSIGNED | não | FK → `content_version` |
| tenant_id | BIGINT UNSIGNED | sim | |
| number | TINYINT UNSIGNED | não | 1–5 |
| name | STRING(40) | não | Inicial/Informal/Definido/Gerenciado/Otimizado |
| description | TEXT | sim | |

> "Níveis" não são tabela de lookup: são linhas por versão de conteúdo, com os
> nomes fixados na aplicação (`LEVEL_NAMES` em `content-service.ts`).

### Artifact → `artifact` (zona: catalog)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| content_version_id | BIGINT UNSIGNED | não | FK → `content_version` |
| tenant_id | BIGINT UNSIGNED | sim | |
| logical_key | STRING(80) | não | chave estável entre versões (migração de marcações) |
| artifact_type_id | TINYINT UNSIGNED | não | FK → `artifact_type` |
| title | STRING(255) | não | |
| dod_text | TEXT | não | definição de pronto |
| why_it_matters | TEXT | sim | texto instrutivo (PT-0064) |
| owner_process_id | BIGINT UNSIGNED | não | FK → `process` (dono) |
| applicability_condition_id | SMALLINT UNSIGNED | sim | FK → `applicability_condition` |

### ArtifactSeal → `artifact_seal` (zona: global)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| artifact_id | BIGINT UNSIGNED | não | PK composta; FK → `artifact` |
| seal_code | CHAR(1) | não | PK composta; FK → `origin_seal` (T/G/A/P/D) |

### ArtifactPlacement → `artifact_placement` (zona: catalog)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| artifact_id | BIGINT UNSIGNED | não | FK → `artifact` |
| process_id | BIGINT UNSIGNED | não | FK → `process` (artefato pode contar em N processos) |
| tenant_id | BIGINT UNSIGNED | sim | |
| level_number | TINYINT UNSIGNED | não | 2–5 |
| classification | ENUM(`essencial`,`complementar`) | não | |

### ArtifactTemplate → `artifact_template` (zona: global)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| artifact_id | BIGINT UNSIGNED | não | FK → `artifact` |
| file_ref | STRING(500) | não | objeto no storage da plataforma; compartilhado entre versões clonadas |
| filename | STRING(255) | não | |
| mime_type | STRING(120) | não | |
| size_bytes | BIGINT UNSIGNED | não | |

### ArtifactType → `artifact_type` (zona: global — lookup)
| Campo | Tipo | Null |
|---|---|---|
| id | TINYINT UNSIGNED | não (PK, AI) |
| code | STRING(40) | não |
| name | STRING(120) | não |

### ApplicabilityCondition → `applicability_condition` (zona: global — lookup)
| Campo | Tipo | Null |
|---|---|---|
| id | SMALLINT UNSIGNED | não (PK, AI) |
| code | STRING(60) | não |
| description | STRING(255) | não |

### Assessment → `assessment` (zona: tenant)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| tenant_id | BIGINT UNSIGNED | não | hook de tenancy |
| artifact_id | BIGINT UNSIGNED | não | FK → `artifact` |
| state | ENUM(`nao_iniciado`,`em_elaboracao`,`completo`) | não | default `nao_iniciado` |
| expected_due_date | DATEONLY | sim | |
| completed_at | DATE | sim | |

### ProcessApplicability → `process_applicability` (zona: tenant)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| tenant_id | BIGINT UNSIGNED | não | hook de tenancy |
| process_id | BIGINT UNSIGNED | não | FK → `process` |
| applies | BOOLEAN | não | default `true` |
| na_justification | STRING(500) | sim | obrigatória na aplicação quando `applies=false` |

---

## 3. Jornada gratuita — `models/journey.ts`

### Objective → `objective` (zona: global — lookup)
| Campo | Tipo | Null |
|---|---|---|
| id | SMALLINT UNSIGNED | não (PK, AI) |
| theme | STRING(80) | não |
| name | STRING(200) | não |

### TenantObjective → `tenant_objective` (zona: tenant)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| tenant_id | BIGINT UNSIGNED | não | hook de tenancy |
| objective_id | SMALLINT UNSIGNED | não | FK → `objective` |
| priority_rank | INTEGER | não | ordem escolhida pelo centro (máx. 8 na UI) |

### PainScore → `pain_score` (zona: tenant)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| tenant_id | BIGINT UNSIGNED | não | hook de tenancy |
| process_id | BIGINT UNSIGNED | não | FK → `process` |
| score | TINYINT UNSIGNED | não | termômetro de dor |

---

## 4. Jornada paga — `models/paid-journey.ts`

### Plan → `plan` (zona: global — lookup)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | SMALLINT UNSIGNED | não | PK, auto increment |
| code | STRING(40) | não | |
| name | STRING(120) | não | |
| amount | DECIMAL(10,2) | não | chega como **string** no runtime |

### Round → `round` (zona: tenant)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| tenant_id | BIGINT UNSIGNED | não | hook de tenancy |
| sequence_no | INTEGER UNSIGNED | não | Rodada 1, 2, … |
| status | ENUM(`aberta`,`concluida`) | não | default `aberta` |
| started_at | DATE | sim | |
| completed_at | DATE | sim | |
| challenge_weeks | INTEGER UNSIGNED | sim | |

### RoundProcess → `round_process` (zona: tenant)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| round_id | BIGINT UNSIGNED | não | FK → `round` |
| tenant_id | BIGINT UNSIGNED | não | hook de tenancy |
| process_id | BIGINT UNSIGNED | não | FK → `process` |
| baseline_level | TINYINT UNSIGNED | sim | nível no início da rodada (conclui ao subir 1) |

### ObjectiveProcessWeight → `objective_process_weight` (zona: global — curadoria)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| objective_id | SMALLINT UNSIGNED | não | FK → `objective` |
| process_id | BIGINT UNSIGNED | não | FK → `process` |
| weight | DECIMAL(5,2) | não | insumo da priorização (60% dor + 40% estratégia); string no runtime |

### ProcessDependency → `process_dependency` (zona: global)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| from_process_id | BIGINT UNSIGNED | não | FK → `process` |
| to_process_id | BIGINT UNSIGNED | não | FK → `process` |
| type | STRING(40) | não | ex.: "destrava" |

---

## 5. Gamificação — `models/gamification.ts`

### Achievement → `achievement` (zona: global — lookup)
| Campo | Tipo | Null |
|---|---|---|
| id | SMALLINT UNSIGNED | não (PK, AI) |
| code | STRING(60) | não |
| name | STRING(160) | não |
| type | ENUM(`selo`,`medalha`) | não |

### TenantAchievement → `tenant_achievement` (zona: tenant)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| id | BIGINT UNSIGNED | não | PK, auto increment |
| tenant_id | BIGINT UNSIGNED | não | hook de tenancy |
| achievement_id | SMALLINT UNSIGNED | não | FK → `achievement` |
| earned_at | DATE | sim | default no banco |

---

## 6. Texto instrutivo — `models/guide.ts`

### ProcessGuide → `process_guide` (zona: global — conteúdo editorial)
| Campo | Tipo | Null | Observações |
|---|---|---|---|
| process_id | BIGINT UNSIGNED | não | **PK** (1:1 com `process`), FK → `process` |
| purpose_md | TEXT | não | "Por que este processo importa" |
| flow_md | TEXT | sim | prosa do funcionamento |
| flow_inputs | JSON | sim | `string[]` — chips de entradas |
| flow_activities | JSON | sim | `string[]` |
| flow_outputs | JSON | sim | `string[]` |
| indicators | JSON | sim | `string[]` |
| risks | JSON | sim | `string[]` |
| practices | JSON | sim | `Array<{title, text}>` |
| regulatory | JSON | sim | `Array<{source, text, url?}>` — itens [A] exigem curadoria humana |
| getting_started | JSON | sim | `string[]` — "Comece por aqui" |
| source_citation | TEXT | sim | |

---

## Tabelas do schema **sem** model Sequelize

| Tabela | Motivo |
|---|---|
| `origin_seal` | Catálogo dos selos T/G/A/P/D; o código referencia só o `seal_code` (CHAR(1)) via `artifact_seal` |
| `level_target` | Prevista no modelo de dados (metas de nível por processo); ainda sem uso na aplicação |

Contagem: **31 models** mapeando 31 das **33 tabelas** do schema.
