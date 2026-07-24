# TrialScale — Plano de Implementação
## Lista de tarefas orientada ao desenvolvimento

*Versão 1. Complementa o Documento de Concepção (v2), que registra as decisões de produto. Este plano organiza módulos, sequência de construção e frentes de trabalho. Estimativas de esforço e alocação de equipe serão adicionadas quando o time for definido.*

---

## 1. Decisões técnicas de fundação

- **Banco de dados único multi-tenant** — isolamento lógico por `tenant_id` em todas as tabelas de dados de centro; sem clonagem de base por cliente. Racional: o freemium em escala inviabiliza clonagem operacionalmente, e o benchmark exige agregação entre centros. Implicações obrigatórias: escopo por tenant em toda query (idealmente via camada/middleware que impeça esquecimento), índices compostos com `tenant_id`, e **testes automatizados de vazamento entre tenants** como suíte permanente.
- **Anexos assimétricos** — usuários não anexam arquivos. A equipe TrialScale anexa **templates para download** aos artefatos (ex.: modelo Word de POP) via CMS. Storage de arquivos existe apenas para conteúdo próprio da plataforma — sem custódia de documentos de centros nesta versão.
- **Módulos adiados** — KPIs do centro (12) e Universidade corporativa + autoauditoria (13) fora do escopo atual. A Fase 3 do produto fica representada, por ora, pela reavaliação de maturidade (nativa do motor de processos).
- **Planos do MVP** — dois planos de exemplo: Autosserviço (R$ 3.870,00/mês) e Acompanhamento Premium (R$ 7.500,00/mês). Idênticos em software; o Premium agrega serviço de consultoria entregue **fora da plataforma**. Nenhuma funcionalidade de consultor no sistema.
- **Convenções de desenvolvimento** — fluxo padrão da organização: branch de tarefa → PR → revisão humana → merge; toda lógica com testes (Jest), casos de borda obrigatórios no motor de cálculo de nível e em qualquer lógica financeira; queries sempre parametrizadas.

---

## 2. Módulos do sistema (escopo atual)

**Núcleo da jornada (MVP)**

1. Conta e perfil do centro (cadastro, consentimento LGPD, usuários e papéis)
2. Objetivos estratégicos (menu por temas, ordenação de prioridade)
3. Termômetro de dor (questionário 28 processos, fotografia visual)
4. Motor de processos e artefatos (modelo central: processos → níveis → artefatos; estados; cálculo de nível)
5. Priorização e rodadas (score dor × estratégia × dependências; rodadas de 3–4 processos)
6. Trilhas e kanban (execução da rodada, textos instrutivos, templates para download)
7. Painel de evolução (níveis, progresso, pendências, histórico)
8. Gamificação (selos, medalhas, desafio opcional de N semanas)
9. Relatório exportável (PDF de maturidade autodeclarada)

**Crescimento e rede**

10. Benchmark anônimo (agregações com mínimo por recorte)
11. Planos e monetização (gating freemium, assinatura dos dois planos)

**Adiados**: 12. KPIs do centro · 13. Universidade corporativa + autoauditoria

**Backoffice e transversais**

14. CMS de conteúdo (backoffice de processos, artefatos, DoD, textos, templates, versionamento e publicação)
15. Notificações e reengajamento
16. Segurança, LGPD e auditoria de eventos
17. Telemetria de produto

---

## 3. Sequência de construção

A ordem respeita as dependências: o motor de conteúdo (4) e o CMS (14) vêm primeiro porque quase tudo lê deles — e porque destravam a frente paralela de conteúdo (seção 4).

### Etapa 0 — Fundações

- Setup de repositório, ambientes (dev/staging/prod) e CI/CD
- Base multi-tenant: modelagem de `tenant`, mecanismo de escopo obrigatório por tenant, seeds de desenvolvimento
- Suíte de testes de isolamento entre tenants (permanente no CI)
- Autenticação (cadastro, login, recuperação de senha)
- Papéis e permissões: administrador do centro, coordenador, membro + papel interno de backoffice (equipe TrialScale)
- Fundamentos LGPD: registro de consentimento versionado; log de auditoria de eventos sensíveis
- Telemetria de produto: instrumentação básica de eventos

### Etapa 1 — Motor de conteúdo (módulos 4 + 14)

- Modelagem de dados central: processo, nível, artefato (tipo, selo de origem, essencial/complementar, definição de pronto), dependências entre processos, artefatos compartilhados
- CMS backoffice: CRUD de processos, níveis, artefatos e textos instrutivos
- Upload e gestão de templates por artefato (Word e outros formatos), com storage próprio
- Versionamento e publicação de conteúdo (rascunho → publicado; centros só veem conteúdo publicado)
- Motor de cálculo de nível: por processo (essenciais completos = nível atingido) e nível geral consolidado — **testes de borda obrigatórios** (N/A, processos personalizados, artefatos compartilhados, mudança de conteúdo publicado sobre avaliação existente)
- Processos personalizados por centro (mesma mecânica, fora do benchmark)

*Marco: conteúdo do processo-piloto (produto sob investigação) cadastrado via CMS e nível calculado corretamente em ambiente de teste.*

### Etapa 2 — Jornada gratuita (módulos 1, 2, 3)

- Cadastro e perfil do centro: campos médios (localização, tamanho, especialidades, natureza, volume em faixas), consentimento LGPD no fluxo
- Convite de usuários e atribuição de papéis
- Objetivos estratégicos: menu agrupado por temas + ordenação de prioridade relativa
- Termômetro: questionário dos processos publicados com nota 1–5, descrição de uma linha por processo, salvar e retomar, orientação de workshop coletivo no fluxo
- Fotografia: tela de resultado visual do termômetro (a entrega de valor do gratuito)

*Marco: um centro real consegue se cadastrar e sair com sua fotografia de dor.*

### Etapa 3 — Jornada paga núcleo (módulos 5, 6, 7 + consumo do 4)

- Gating de plano (grátis × pago) por feature flag desde o início da etapa
- Raio-X: marcação de artefatos com três estados (não iniciado / em elaboração / completo) e data limite esperada; "não se aplica" com justificativa
- Exibição de níveis por processo e geral; destaque do "risco silencioso" (dor baixa × maturidade baixa)
- Priorização: score combinando dor, relevância estratégica e dependências (sinalização de ordem, sem travar)
- Rodadas: sugestão de composição (3–4 processos), ajuste pelo centro, ciclo de vida (aberta → concluída → celebração → próxima)
- Trilhas e kanban: artefatos como tarefas, textos instrutivos, download de templates
- Painel de evolução do centro

*Marco: um centro percorre uma rodada completa de ponta a ponta em ambiente de teste.*

### Etapa 4 — Recompensa e relatório (módulos 8, 9)

- Catálogo de selos e medalhas + regras de conquista (subida de nível, marcos de camada, conclusão de rodada)
- Desafio opcional de tempo ("N semanas") acoplado à rodada
- Relatório de maturidade em PDF: níveis, evolução, marcação explícita de autodeclaração e ressalva regulatória (nome do relatório pendente — ver concepção)

### Etapa 5 — Comercial e retenção (módulos 11, 15)

- Assinatura dos dois planos: integração com gateway de pagamento, gestão de plano do centro, upgrade/downgrade
- Notificações transacionais (convites, datas limite, conclusões)
- Régua de reengajamento (centro inativo, rodada parada, próximo passo sugerido)

### Etapa 6 — Beta e benchmark (módulo 10)

- Beta fechado com 3–5 centros piloto reais; ciclo de feedback estruturado
- Benchmark de dor (dados da camada gratuita), com regra de mínimo de centros por recorte (nunca exibir segmento com menos de ~5)
- Benchmark de maturidade: adiado até haver massa de dados de centros pagantes (registrado na concepção)

---

## 4. Frente paralela de conteúdo

Independe de código a partir do fim da Etapa 1 (quando o CMS existir) e é o **caminho crítico real** do projeto — o software fica pronto antes do conteúdo se esta frente não começar cedo.

- **Primeira leva de processos definida**: 2.5 Gerenciar produto sob investigação (piloto) + 1.1 Prospectar estudos + 6 Conduzir compras + 7 Gerenciar equipe + 8 Gerenciar infraestrutura — 5 processos, detalhados em `conteudo_processos_mvp.md` (proposta pendente de curadoria)
- Detalhar cada processo no molde do piloto: caracterização da tese + enriquecimento GCP + norma vigente, com selos de origem
- Curadoria essencial × complementar dos artefatos de cada nível
- Redigir a definição de pronto (DoD) de cada artefato como frase completa
- Produzir os templates esqueleto (Word) com lacunas obrigatórias de personalização
- **Validação regulatória humana** de todo conteúdo com selo "norma" antes da publicação
- Redigir textos instrutivos e descrições de uma linha (termômetro) de cada processo

---

## 5. Critério de pronto para o beta

Um centro real consegue, sem ajuda da equipe: cadastrar-se e consentir → definir objetivos → responder o termômetro → ver sua fotografia → assinar um plano → compor e executar uma rodada completa nos processos publicados → subir de nível em ao menos um processo → emitir seu relatório de maturidade.

---

## 6. Riscos de implementação

- **Vazamento entre tenants** — mitigação: escopo obrigatório em camada de infraestrutura + suíte permanente de testes de isolamento.
- **Motor de cálculo de nível** concentra as regras mais sensíveis (essencial/complementar, N/A, compartilhados, conteúdo versionado sobre avaliações existentes) — mitigação: testes de borda exaustivos e regras documentadas antes do código.
- **CMS subdimensionado** — se o backoffice nascer precário, cada ajuste de conteúdo vira tarefa de desenvolvedor e a estratégia evolutiva morre; tratar o CMS como produto interno de primeira classe.
- **Conteúdo como caminho crítico** — a frente da seção 4 precisa de dono e ritmo próprios, ou o beta atrasa com o software pronto.
- **Mudança de conteúdo sobre avaliações existentes** — publicar nova versão de um processo afeta centros já avaliados; a regra de transição (recalcular? congelar? notificar?) precisa ser definida antes da Etapa 1 terminar.

---

*Fim da versão 1 do plano de implementação.*
