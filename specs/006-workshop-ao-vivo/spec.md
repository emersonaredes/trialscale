# Spec 006 — Workshop ao vivo (modo sala, estilo quiz)

> Pedido do dono do projeto (2026-11-27): módulo para rodar uma **simulação ao
> vivo** do TrialScale em workshops e congressos. O apresentador projeta a
> tela do administrador; a plateia participa pelo celular. Inspiração: quizzes
> ao vivo com QR code e resultados instantâneos no telão.
> Status: **IMPLEMENTADO** (2026-11-27) — decisões do dono do projeto no fim
> deste arquivo. A sala é um conceito À PARTE de centro: módulo de
> demonstração, sem misturar dados com as respostas reais dos centros.

## Atores

- **Apresentador (admin da sala):** usuário staff do TrialScale, logado. Cria
  uma sala por evento (ex.: "Workshop Congresso Norte Nordeste"), conduz os
  passos e projeta a própria tela.
- **Participante:** qualquer pessoa da plateia, **sem conta**. Entra pelo QR
  code e responde pelo celular. **Não digita nada**: o sistema sorteia um
  identificador (ex.: "Tucano 42").

## Fluxo (passos da sala)

| Passo | Tela do apresentador (telão) | Celular do participante |
|---|---|---|
| 1. Entrada | QR code grande + código da sala + lista de apelidos entrando ao vivo e contador | Lê o QR → recebe o identificador sorteado → "Aguarde o apresentador" |
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
- **RN-5 Identificador:** sorteado pelo sistema (bicho + número), único na
  sala; o token fica guardado no aparelho (recarregar a página não cria outro
  participante). O apresentador pode remover um participante clicando no nome.
- **RN-6 Ritmo:** só o apresentador avança os passos; o celular sempre mostra
  o passo atual da sala (reconectar = voltar ao ponto certo, sem perder o que
  já respondeu).
- **RN-7 Dados mínimos (LGPD):** nenhum dado pessoal é pedido nem digitado. O
  celular mostra aviso curto de demonstração/autodeclaração. As respostas são
  anônimas e não ficam ligadas a nenhum centro cadastrado.
- **RN-8 Condicionais:** artefato condicional aparece com "Não se aplica ao
  meu centro"; marcado assim, conta como atendido no cálculo do nível.

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
- CA-2: entrar (sem enviar nada) → identificador sorteado único + token de
  participante; sala inexistente → 404; sala encerrada → 409.
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

## Decisões do dono do projeto (2026-11-27)

1. Passo 3 = ranking dos **objetivos** respondidos; passo 4 = ranking dos
   **processos**, calculado só pela matriz (ninguém escolhe processo).
2. As 3 escolhas **não têm ordem** (cada voto vale 1).
3. **Só staff** cria sala.
4. Artefatos condicionais: "não se aplica" conta como atendido (RN-8).
5. Os dados ficam guardados; sem política de prazo por enquanto.
6. Ninguém digita apelido: identificador sorteado (RN-5).
7. Sala é conceito à parte de centro; nada se mistura com dados reais.
8. Primeiro evento: 200 pessoas. Ainda fora desta versão: exportação CSV.
