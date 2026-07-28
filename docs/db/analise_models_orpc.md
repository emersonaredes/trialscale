# TrialScale — Análise do Modelo de Dados × Catálogo ORPC
## Revisão externa do `models.md` (2026-07-27) contra os requisitos acumulados

*Proposta para o `db-architect` e revisão humana. Nenhuma alteração deve ser aplicada diretamente; DDLs abaixo são esboços de partida. Recomendação de processo ao fim.*

---

## 1. O que o modelo atual JÁ cobre (não mexer)

| Requisito do produto | Como está resolvido |
|---|---|
| Versionamento de conteúdo sobre avaliações existentes | `content_version` (rascunho/publicado/arquivado) + `artifact.logical_key` para migrar marcações entre versões |
| Artefato compartilhado com processo-dono | `artifact.owner_process_id` + `artifact_placement` N:N |
| Essencial/complementar por processo e nível | `artifact_placement.classification` — granularidade correta |
| Artefato condicional ao perfil | `applicability_condition` (lookup) + booleanos de perfil no `tenant` |
| N/A com justificativa | `process_applicability.applies` + `na_justification` |
| Processo personalizado por tenant | `process.tenant_id` NULL para global + grupo `personalizado`; zona `catalog` preparada |
| Templates anexados pela equipe | `artifact_template` (zona global, storage próprio) |
| Metas de nível por processo | tabela `level_target` já existe no schema (sem model — ativar quando necessário) |
| Selos de origem múltiplos por artefato | `artifact_seal` N:N com `origin_seal` |
| Rodadas 3–4 processos, desafio N semanas, baseline | `round` + `round_process.baseline_level` |
| Priorização 60% dor + 40% estratégia | `pain_score` + `objective_process_weight` |

## 2. Mudanças que NÃO exigem alteração de schema (só INSERT em lookup + código)

**2.1 Tipo de artefato "documento de governança"**
```sql
INSERT INTO artifact_type (code, name) VALUES ('documento_governanca', 'Documento de governança');
```
Propagação: nenhuma no schema. Aplicação: se houver validação Zod/UI com lista fixa de códigos, incluir o novo código; CMS passa a exibi-lo.

**2.2 Selo de origem [R] (arquitetura de referência ORPC)**
```sql
INSERT INTO origin_seal (seal_code, name) VALUES ('R', 'Arquitetura de referência ORPC');
```
Conferir colunas reais de `origin_seal` no `schema.sql` (não veio no models.md). Propagação: badge no frontend; legenda.

**2.3 Condições de aplicabilidade ORPC**
```sql
INSERT INTO applicability_condition (code, description) VALUES
 ('presta_monitoria', 'ORPC presta serviços de monitoria'),
 ('seleciona_centros', 'ORPC atua na seleção e qualificação de centros'),
 ('assume_regulatorio', 'ORPC assume atribuições regulatórias perante a Anvisa'),
 ('assume_farmacovigilancia', 'ORPC assume atividades de segurança/farmacovigilância'),
 ('presta_gestao_dados', 'ORPC presta serviços de gestão de dados'),
 ('perfil_fomento', 'Organização com captação via fomento/editais');
```
⚠ Ponto de atenção para o db-architect: como o avaliador de condições resolve `code` → campo do perfil? Se o mapeamento é hardcoded no service, cada condição nova exige código. Avaliar se `applicability_condition` deveria ganhar uma coluna declarativa (ex.: `tenant_field`) — decisão de design, não urgente.

## 3. Mudanças NECESSÁRIAS para o catálogo ORPC existir

**3.1 Tipo de organização no tenant** — a dimensão ausente.
```sql
ALTER TABLE tenant
  ADD COLUMN org_type ENUM('cpc','orpc') NOT NULL DEFAULT 'cpc' AFTER name;
```
Backfill: todos os tenants atuais são `cpc` (o DEFAULT resolve). Imutável após o cadastro (regra de aplicação).

**3.2 Catálogo do processo**
```sql
ALTER TABLE process
  ADD COLUMN org_type ENUM('cpc','orpc') NOT NULL DEFAULT 'cpc' AFTER process_group,
  ADD INDEX idx_process_orgtype (org_type, process_group);
```
Recomendação deliberada: **coluna simples, não N:N** (`process_catalog`). Os processos homônimos entre catálogos (pessoas, financeiro, planejamento) terão artefatos suficientemente diferentes para justificar entradas separadas — e a comparação entre tipos no benchmark é hipótese futura, não requisito. Se um dia se provar necessário compartilhar, a migração coluna→N:N é mecânica. Constituição §7: a solução mais simples que passa nos testes.

Nota de nomenclatura: `process_group` = `gestao` serve para os "gerenciais" do ORPC — rótulo de UI, sem mudança de enum.

**3.3 Objetivos por catálogo**
```sql
ALTER TABLE objective
  ADD COLUMN org_type ENUM('cpc','orpc') NOT NULL DEFAULT 'cpc';
```
Os temas/objetivos de uma ORPC não são os de um centro; `objective_process_weight` já acompanha por FK.

**3.4 Perfil ORPC no cadastro** — alimenta as condições de aplicabilidade de 2.3.
```sql
ALTER TABLE tenant
  ADD COLUMN modelo_servico ENUM('full_service','servicos_funcionais','aro','outro') NULL,
  ADD COLUMN assume_atribuicoes_anvisa BOOLEAN NULL,
  ADD COLUMN centros_geridos_faixa ENUM('0_5','6_15','16_40','41_100','100_mais') NULL,
  ADD COLUMN estudos_ativos_faixa ENUM('0_5','6_15','16_40','41_100','100_mais') NULL;
```
Colunas nulas para CPC (mesma filosofia dos booleanos `possui_*`, que são nulos/irrelevantes para ORPC). Alternativa JSON descartada: as condições de aplicabilidade precisam consultar campos tipados.

**Propagação completa das mudanças 3.x** (mapear antes de codar, conforme convenção da organização):
- `types/domain.ts`: novo enum `OrgType`; enums de faixas e modelo de serviço
- Models: `Tenant`, `Process`, `Objective` (+ colunas)
- Repositories: filtros por `org_type` em `process`, `objective` (e por consequência `pain_score`, priorização, trilhas — tudo que lista processos)
- Services: `content-service` (catálogo filtrado), signup (escolha do tipo, imutável), avaliador de aplicabilidade (novas condições), benchmark (recorte por `org_type`, mantendo o mínimo de 5 por segmento)
- Controllers/DTOs Zod: cadastro, CMS de processo (campo catálogo), termômetro
- Frontend: fluxo de cadastro (tipo + perfil condicional), CMS, telas de diagnóstico (rótulos "gerenciais" para ORPC)
- Seeds: catálogo ORPC entra com `org_type='orpc'`
- Testes: isolamento entre catálogos (tenant ORPC nunca vê processo CPC e vice-versa; exceto personalizados do próprio tenant) — **suíte nova obrigatória**

## 4. Mudanças RECOMENDADAS (da atualização regulatória e do modelo ORPC)

**4.1 Data da última verificação regulatória** — requisito registrado em `atualizacao_regulatoria_2026.md` (Parte 4): sem isso, não há como saber que conteúdo [A] está defasado.
```sql
ALTER TABLE artifact
  ADD COLUMN regulatory_verified_at DATE NULL,
  ADD COLUMN regulatory_verified_by BIGINT UNSIGNED NULL;
```
No `process_guide.regulatory` (JSON), adotar por convenção a chave `verified_at` em cada item — sem mudança de schema. Consulta de defasagem: artefatos com selo A e `regulatory_verified_at` antigo ou nulo.

**4.2 Área/departamento como atributo por tenant** — decisão do catálogo ORPC (rodadas temáticas). Como o mapeamento é do organograma de cada organização, o lugar natural é a tabela tenant×processo que já existe:
```sql
ALTER TABLE process_applicability
  ADD COLUMN area_label VARCHAR(80) NULL;
```
Custo mínimo, viabiliza filtro por área e sugestão de rodada temática. (Semanticamente a tabela vira "configuração do processo no tenant" — renomear é opcional e não vale o atrito agora.)

**4.3 Ativar `level_target`** — criar o model e usar na priorização (meta de nível por vocação, ex.: ORPC de carteira cativa com meta 3 em Prospectar). A tabela já existe; é trabalho de aplicação, não de banco.

## 5. OPCIONAIS / adiados conscientemente

- `process_catalog` N:N (compartilhar processo entre catálogos) — só se a comparação entre tipos virar requisito real.
- Snapshot de `org_type` no benchmark — resolver na camada de agregação.
- Tabela própria de "áreas" por tenant (em vez de label livre) — quando houver demanda de padronização.

## 6. Processo recomendado para aplicar

1. Este documento → revisão do **db-architect** (ele critica contra a constituição: tenant scoping, índices, rollback).
2. **Adotar migrations a partir destas mudanças.** Hoje o `schema.sql` é a fonte da verdade sem histórico executável; estas são ~6 ALTERs + 3 INSERTs — o tamanho perfeito para inaugurar `migrations/` com baixo risco (a primeira migration pode ser um marco "baseline = schema.sql atual"). Sem isso, sincronizar dev/staging/produção destas mudanças será manual e propenso a erro.
3. Backup antes de aplicar em qualquer ambiente com dados; nunca direto em produção (constituição §3).
4. Seeds do catálogo ORPC só depois dos ALTERs + suíte de isolamento entre catálogos verde.

*Fim da análise.*
