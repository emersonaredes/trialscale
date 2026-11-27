# Plan 006 — Workshop ao vivo (decisões técnicas)

Implementado em 2026-11-27 (evento no dia seguinte: sem rodada de revisão dos
agentes arquitetos — os pontos **[revisar]** ficaram decididos como descrito e
podem ser reavaliados depois do evento).

## 1. Tempo real: Server-Sent Events (SSE), sem dependência nova

- **Celular → servidor:** HTTP comum (`POST` de entrada, voto, avaliação).
- **Servidor → telão e celulares:** `GET .../events` com SSE
  (`text/event-stream`). Nativo do navegador (`EventSource`), reconecta
  sozinho, passa por proxies e pelo Cloud Run. Não exige socket.io nem
  WebSocket — coerente com a constituição §7 (simplicidade).
- **Hub em memória** (`workshop-hub`): mapa `sala → conexões`. Cada ação grava
  no banco e publica um evento. Para não afogar o telão com 300 votos
  seguidos, o agregado da sala é recalculado e enviado no máximo **a cada
  200 ms** (coalescência); mudança de passo é enviada na hora.
- **Estado recuperável:** o banco é a fonte da verdade. Ao (re)conectar, o
  cliente recebe primeiro um `snapshot` completo do passo atual e depois os
  incrementos — queda de rede ou reinício do servidor não perdem respostas.
- **Restrição:** hub em memória exige **uma única instância** do servidor.
  Para até algumas centenas de conexões isso basta (validar no teste de
  carga, CA-8). Escalar além disso exigiria um barramento externo (ex.: Redis
  pub/sub) — fora de escopo.

## 2. Modelo de dados (migração nova + schema.sql) [revisar]

| Tabela | Campos principais |
|---|---|
| `workshop_room` | id, `code` (6 caracteres, único, sem ambíguos), name, `status` (`aberta`/`encerrada`), `current_step` (1–8), `current_process_id` NULL, `max_objectives` (3), created_by_user_id, created_at, closed_at |
| `workshop_participant` | id, room_id, nickname, `token_hash` (SHA-256), joined_at, removed_at NULL; único (room_id, nickname normalizado) |
| `workshop_objective_vote` | room_id, participant_id, objective_id; único (participant_id, objective_id) |
| `workshop_assessment` | room_id, participant_id, process_id, `artifact_ids` (JSON), `not_applicable_ids` (JSON), `level` (1–5), finished_at; único (participant_id, process_id) |

- **Zona à parte (como ficou):** as 4 tabelas `workshop_*` não têm
  `tenant_id` nem FK para `tenant`. Models registrados como `'global'` (sem
  hooks de tenant); o escopo é **por sala**, aplicado num único lugar — o
  `workshop-repository`, cujos métodos exigem `roomId` vindo do token do
  participante ou da rota de staff (nunca do body). **[revisar]** se vale
  criar uma categoria `'workshop'` mecanizada no ADR 001.
- **Leitura do catálogo sem tenant:** as rotas do celular rodam num contexto
  sem tenant e com `orgType: 'cpc'`; os hooks existentes das zonas
  `catalog`/`org-lookup` já limitam a leitura ao catálogo global de CPC.
- **Votos sem deadlock:** `replaceVotes` mexe só na diferença (apaga por PK,
  insere o que falta). "Apagar tudo e reinserir" em transação gerava deadlock
  de gap lock com a plateia votando junto (achado no teste de carga).

## 3. API

Apresentador (`authenticate` + `requireStaff`), prefixo `/api/workshops`:

- `POST /` cria sala · `GET /` lista · `GET /:id` estado completo
- `POST /:id/step` avança/volta passo · `POST /:id/process` define processo
  (passo 5) · `DELETE /:id/participants/:pid` remove participante
- `GET /:id/events` SSE do telão · `POST /:id/close` encerra
- `GET /:id/processes/:processId` detalhe do processo para o telão
- (pendente) exportação CSV pós-evento

Participante (sem login; token próprio da sala em `Authorization: Bearer`
guardado no `localStorage`), prefixo `/api/w/:code`:

- `POST /join` (sem corpo) → identificador sorteado + token (rate limit por IP)
- `GET /state` snapshot · `GET /events` SSE do celular · `GET /objectives`
- `PUT /votes` {objectiveIds ≤ 3}
- `GET /process` artefatos do processo atual por nível
- `PUT /assessment` {artifactIds, notApplicableIds} → {level, faltam}

Validação Zod em todas as fronteiras; erros no padrão já existente.

## 4. Reuso do que já existe

- **Cálculo de nível:** extrair do `maturity-service` uma função pura
  `computeLevel(artifacts)` usada pelo produto e pelo workshop (CA-5).
- **Ranking de processos:** reaproveitar `priorityLookupRepository.listWeights()`
  (mesma matriz editável no CMS, `CmsPesosPage`).
- **Detalhe do processo no telão:** reaproveitar os componentes de conteúdo de
  `ProcessoDetailPage` (objetivo, artefatos por nível, guia), sem o estado de
  um centro.
- **Objetivos:** `objectiveRepository.listAll()` com tema; o celular mostra o
  nome curto agrupado por tema.

## 5. Front-end (apps/web)

- `features/workshop/admin/*` — lista de salas, criação, **modo telão**
  (tela cheia, fontes grandes, um passo por tela, barra de controle
  discreta: Próximo / Voltar / Encerrar).
- `features/workshop/play/*` — rota pública `/w/:code` mobile-first, sem
  layout do app: apelido → objetivos → aguarde → avaliação → resultado.
- QR code gerado no navegador (lib `qrcode`, pequena, sem serviço externo).
- Gráficos de barras em CSS puro (sem biblioteca de gráficos).
- DS v2: verde só para "finalizou"/conquista; gradiente âmbar→coral na
  revelação do nível (passo 7) e da distribuição (passo 8).

## 6. Hospedagem no evento

**Recomendado: GCP Cloud Run + Cloud SQL (MySQL)**, que também resolve o
staging do TrialScale (o Dockerfile same-origin já existe).

- Cloud Run com **1 instância mínima e máxima** (sem cold start, hub em memória
  consistente), timeout de requisição no máximo permitido para as conexões SSE
  (o `EventSource` reconecta quando a conexão é encerrada).
- Cloud SQL na mesma região; schema aplicado com `db:apply` + seeds de
  conteúdo.
- Custos: dependem do tamanho da instância e de quanto tempo ficam ligados —
  estimar no console do GCP antes de provisionar. Dá para ligar só na semana
  do evento.
- **Credenciais:** não envie senhas ou chaves no chat. O caminho seguro é
  criar uma conta de serviço com permissões mínimas e guardá-la como segredo
  do ambiente da sessão (ou rodar o deploy você mesmo com o roteiro que eu
  preparar). O deploy em si é ação sua (constituição §3).

**Por que não o notebook como servidor principal:** os celulares precisam
alcançar o servidor. Em Wi-Fi de congresso é comum o isolamento entre
aparelhos, e quem estiver no 4G não enxerga um servidor na rede local. O
notebook fica como **plano B** (roteador próprio levado ao evento, ou túnel
para a internet), com o mesmo build.

## 7. Fatias de entrega

| Fatia | Entrega | Pronto quando |
|---|---|---|
| **W1 — Sala e entrada** | tabelas, criar sala, QR, entrar com apelido, hub SSE, telão mostrando apelidos ao vivo, remover participante | CA-1, CA-2, CA-7 |
| **W2 — Objetivos e prioridades** | passos 2–4, ranking ao vivo, detalhe do processo no telão | CA-3, CA-4 |
| **W3 — Autoavaliação** | passos 5–8, `computeLevel` compartilhado, resultado individual e distribuição, repetir com outro processo | CA-5, CA-6 |
| **W4 — Ensaio e evento** | teste de carga (300 clientes simulados), modo telão polido, export CSV, deploy GCP, ensaio geral com celulares reais | CA-8 + ensaio sem falhas |

Cada fatia sobe direto na `main` após sua aprovação (regra do projeto),
com lint, typecheck e testes passando.

## 8. Riscos

- **Rede do evento** — mitigado com hospedagem em nuvem (4G funciona) e
  plano B local.
- **Instância única** — limite de escala consciente; teste de carga define o
  teto real.
- **Apelidos impróprios no telão** — remoção pelo apresentador (RN-5).
- **Matriz objetivo→processo em rascunho [D]** — o ranking do passo 4 herda a
  curadoria atual; vale revisar os pesos antes do primeiro evento.

## 9. Resultado dos testes (2026-11-27, ambiente local)

- Suíte: 91 testes passando (13 novos do workshop: fluxo completo, isolamento
  entre salas, catálogo só CPC, cálculos puros).
- Fluxo real em navegador (telão + celular emulado) com 200 celulares
  simulados (`scripts/workshop-simulacao.mjs`): voto → telão em ~190 ms;
  troca de passo → celular em ~60 ms.
- Estresse: 400 celulares, 3 rodadas de 400 votos em janelas de 1 s e 400
  autoavaliações em 1 s: zero erros; p95 das chamadas < 50 ms.
- **Não medido:** rede real do evento e latência do Cloud Run/Cloud SQL —
  repetir o simulador contra a URL publicada (ver docs/deploy-gcp-workshop.md).
