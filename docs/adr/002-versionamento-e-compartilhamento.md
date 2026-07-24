# ADR 002 — Versionamento de conteúdo, compartilhamento e escopo da Fatia 1

**Status:** aceito (2026-07-23) · **Decisor:** Emerson (Q1/Q3/escopo respondidos
na sessão) · **Resolve:** Q1, Q3 e parte de Q2/Q7 da spec 000 (§10).

## Q1 — Publicação sobre avaliações existentes: RECALCULAR AUTOMÁTICO

Ao publicar nova versão de um processo:
1. A versão `publicado` anterior vira `arquivado`; o rascunho vira `publicado`.
2. As marcações (`assessment`) migram na MESMA transação pela identidade
   estável do artefato (`logical_key`): `assessment.artifact_id` é atualizado
   do artefato v(n) para o v(n+1) de mesmo logical_key.
3. Artefato novo aparece como `nao_iniciado`; artefato removido deixa de
   contar (a marcação órfã permanece na linha antiga, inerte, para histórico).
4. O nível é sempre CALCULADO contra a versão publicada corrente — pode cair
   após uma publicação. É o comportamento honesto e mantém o benchmark
   comparável. (Notificação ao centro: fatia futura.)
5. A migração roda via `runWithoutTenantScope` (cruza tenants por definição)
   e é auditada (`content.published`, com contagem de marcações migradas).

## Q3 — Artefato compartilhado: PUBLICAR O DONO AFETA IMEDIATAMENTE

O artefato pertence à `content_version` do processo-DONO. A regra única de
leitura do motor e do Raio-X é:

> Contam para o processo X os `artifact_placement` com `process_id = X` cujo
> artefato pertence à **versão publicada corrente** do seu processo-dono.

Publicou o dono → todos os processos que referenciam leem o artefato novo na
hora. Não há estado de "revalidação pendente". Consequência assumida (RN-2):
o Raio-X de um processo é uma composição de versões publicadas de mais de um
processo — "snapshot imutável" vale por processo-dono.

## Q2 (parcial) — Processos personalizados: ADIADOS

Fora da Fatia 1 (YAGNI; o marco da Etapa 1 não depende deles). Quando
entrarem, a modelagem dedicada (`custom_process`) resolve também o achado de
isolamento BN-3. Até lá, todo o catálogo tem `tenant_id IS NULL`.

## Q7 (provisório) — Condições de aplicabilidade de artefato

Lookup `applicability_condition` com avaliação hardcoded contra o perfil:
- `centro_publico` → `tenant.tipo_instituicao = 'publica'`
- `possui_pi_refrigerado` → campo homônimo do tenant
- `possui_amostras` → campo homônimo do tenant

Regra de segurança da régua: perfil **desconhecido (NULL) = artefato
APLICÁVEL** (nunca excluir silenciosamente por falta de resposta — RN-3).
Exclusões por condição são expostas no detalhe do processo (transparência).

## Nível geral (interino)

Média simples (1 casa) dos níveis dos processos aplicáveis. A ponderação por
relevância estratégica entra na Fatia 2 junto com `objective_process_weight`.
