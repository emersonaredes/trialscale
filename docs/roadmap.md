# TrialScale — Roadmap de Desenvolvimento
## Fluxo SDD para desenvolvedor solo + agente Claude

*Versão 1. Complementa o Plano de Implementação (que define O QUE construir, nas Etapas 0–6). Este documento define COMO trabalhar: ordem, fluxo de especificação, stack e testes. Contexto: desenvolvedor com experiência geral mas novo na stack Node/React, usando VS Code + Claude Code, MySQL disponível.*

---

## 1. O princípio central: fatias verticais, não camadas horizontais

**Errado (para este contexto):** todo o banco → toda a API → todo o frontend → testes no final. Semanas sem nada funcionando, integração explode no fim, aprendizado da stack não acontece.

**Certo:** especificação → fundação fina → depois cada módulo como uma **fatia vertical completa** (spec → migração → API → tela → testes), demonstrável ao fim. Vantagens para solo + agente: erros de integração aparecem cedo e pequenos; você aprende a stack inteira desde a primeira fatia; sempre há algo para mostrar; e o agente trabalha melhor com features completas e delimitadas do que com camadas abstratas gigantes.

**Testes não são fase — são parte de cada fatia**, com duas suítes especiais permanentes (seção 6).

---

## 2. Ordem geral

| # | Passo | Resultado |
|---|-------|-----------|
| 0 | Preparar repositório + agente (SDD) | CLAUDE.md, constituição, docs no repo, primeira spec |
| 1 | Especificar o modelo de dados | ERD do núcleo aprovado antes de qualquer código |
| 2 | Fundação técnica (Etapa 0 do plano) | Auth, multi-tenant, harness de testes, staging no ar |
| 3 | Design system mínimo | Biblioteca pronta + tokens + componentes base (~1 dia) |
| 4 | Fatia 1: Motor + CMS (Etapa 1) | Conteúdo dos 5 processos do MVP cadastrável e nível calculando |
| 5 | Fatia 2: Jornada gratuita (Etapa 2) | Cadastro → objetivos → termômetro → fotografia |
| 6 | Fatias 3+: Jornada paga, gamificação, relatório, comercial | Conforme Etapas 3–5 do plano |
| 7 | Beta (Etapa 6) | Centros piloto reais |

---

## 3. Passo 0 — Preparar o repositório e o agente (SDD)

A vantagem que você tem: os documentos já produzidos (concepção, plano, 3 arquivos de conteúdo) **são ~80% da especificação**. O trabalho é estruturá-los para o agente consumir.

Estrutura sugerida do repositório:

```
trialscale/
├── CLAUDE.md                  # memória do projeto para o agente (rascunho no Apêndice A)
├── docs/
│   ├── constitution.md        # princípios inegociáveis (rascunho no Apêndice B)
│   ├── concepcao.md           # documento de concepção v2
│   ├── plano-implementacao.md
│   └── conteudo/              # os 3 arquivos de conteúdo dos 28 processos
├── specs/
│   └── 001-fundacao/          # uma pasta por feature
│       ├── spec.md            # O QUÊ: comportamento + critérios de aceite
│       ├── plan.md            # COMO: decisões técnicas da feature
│       └── tasks.md           # tarefas pequenas e sequenciais (PT-XXXX)
├── apps/ ou src/              # conforme a estrutura escolhida (seção 5)
└── ...
```

**Fluxo SDD por feature (repita para cada fatia):**

1. **spec.md** — você escreve (ou pede ao agente para rascunhar a partir dos docs e revisa): comportamento esperado, regras de negócio, critérios de aceite verificáveis. Sem código.
2. **plan.md** — decisões técnicas da feature: tabelas afetadas, endpoints, telas, riscos. Revise antes de seguir.
3. **tasks.md** — quebra em tarefas de 1–3 horas cada. Tarefa grande = spec ruim; volte e quebre.
4. **Implementação** — o agente executa tarefa a tarefa, em branch. Você revisa o diff de cada uma (não acumule).
5. **Fechamento** — critérios de aceite conferidos, testes passando, merge.

Ferramentas: dá para fazer SDD "na mão" com essa estrutura de pastas (recomendado para começar — você entende o fluxo antes de automatizá-lo). Existem ferramentas que automatizam esse fluxo com o Claude Code (ex.: o Spec Kit, do GitHub); avalie depois que o fluxo manual estiver confortável. Para configuração do Claude Code em si, use a documentação oficial: https://docs.claude.com/en/docs/claude-code/overview

**Regra de ouro trabalhando com o agente sendo novo na stack:** peça explicação junto com o código ("implemente e me explique as decisões"). Você está construindo o produto E aprendendo a stack — o agente serve para os dois. Nunca aprove um diff que você não entendeu: se não entendeu, pergunte antes de aprovar. É a sua versão solo da "revisão humana com autoridade final".

---

## 4. Passo 1 — Especificar o modelo de dados primeiro

O motor de processos (módulo 4) é lido por quase tudo. Errar o schema dele = migrações dolorosas depois. Antes de qualquer código:

- Escreva `specs/000-modelo-de-dados/spec.md` com o ERD do núcleo: `tenant`, `user`, `role`, `process`, `level`, `artifact` (tipo, selo de origem, essencial/complementar, DoD, condicionalidade por perfil), `artifact_template` (arquivos anexados pela equipe), `assessment` (marcação de estados por centro), `pain_score`, `objective`, `round`, dependências entre processos, artefatos compartilhados, `content_version` (rascunho/publicado).
- Casos que o schema PRECISA suportar (dos aprendizados de conteúdo): artefato compartilhado entre processos com processo-dono; artefato condicional ao perfil (ex.: compras públicas); processo personalizado por tenant (fora do benchmark); versionamento de conteúdo publicado sobre avaliações existentes; N/A com justificativa; meta de nível por processo.
- Peça ao agente para gerar o diagrama e criticar o modelo contra esses casos antes de aprovar.

---

## 5. Stack — recomendação e alternativas

Você já tem Node + React + MySQL configurados. Duas rotas válidas; escolha uma e registre no CLAUDE.md:

**Rota A — manter frontend e backend separados (mais próxima do que você montou e do padrão da organização):**
- Backend: Node + Express, ORM **Prisma** (migrações e tipos excelentes com agente; alternativa: Sequelize, que sua organização já domina — vantagem de familiaridade, custo de DX inferior)
- Frontend: React + Vite, roteamento com React Router
- Auth: JWT com refresh token (ou Auth.js/Lucia se preferir pronto)

**Rota B — consolidar em um framework full-stack (menos "cola", ótimo para solo):**
- **Next.js** (React) com API routes/server actions + Prisma + MySQL — um repositório, um deploy, enorme base de exemplos que o agente conhece bem

Comum às duas: **Tailwind CSS + shadcn/ui** como base do design system (componentes prontos, acessíveis, que o agente manipula muito bem); **TypeScript em tudo** (inegociável — os tipos são a melhor rede de segurança para quem está aprendendo a stack e para o agente); validação com **Zod** nas fronteiras da API.

Sugestão honesta: se o que você já configurou funciona, siga a Rota A e não perca tempo re-decidindo. A arquitetura de fatias funciona igual nas duas.

Infra desde cedo: staging em serviço gerenciado (Railway, Render ou similar) com MySQL gerenciado + deploy automático da branch principal. Configure na Fundação, não no fim.

---

## 6. Estratégia de testes (transversal, não fase)

- **Por fatia:** testes de unidade nas regras de negócio + teste de integração dos endpoints da fatia. O agente escreve junto com o código; a spec define os casos (critérios de aceite viram testes).
- **Suíte permanente 1 — isolamento multi-tenant:** testes que provam que o tenant A nunca lê/escreve dados do tenant B, rodando em todo CI. Trate falha aqui como bloqueio absoluto de merge.
- **Suíte permanente 2 — bordas do motor de cálculo:** N/A, artefatos compartilhados, condicionais por perfil, processo personalizado, mudança de conteúdo publicado sobre avaliação existente, essencial × complementar. Escreva os casos ANTES de implementar o motor (TDD aqui vale a pena).
- **E2E leve, depois:** quando a jornada gratuita existir, um teste Playwright da jornada crítica (cadastro → termômetro → fotografia). Não antes.
- Framework: Vitest (ou Jest — padrão da organização) para unidade/integração; Playwright para E2E.

---

## 7. Design system mínimo (Passo 3, ~1 dia)

Não construa design system antes do produto. Faça apenas:
1. Escolha a base (Tailwind + shadcn/ui recomendado).
2. Defina tokens: paleta (uma cor primária TrialScale + neutros + semânticas de nível 1–5 e de estado do kanban), tipografia, espaçamento.
3. Gere 6–8 componentes base: botão, input, select, card, badge (para selos de origem e níveis!), modal, tabela, toast.
4. Registre os tokens no CLAUDE.md para o agente usar sempre os mesmos.
O resto nasce por demanda, tela a tela. Quando chegar às telas da jornada, uma passada de refinamento visual dedicada vale mais que antecipação.

---

## 8. As três primeiras fatias em detalhe

**Fatia 0 — Fundação (Etapa 0 do plano):** estrutura do repo conforme seção 3; auth (cadastro/login/recuperação); modelo `tenant` + mecanismo de escopo (middleware/camada que injeta tenant em toda query — especifique como regra de constituição); papéis; seeds; suíte de isolamento; CI (lint + testes); staging no ar. *Critério de pronto: dois tenants de teste coexistem sem vazamento, deploy automático funcionando.*

**Fatia 1 — Motor + CMS (Etapa 1):** schema do núcleo (Passo 1 já especificado); CRUD de conteúdo no backoffice; upload de templates; versionamento rascunho/publicado; motor de cálculo com a suíte de bordas; **seed real: carregar os 5 processos do MVP a partir dos documentos de conteúdo**. *Critério de pronto: o piloto 2.5 cadastrado via CMS calcula nível corretamente (marco da Etapa 1 do plano).*

**Fatia 2 — Jornada gratuita (Etapa 2):** cadastro do centro + consentimento; objetivos com ordenação; termômetro (salvar/retomar); fotografia visual. *Critério de pronto: um centro real completa a jornada gratuita sem ajuda (marco da Etapa 2).*

Depois: seguir as Etapas 3–6 do plano, uma fatia por módulo.

---

## 9. Riscos específicos deste contexto

- **Aprovar código sem entender** — mitigação: regra "explique junto"; diffs pequenos; nunca acumular revisões.
- **Migrações destrutivas geradas pelo agente** — mitigação: migração é sempre revisada linha a linha; backup antes de aplicar em staging; nunca aplicar direto em produção (princípio da constituição).
- **Escopo de tenant esquecido em uma query nova** — mitigação: mecanismo central (não escopo manual por query) + suíte de isolamento.
- **Re-decidir stack no meio** — mitigação: decisões registradas no CLAUDE.md com data; mudar só com motivo escrito.
- **Fatia que vira monolito** — se uma spec passa de ~10 tarefas, quebre em duas fatias.
