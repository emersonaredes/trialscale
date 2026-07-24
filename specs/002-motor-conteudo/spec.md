# Spec 002 — Motor de conteúdo + CMS (Fatia 1 / Etapa 1)

> Decisões de versionamento/compartilhamento: ADR 002. Modelo de dados: spec 000.

## Objetivo

O coração do produto: catálogo de processos → níveis → artefatos, editado e
publicado pela equipe TrialScale via CMS, e o **motor de cálculo de nível**
por essenciais completos. Marco (plano §3): o piloto 2.5 cadastrado via CMS
calcula nível corretamente.

## Comportamento

**Staff (CMS, `/cms`):** criar processo; editar RASCUNHO (campos do processo,
descrições dos 5 níveis, artefatos com tipo, DoD, selos de origem, essencial/
complementar, condição de aplicabilidade, colocações em outros processos);
anexar templates para download (anexos assimétricos); PUBLICAR (arquiva a
anterior, migra marcações por logical_key — ADR 002). Centros nunca veem
rascunho.

**Centro (área logada):** lista dos processos publicados com badge de nível
calculado e progresso; detalhe do processo com artefatos por nível (Raio-X):
marcar estado (não iniciado → em elaboração com data-limite → completo),
baixar templates, marcar processo "não se aplica" com justificativa
(admin/coordenador). Nível recalcula a cada marcação.

## Critérios de aceite (→ suíte permanente 2, motor)

- CA-1: nível N atingido ⇔ TODOS os essenciais dos níveis ≤ N completos;
  complementar faltante não trava.
- CA-2: artefato compartilhado marcado uma vez conta em todos os processos
  que o colocam (dono e referenciadores).
- CA-3: artefato condicional não aplicável ao perfil sai do cálculo (e a
  exclusão é visível); perfil NULL = aplicável.
- CA-4: processo N/A sai do nível geral; justificativa obrigatória.
- CA-5: publicar v2 migra marcações por logical_key e recalcula na hora;
  artefato novo = não iniciado; removido deixa de contar (ADR 002).
- CA-6: publicar o processo-dono afeta imediatamente quem referencia (ADR 002).
- CA-7: data-limite só é aceita em estado "em elaboração" (AC-9 da spec 000).
- CA-8: rascunho é invisível para centros; só staff acessa /cms/*.
- CA-9: upload de template é exclusivo do staff; centro só baixa.
- CA-10: seed de conteúdo carrega os 5 processos do MVP e o piloto 2.5
  calcula nível corretamente de ponta a ponta.

## UI — design system v1.1 obrigatório

Tokens de docs/design-system/design-system.md: badges de nível (escala C),
pills de estado do kanban, selos de origem (NORMA/GCP/SUGESTÃO), botão
primário 1/tela, Sora/Public Sans/IBM Plex Mono. As telas de auth da Fatia 0
são re-estilizadas nesta fatia (nasceram provisórias).

## Fora de escopo

Processos personalizados (ADR 002), termômetro/objetivos/priorização
(Fatia 2), rodadas/kanban board (Fatia 3), gamificação, notificação de
republicação.
