# Spec 005 — Recompensa e relatório (Etapa 4)

> Nome do relatório (decisão 2026-07-24): **Mapa de Maturidade TrialScale**.
> Conversa com a "Rota da logo" do DS v2; nunca sugere certificação.

## Comportamento

1. **Conquistas** (concepção §5): catálogo de 10 conquistas [D] — selos
   (primeiros passos: objetivos, fotografia, primeira trilha, níveis 3/4) e
   medalhas (marcos: nível 5, cinco no Definido, suporte 3+, rodadas 1 e 3).
   Avaliação **lazy e idempotente**: qualquer consulta verifica o estado real
   e concede o que faltar (nunca revoga; auditada). Página com conquistadas
   vs bloqueadas (com dica de como destravar) e aviso celebratório nas novas.
2. **Mapa de Maturidade TrialScale (PDF)**: cabeçalho com o logotipo Rota
   Ancorada, ressalva DESTACADA de autodeclaração/não-conformidade
   (constituição §6), nível geral, níveis por processo (badges na escala do
   DS) com progresso de essenciais, maiores dores, rodadas concluídas e
   conquistas; rodapé com paginação. Geração server-side (pdfkit).
3. Ambos fazem parte da jornada paga (gating PLAN_REQUIRED).

## Critérios de aceite (→ testes)

- CA-1: conquistas concedidas pelos marcos reais (objetivos→primeiro-passo;
  termômetro completo→fotografia-completa; artefato completo→primeira-trilha;
  níveis 3/4/5; suporte 3+; rodadas 1/3).
- CA-2: reavaliar não duplica nem revoga (idempotente; único tenant×conquista).
- CA-3: /achievements e /report/pdf → 403 PLAN_REQUIRED sem plano.
- CA-4: PDF válido (%PDF, content-type, filename com data), com ressalva de
  autodeclaração SEMPRE presente.

## Fora de escopo

Notificações de conquista (Etapa 5), selos por processo no painel (evolução
futura), fontes da marca embutidas no PDF (Helvetica por ora — registrado).
