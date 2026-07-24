# Spec 003 — Jornada gratuita (Fatia 2 / Etapa 2)

> Marco (plano §3): um centro real consegue se cadastrar e sair com sua
> fotografia de dor. Decisões do usuário (2026-07-24): termômetro cobre os 28
> processos do catálogo (23 seedados sem artefatos, curadoria via CMS);
> convites de usuários ficam para fatia própria.

## Comportamento

1. **Objetivos estratégicos (Fase 1, leve):** menu de ~30 objetivos agrupado
   por 7 temas (concepção §2). O centro seleciona e ORDENA (prioridade
   relativa — alimenta a ponderação futura). Editável a qualquer momento.
2. **Termômetro de dor:** os 28 processos com descrição de uma linha; nota
   única de dor 1–5 por processo ("quanto isso te incomoda?"); salvar e
   retomar (upsert por processo — sessão nunca se perde); orientação
   explícita de workshop coletivo. Não se pede maturidade percebida
   (concepção §4 — anti Dunning-Kruger).
3. **Fotografia:** visual imediato da dor por grupo de processos, top dores
   destacadas, progresso de resposta; é a entrega de valor do gratuito e o
   gancho para a Fase 2 (Raio-X nos processos publicados).

## Critérios de aceite

- CA-1: termômetro lista TODOS os processos do catálogo (28 com o seed);
  Raio-X continua listando só publicados.
- CA-2: nota fora de 1–5 → 400; nota é upsert (regravar substitui).
- CA-3: salvar/retomar: respostas parciais persistem; progresso X/28 correto.
- CA-4: objetivos salvos com ordem (rank 1..N); regravar substitui a seleção;
  objetivo inexistente → 400.
- CA-5: fotografia agrega: média de dor por grupo, top 5 dores (desempate por
  código), respondidos/total.
- CA-6: isolamento — notas e objetivos de um centro nunca aparecem para outro
  (tenancy 'tenant' + suíte).
- CA-7: seed dos 23 processos idempotente, com descrições fiéis aos
  documentos de conteúdo.

## Fora de escopo

Priorização dor×estratégia×dependências (Etapa 3), ponderação do nível geral
(exige curadoria de objective_process_weight — Q6), gating freemium (Etapa 3),
convites (fatia própria), benchmark.
