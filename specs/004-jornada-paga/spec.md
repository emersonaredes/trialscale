# Spec 004 — Jornada paga núcleo (Etapa 3)

> Decisões do usuário (2026-07-24): assinatura SIMULADA pelo próprio centro
> (placeholder até o gateway da Etapa 5); mapa objetivo→processo seedado como
> RASCUNHO [D] para curadoria; rodada conclui quando TODOS os processos sobem
> ao menos 1 nível. Inclui migração da UI para o design system v2 densa.

## Comportamento

1. **Gating freemium** (concepção §6): gratuito = cadastro, objetivos,
   termômetro, fotografia; pago = Raio-X/níveis, priorização, rodadas/kanban,
   templates. Bloqueio com código `PLAN_REQUIRED` → paywall convidativo.
   Staff passa sempre. Admin ativa/cancela plano (simulado, auditado).
2. **Priorização** (concepção §4): score 0–100 = 60% dor + 40% relevância
   estratégica (objetivos priorizados × mapa objetivo→processo, rank pesa);
   dependências = "destrava N" (sinalização, nunca trava). **Risco
   silencioso**: dor ≤2 + maturidade ≤2, destacado em âmbar.
3. **Rodadas**: 3–4 processos (sugestão ajustável), baseline de nível
   capturado na criação, desafio opcional de N semanas, UMA aberta por vez.
   **Kanban**: artefatos até o próximo nível como tarefas, drag-and-drop
   entre colunas (= marcação de estado). Conclusão habilita quando todos
   subiram ≥1 nível → celebração (gradiente âmbar→coral, de→para).
4. **DS v2 densa**: tokens novos (corpo 13px, raios menores), escala de
   níveis "Rota da logo" (azul→verde→âmbar), logotipo Rota Ancorada na
   sidebar e favicon, Bricolage Grotesque no wordmark.

## Critérios de aceite (→ testes)

- CA-1: rota paga sem plano → 403 PLAN_REQUIRED; com plano → 200; termômetro/
  fotografia seguem livres; staff bypassa.
- CA-2: assinar (admin) grava plano, audita e aparece na sessão (planCode).
- CA-3: score = 0.6·dorNorm + 0.4·relNorm (0–100); relevância pondera rank
  dos objetivos; risco silencioso = dor≤2 ∧ nível≤2 (publicado, aplicável).
- CA-4: rodada exige 3–4 processos publicados/aplicáveis/abaixo do topo;
  baseline capturado; uma aberta por vez; sequence incrementa.
- CA-5: concluir bloqueado até todos subirem ≥1 nível; celebração devolve
  de→para; próxima rodada = sequence+1.
- CA-6: kanban agrupa artefatos (nível ≤ atual+1) por estado; completar
  essencial move o alvo do processo para o nível seguinte.

## Fora de escopo

Gateway de pagamento real (Etapa 5), gamificação/selos e relatório PDF
(Etapa 4), notificações/reengajamento (Etapa 5), curadoria final do mapa
objetivo→processo (pendência sua — editor no CMS em fatia futura).
