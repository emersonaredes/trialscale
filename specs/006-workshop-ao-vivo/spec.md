# Spec 006 — Workshop ao vivo (modo sala, estilo quiz)

> Pedido do dono do projeto (2026-11-27): módulo para rodar uma **simulação ao
> vivo** do TrialScale em workshops e congressos. O apresentador projeta a
> tela do administrador; a plateia participa pelo celular. Inspiração: quizzes
> ao vivo com QR code e resultados instantâneos no telão.
> Status: **PROPOSTA** — decisões em aberto no fim deste arquivo.

## Atores

- **Apresentador (admin da sala):** usuário staff do TrialScale, logado. Cria
  uma sala por evento (ex.: "Workshop Congresso Norte Nordeste"), conduz os
  passos e projeta a própria tela.
- **Participante:** qualquer pessoa da plateia, **sem conta**. Entra pelo QR
  code, escolhe um apelido e responde pelo celular.

## Fluxo (passos da sala)

| Passo | Tela do apresentador (telão) | Celular do participante |
|---|---|---|
| 1. Entrada | QR code grande + código da sala + lista de apelidos entrando ao vivo e contador | Lê o QR → digita apelido → "Aguarde o apresentador" |
| 2. Objetivos | Contador de respostas ao vivo; botão "Encerrar votação" a qualquer momento | Lista resumida dos 28 objetivos por tema; escolhe **até 3** e envia (pode trocar até o encerramento) |
| 3. Objetivos da plateia | Ranking ao vivo dos objetivos mais votados (barras) | "Votação encerrada — olhe o telão" |
| 4. Processos prioritários | Ranking dos processos mais ligados aos objetivos votados (matriz objetivo×processo); clique abre o **detalhe do processo** (o mesmo conteúdo da tela atual do TrialScale) | Idem |
| 5. Escolha do processo | Apresentador escolhe um processo e envia para os celulares | Recebe o processo automaticamente |
| 6. Autoavaliação | Contador "X de N finalizaram" ao vivo | Níveis 1–5 com os artefatos de cada nível (essenciais destacados); marca o que o centro **já possui** |
| 7. Resultado individual | Idem | "Seu centro está no nível N — Nome do nível", com o que falta para o próximo (ressalva: autodeclarado, não certificação) |
| 8. Distribuição | Quantos participantes em cada nível (1–5), ao vivo | Idem |

Depois do passo 8, o apresentador pode voltar ao passo 5 e rodar outro
processo na mesma sala, ou encerrar a sala.

## Regras de negócio

- **RN-1 Ranking de objetivos (passo 3):** votos por objetivo = nº de
  participantes que o escolheram.
- **RN-2 Ranking de processos (passo 4):**
  `pontos(processo) = Σ_objetivos votos(objetivo) × peso(objetivo→processo)`,
  usando a mesma matriz da priorização (`objective_process_weight`, pesos
  1–3). Exibido normalizado 0–100 (100 = maior pontuação da sala). Sem dor
  (não há termômetro no workshop). Desempate: nº de objetivos votados ligados,
  depois código do processo.
- **RN-3 Nível do participante (passo 7):** a mesma regra do produto — nível N
  quando **todos os essenciais dos níveis ≤ N** estão marcados; mínimo 1.
  Complementares contam como progresso, não travam. A função de cálculo é
  **a mesma** do `maturity-service` (extraída para função pura), para o
  workshop nunca divergir do produto.
- **RN-4 Conteúdo:** só o catálogo **global publicado** (CPC). Nada
  personalizado de centro aparece numa sala.
- **RN-5 Apelido:** 2–20 caracteres, único na sala (sem diferenciar
  maiúsculas). O apresentador pode remover um participante (apelido impróprio).
- **RN-6 Ritmo:** só o apresentador avança os passos; o celular sempre mostra
  o passo atual da sala (reconectar = voltar ao ponto certo, sem perder o que
  já respondeu).
- **RN-7 Dados mínimos (LGPD):** nenhum dado pessoal é pedido — só apelido. O
  celular mostra aviso curto: "use um apelido, não seu nome completo; não
  informe nada que identifique seu centro ou participantes de pesquisa". As
  respostas são anônimas e não ficam ligadas a nenhum centro cadastrado.

## Requisitos não funcionais

- **RNF-1 Tempo real:** voto/entrada aparece no telão em **< 1 s** na rede do
  evento (meta: ~300 ms do servidor).
- **RNF-2 Escala:** sala com até **300 participantes** simultâneos (a
  confirmar com o público esperado), validada por teste de carga antes do
  evento.
- **RNF-3 Celular primeiro:** a tela do participante funciona em qualquer
  navegador de celular, sem instalar app, com 3G/4G instável.
- **RNF-4 Telão:** tela do apresentador legível a distância (fontes grandes,
  alto contraste, sem rolagem nos passos de resultado), seguindo o DS v2.

## Critérios de aceite (→ testes)

- CA-1: criar sala (staff) gera código único e QR; não staff → 403.
- CA-2: entrar com apelido válido → token de participante; apelido repetido
  na sala → 409; sala encerrada → 410.
- CA-3: participante não vota mais de 3 objetivos (400); revotar substitui;
  votar depois do encerramento do passo 2 → 409.
- CA-4: ranking de processos segue RN-2 (teste com matriz e votos conhecidos,
  incluindo empate).
- CA-5: nível do participante segue RN-3 e bate com o cálculo do produto para
  os mesmos artefatos (mesma função).
- CA-6: distribuição do passo 8 conta só quem finalizou o processo atual.
- CA-7: isolamento entre salas — token de uma sala não lê nem grava em outra;
  eventos de uma sala nunca chegam a outra.
- CA-8: teste de carga com 300 clientes simulados: p95 do voto até o evento no
  telão < 1 s.

## Fora de escopo (desta versão)

Catálogo ORPC, ranking/pontuação competitiva entre participantes, exportação
nominal, integração com o cadastro de centros, perguntas abertas, idiomas.

## Decisões em aberto

1. **Passos 3 e 4:** proposta = passo 3 mostra o ranking dos **objetivos** e o
   passo 4 o ranking dos **processos**. Confirmar.
2. **Ordem das 3 escolhas:** proposta = sem ordem (cada voto vale 1). Opção:
   1ª escolha vale mais.
3. **Quem cria salas:** proposta = só usuários staff do TrialScale.
4. **Artefatos condicionais** (ex.: só se o centro faz fase I): proposta =
   mostrar com o rótulo "se aplicável" e o participante pode marcar "não se
   aplica", que conta como atendido para o cálculo.
5. **Guarda dos dados:** proposta = sala e respostas anônimas guardadas para
   relatório pós-evento (CSV agregado) e apagadas após prazo a definir.
6. **Data do primeiro workshop e público esperado** (dimensiona RNF-2 e o
   cronograma).
