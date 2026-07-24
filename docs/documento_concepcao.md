# Framework de Gestão de Maturidade de Centros de Pesquisa Clínica
## Documento de Concepção

*Versão 2 — registro das decisões de concepção, incorporando as definições da revisão crítica de usabilidade. Este documento consolida o que foi definido nas conversas de design e serve de referência para a fase de construção. Não é especificação técnica nem material regulatório validado.*

---

## 1. Visão geral

**Nome comercial escolhido: TrialScale** — "trial" abarca o ecossistema inteiro (centros/sites, CROs, cursos), permitindo extensões futuras da marca; "scale" carrega o duplo sentido central do produto: a *escala* de níveis 1–5 e *escalar* a operação. *Ressalvas registradas: busca rápida na web não encontrou colisões diretas, mas o prefixo "Trial-" é comum no setor (TrialMatch, TrialDocs, TrialKit, Trialize) e a verificação formal no INPI + estratégia de domínio permanecem pendentes antes de uso público. Histórico: "SiteUp" foi a primeira escolha, descartada por colisão direta (siteup.com.br, SaaS brasileiro de CRM/vendas).*

O sistema é uma ferramenta online, de autoinstrução, que guia centros de pesquisa clínica a elevar seu nível de maturidade em gestão. O centro é conduzido por um conjunto de tarefas claras, sequenciais e interconectadas, com evolução visual e recompensas a cada nível atingido — inspirado na dinâmica do 100tasks, mas ancorado em conteúdo técnico próprio.

O sistema é uma **camada de ativação** sobre a arquitetura de 28 processos da tese de doutorado de Emerson Lima Aredes (*Framework de processos para a gestão de centros de pesquisa clínica*, USP/FEA-RP, 2020). A tese fornece o catálogo de processos e sua caracterização; o sistema transforma cada processo numa trilha de melhoria com artefatos.

O modelo conceitual integra três materiais: a tese (arquitetura de processos), o PIC (Plano de Implementação de Centros — jornada em três fases) e boas práticas complementares de GCP e regulação vigente.

### Princípio central

> O sistema é um instrumento de **autoavaliação e apoio à gestão**, não uma certificação de conformidade regulatória. A régua de maturidade organiza a melhoria de processos; não substitui as exigências de BPC/GCP, ANVISA ou CEP/CONEP. Essa distinção deve estar explícita na interface.

---

## 2. Estrutura em três fases

A jornada do centro se organiza em três fases, derivadas do PIC e reconciliadas com a tese.

### Fase 1 — Design de centro (leve)

Define quem é o centro e aonde quer chegar. Mantida leve: o coração é uma **lista de objetivos estratégicos priorizados**; ferramentas de aprofundamento (SWOT, Canvas, jornada do paciente, benchmark) são oferecidas como sugestões opcionais, não obrigatórias.

- Serve tanto a quem cria um centro do zero quanto a quem tem um centro e nunca formalizou essas definições.
- **Todos os centros começam por aqui.** Para um centro existente, deve ser rápida o bastante para não obstruir o acesso ao diagnóstico.
- A priorização dos objetivos deve capturar **prioridade relativa** (não só quais objetivos, mas quais importam mais), porque isso alimenta a ponderação da priorização de processos na Fase 2.

Objetivos possíveis, agrupados por tema. Os marcados com [PIC] vêm do próprio plano original; os demais são sugestões complementares relevantes para centros de pesquisa clínica. A lista é um menu — o centro escolhe e ordena os que fazem sentido para sua realidade.

*Volume e captação de estudos:* aumentar o número de protocolos [PIC] · aumentar recrutamento [PIC] · atrair estudos de maior complexidade ou fase mais precoce · diversificar áreas terapêuticas · atrair estudos internacionais / patrocinadores globais · reduzir a dependência de poucos patrocinadores.

*Qualidade e conformidade:* melhorar a qualidade dos processos [PIC] · diminuir desvios [PIC] · reduzir achados em monitorias, auditorias e inspeções · encurtar o tempo de resposta a queries · fortalecer a integridade e a rastreabilidade dos dados.

*Desempenho operacional:* encurtar o tempo de startup (da seleção ao primeiro participante) · melhorar a taxa de retenção de participantes · aumentar a previsibilidade de metas de inclusão · reduzir o tempo entre visita e inserção de dados no CRF · aumentar a taxa de conversão de feasibility em contrato.

*Financeiro e sustentabilidade:* aumentar o faturamento [PIC] · melhorar a previsibilidade e o fluxo de caixa · reduzir inadimplência e atrasos de pagamento do patrocinador · melhorar a precificação de procedimentos e o overhead.

*Pessoas e conhecimento:* reduzir a dependência de pessoas-chave (reter conhecimento em processos) · estruturar capacitação e educação continuada · melhorar a retenção da equipe.

*Impacto e reputação:* melhorar o serviço de saúde local [PIC] · fortalecer o relacionamento com a comunidade e a rede de referenciamento · construir reputação e ser reconhecido como referência em uma área.

*Participante:* melhorar a experiência e a segurança do participante · reduzir o tempo de espera nas visitas.

### Fase 2 — Implementação (núcleo da tese)

Onde a maturidade de processos é diagnosticada e evoluída. Contém:

- **Diagnóstico** dos 28 processos (ver seção 4).
- **Priorização** que cruza dor percebida, relevância estratégica e dependências entre processos.
- **Trilhas de melhoria** por processo, cada uma construindo os artefatos que faltam para subir de nível.

Toda a estrutura física, contratual e de sistemas (que no PIC aparecia solta) foi **absorvida como artefatos dos processos** — ver seção 3.

### Fase 3 — Acompanhamento contínuo (self-service)

Regime permanente do centro depois de implementado. Originalmente concebido no PIC como consultoria personalizada, foi redesenhado como **self-service escalável**:

- **Dashboard de KPIs** — centro registra indicadores, sistema gera gráficos e alertas.
- **Universidade corporativa** — biblioteca de treinos, cursos, certificados e atualizações (alimentada pelos artefatos de treinamento criados na Fase 2).
- **Autoauditoria guiada** — checklist anual que o centro roda sozinho, gerando relatório.
- **Reavaliação de maturidade** — refaz o diagnóstico, mostra evolução, mantém o benchmark atualizado.
- **Rotinas de gestão à vista** — modelos de reunião e lembretes.

Os **serviços humanos** (mentoria, auditoria assistida, revisão de artefatos, diagnóstico presencial) são uma oferta paralela, **fora da plataforma** nesta versão (ver seção 6).

### Camadas transversais

Três elementos acompanham o centro em todas as fases:

- **Conta e papéis** — a conta é do centro, com múltiplos usuários e papéis (administrador, coordenadores responsáveis por processos, membros). No diagnóstico desta versão, o preenchimento é feito por um único usuário, que idealmente conduz o workshop coletivo e registra o consenso da equipe (ver seção 4).
- **Biblioteca de artefatos** — todo POP, indicador, treinamento e ferramenta criado nas trilhas fica guardado e reutilizável; alimenta a universidade corporativa da Fase 3.
- **Gamificação** — selos, níveis, benchmark e relatório acompanham o centro ao longo de toda a jornada (ver seção 5).

---

## 3. Mecânica central: artefatos definem maturidade

Decisão estruturante: em vez de separar "processos" (níveis) de "habilitação" (checklist), **tudo é artefato de um processo**. Um item de estrutura como "modelo de contrato padrão" é um artefato do processo de gerenciar contratos; "controle de estoque da farmácia" é artefato do processo de gerenciar produto sob investigação.

### Consequências

- **Mecânica única**: o centro entra num processo, vê os artefatos que o caracterizam, marca o que possui, e isso posiciona a maturidade.
- **A estrutura física ganha contexto**: "ter farmácia" isolado não diz nada; "farmácia + POP + controle de estoque + treinamento, ligados ao processo" conta uma história de maturidade.
- **Conteúdo ancorado na tese**: cada processo já vem caracterizado (entradas, saídas, atividades, indicadores, recursos), então a lista de artefatos deriva diretamente dela.

### Vocabulário fixo de tipos de artefato

Paleta padrão que se repete em todos os processos (permite consistência e benchmark):

- Infraestrutura
- POP (procedimento operacional padrão)
- Ferramenta de gestão
- Indicador
- Treinamento
- Registro / evidência

### Artefatos compartilhados

Alguns artefatos servem a mais de um processo (ex.: controle de ambiente também serve a "gerenciar infraestrutura"; relatório de farmacovigilância conecta a "gerenciar eventos adversos"; um sistema como o Polo Trial pode ser evidência em vários processos). Marcar uma vez deve contar nos processos relacionados, evitando retrabalho e alimentando a biblioteca de artefatos transversal.

### Estados do artefato e visão kanban

Cada artefato tem três estados: **Não iniciado · Em elaboração · Completo**. O estado "Em elaboração" aceita uma **data limite esperada** e torna visível o trabalho em andamento — importante motivacionalmente, já que criar um POP leva dias. Apenas artefatos **Completos** contam para o nível; os demais aparecem como progresso.

Essa visão se traduz numa **tela de gestão kanban** (colunas Não iniciado / Em progresso / Completo), onde os artefatos da rodada atual funcionam como tarefas.

### Definição de pronto (Definition of Done)

Cada artefato tem uma definição de pronto redigida como frase completa, que deixa clara a real completude — ex.: não "POP de dispensação", mas "POP de dispensação **aprovado, assinado, com versão e data**, e conhecido pela equipe que o executa".

- **Nesta versão não há anexo de evidências** — o sistema aceita a marcação autodeclarada do centro. A honestidade é induzida pela clareza da definição de pronto e pela transparência do relatório (que se apresenta como autodeclarado), não por auditoria de documentos.

### Modelos esqueleto, não de prateleira

Os modelos de apoio (POPs, ferramentas) são **esqueletos com lacunas obrigatórias de personalização** ("descreva como *seu* centro executa esta etapa"), nunca textos completos prontos para assinar. Objetivo: evitar o "POP de prateleira" — documento que não reflete a prática real do centro, um dos achados mais comuns de auditoria.

- **Anexos são assimétricos**: usuários não anexam arquivos à plataforma, mas a equipe TrialScale pode anexar **templates para download** aos artefatos (ex.: modelo Word de POP), via backoffice. O centro baixa, personaliza fora da plataforma e marca o artefato como completo.

### Aplicabilidade e processos personalizados

- Processos que não se aplicam ao centro podem ser marcados **"não se aplica"**, com justificativa curta visível no relatório (a transparência inibe o uso do N/A para inflar a nota). Processos N/A saem do cálculo do nível geral.
- O centro pode **cadastrar processos próprios** que não constem na arquitetura de referência, configurando seus artefatos na mesma mecânica. Processos personalizados não entram no benchmark (são específicos do centro).

### Selo de origem dos artefatos *(decisão pendente de confirmação)*

Cada artefato pode carregar um selo indicando sua origem/natureza:

- Exigido por norma (ANVISA vigente)
- Boa prática GCP
- Recomendação / sugestão de design

Benefício: ajuda o centro a priorizar (obrigatório antes de recomendável) e protege a credibilidade da ferramenta (nunca apresenta sugestão como se fosse lei). *Status: a favor na discussão, confirmação final pendente.*

---

## 4. Modelo de maturidade e diagnóstico

### Cinco níveis por processo

| Nível | Nome | O que caracteriza |
|-------|------|-------------------|
| 1 | Inicial | Processo não mapeado, ad hoc, dependente de pessoas |
| 2 | Informal | Existe rotina conhecida, sem documento nem padrão escrito |
| 3 | Definido | POP escrito + equipe treinada; processo padronizado |
| 4 | Gerenciado | Indicadores medidos + ferramenta de gestão; decisões por dado |
| 5 | Otimizado | Revisão periódica + melhoria contínua documentada |

O nome "Inicial" (em vez de "Inexistente") foi escolhido deliberadamente: o processo existe e a equipe se esforça para executá-lo — o que falta é gestão estruturada. A palavra respeita o esforço e evita desengajar no primeiro contato.

Os níveis não são descrições abstratas: são **combinações de artefatos presentes**. A progressão respeita dependências (o físico antes do padronizado, o padronizado antes do medido, o medido antes do otimizado). Artefatos críticos para segurança do participante entram cedo (ex.: double-check de dispensação no nível 3).

### Como o centro "completa" um nível: artefatos essenciais e complementares

Cada nível tem **artefatos essenciais** (obrigatórios — os que definem o patamar, tocam a segurança do participante ou exigência de norma) e **artefatos complementares** (somam ao progresso e viram pendências visíveis, mas não travam a subida). O centro atinge o nível quando completa todos os essenciais daquele nível.

- Racional: o modelo totalmente rígido punia quem estava trabalhando (um artefato acessório faltante travava meses de esforço) e colidia com a gamificação. O modelo por essenciais preserva o significado do nível — os artefatos que importam de verdade são inegociáveis — sem transformar itens acessórios em bloqueio.
- Implicação de curadoria: cada artefato de cada nível precisa ser classificado como essencial ou complementar — trabalho a fazer no detalhamento dos processos.

### Diagnóstico em dois tempos

**Tempo 1 — Termômetro de dor (subjetivo, rápido).** No início, o centro percorre os 28 processos dando uma única nota de 1 a 5 de **dor/prioridade** ("quanto isso te incomoda?"). Cada processo traz uma descrição de uma linha em linguagem simples, e a sessão pode ser salva e retomada. Gera a primeira priorização e uma "fotografia" imediata da situação.

- **Recomendação ao usuário: responder coletivamente, num workshop com toda a equipe.** A experiência de consultoria mostra que esse momento promove uma discussão saudável e interdepartamental — e evita que o diagnóstico reflita a perspectiva de uma única função (a dor da farmácia é invisível para quem cuida de recrutamento). Nesta versão, o preenchimento no sistema é feito por um único usuário, que conduz a reunião e registra o consenso da equipe.

- Decisão: pede-se **só a nota de dor**, não a de maturidade percebida. Maturidade não é autoavaliada (evita viés tipo Dunning-Kruger); ela **emerge do checklist** de artefatos.

**Tempo 2 — Raio-X de artefatos (objetivo, detalhado).** Ao entrar na trilha de um processo escolhido, o centro marca os artefatos que possui. A maturidade real é **calculada**, não adivinhada. A precisão entra no momento em que é útil, não como barreira de entrada.

### Priorização

Ordena os processos cruzando três fatores:

1. **Dor percebida** (termômetro).
2. **Relevância estratégica** (objetivos priorizados na Fase 1).
3. **Dependências entre processos** (arquitetura da tese) — sinalizam a ordem recomendada (ex.: melhorar "agenda de visitas" antes de "conduzir visita"), sem travar a escolha do centro. As setas da arquitetura descrevem fluxo operacional, não ordem obrigatória de melhoria.

### Adoção por ciclos (rodadas)

Para dar foco e combater o abandono, a melhoria acontece em **rodadas**: depois do termômetro e dos objetivos, o centro seleciona um conjunto de **3 ou 4 processos** para melhorar na primeira rodada (o sistema sugere a composição com base na priorização; o centro ajusta). Ao concluir a subida de nível nesses processos, celebra a rodada e seleciona a próxima.

- Benefícios: esforço concentrado (em vez de 28 frentes abertas), sensação periódica de conclusão, e um ritmo natural de reengajamento.
- O desafio opcional de tempo ("N semanas") se acopla à rodada, não à jornada inteira.

### Insight de engajamento: percebido vs. real

O contraste entre a dor percebida e a maturidade real revelada pelo checklist gera momentos de insight. Destaque para o **risco silencioso**: processos de baixa dor mas baixa maturidade real — o que o centro não vê chegando (típico de achado de inspeção). O sistema vira "um par de olhos" que enxerga o que o centro não percebe.

### Níveis exibidos

- Nível **por processo** e um nível **geral consolidado** (média ponderada pela relevância estratégica).

---

## 5. Gamificação e ritmo

### Recompensas em três camadas

- **Conquistas simbólicas** — selos por processo que sobe de nível; medalhas por marcos de camada (ex.: todos os processos de suporte no nível 3+).
- **Benchmark anônimo** — comparação com centros semelhantes (ver cuidados na seção 7). Sem base suficiente, usa o próprio histórico do centro como substituto.
- **Relatório de maturidade** *(nome definitivo a escolher)* — documento emitível a cada nível geral atingido, útil internamente e para mostrar a patrocinadores. O nome deve ser atrativo, mas **não pode sugerir certificação** — o documento é um guia para o centro. Deve deixar explícito: maturidade de gestão **autodeclarada**, não conformidade regulatória.

### Navegação: guiada com liberdade

O sistema sempre **sugere** o próximo processo (com base na priorização), destacando-o como "recomendado agora", mas **não bloqueia** o centro de abrir outra trilha. As Fases 1–3 têm sequência natural mais firme; dentro da Fase 2, a navegação é livre, organizada em rodadas (ver seção 4).

### Ritmo temporal

Flexível, com **desafio opcional**. O centro pode ativar uma meta tipo "aumente sua maturidade em N semanas" (que traz lembretes e barra de ritmo); se não ativar, anda livre. O enquadramento tem apelo de marketing sem o lado punitivo de um prazo rígido.

### Relatório exportável

Recurso útil: o centro pode exportar seu próprio relatório de maturidade/diagnóstico (PDF). Serve para uso próprio, para mostrar a patrocinadores e para levar a uma mentoria — sem exigir integrar o consultor à plataforma.

---

## 6. Modelo de negócio

### Freemium

**Camada gratuita** entrega valor real e alimenta a base de dados:

- Cadastro (nível médio — ver seção 7).
- Ordenação de prioridades estratégicas.
- Termômetro de dor (diagnóstico rápido dos 28 processos) + fotografia visual da situação.

Duplo fluxo de valor: entrega ao centro (fotografia + gancho para continuar) e alimenta o produto (base de dados que sustenta o benchmark). O grátis constrói o ativo que dá valor ao pago.

**Camada paga** abre:

- Trilhas de melhoria com artefatos, POPs e ferramentas.
- Níveis de maturidade, gamificação e certificado.
- Benchmark comparativo detalhado.
- Acompanhamento contínuo (Fase 3).

Conversão natural: o centro que sentiu suas dores mapeadas quer o próximo passo ("como resolvo isso?") — que é a Fase 2 paga.

**Planos do MVP** (valores de exemplo, a validar comercialmente):

- **Autosserviço** — R$ 3.870,00/mês: plataforma completa.
- **Acompanhamento Premium** — R$ 7.500,00/mês: plataforma completa + acompanhamento por consultores. Como o serviço humano acontece fora da plataforma, os dois planos são idênticos em software; a diferença é o serviço de consultoria entregue por fora.

*Detalhe do empacotamento da camada paga (assinatura vs. avulso vs. por fase) permanece em aberto para exploração posterior.*

### Serviços humanos

Oferecidos de **duas formas**: pacotes avulsos (compra quando precisa) E plano premium recorrente (self-service + acompanhamento). Podem acoplar-se a qualquer fase, mas a Fase 3 é onde o recorrente mais faz sentido.

**Nesta versão, acontecem fora da plataforma.** Isso elimina a complexidade de papel de consultor, permissões de acesso ao painel, comentários em artefatos e agendamento. O consultor trabalha do modo tradicional; a plataforma permanece puramente self-service. A porta fica aberta para integrar o consultor no futuro.

- Trade-off aceito: o consultor não vê automaticamente o que o centro fez; o centro leva o relatório exportável à mentoria.

---

## 7. Cuidados de dados (tratados desde o desenho)

### Cadastro gratuito — nível médio

Essencial + campos analíticos em **faixas** (para reduzir atrito e risco de reidentificação):

- Localização, tamanho, especialidades (essencial).
- Natureza (público / privado / misto).
- Volume de estudos ativos **em faixas** (não número exato).
- Possíveis adicionais leves: fase dos estudos (I–IV), tempo de existência.

Evitar no cadastro de entrada: identificação de protocolos, patrocinadores ou qualquer dado de participantes (confidencial, fora de escopo).

### LGPD e consentimento

Consentimento claro no momento do cadastro: o centro precisa saber e concordar que seus dados, **de forma agregada e não identificável**, alimentarão comparações setoriais. Requisito da camada gratuita desde o primeiro cadastro — não detalhe posterior.

### Anonimato real do benchmark

O mercado de pesquisa clínica no Brasil é pequeno e concentrado, o que cria risco de **reidentificação** em recortes muito específicos. Mitigação a embutir no desenho: o benchmark só exibe comparações quando há um **número mínimo de centros** no recorte (ex.: nunca mostrar segmento com menos de 5 centros).

---

## 8. Base regulatória — alerta importante

A tese (2020) foi escrita sob a **RDC 9/2015**, que foi **revogada**. A norma vigente de ensaios clínicos com medicamentos passou a ser a **RDC 945/2024** (em vigor desde 1º de janeiro de 2025), alinhada ao Guia ICH E6(R2) e à Lei 14.874/2024 (pesquisas com seres humanos).

Implicações:

- A tese permanece válida como **arquitetura de processos de gestão** (BPM não muda com a RDC).
- Todo artefato que toca exigência regulatória precisa apontar para a **norma vigente**, não para a de 2015.
- O **conteúdo regulatório do sistema precisa ser atualizável** — reforça a Fase 3 (atualizações regulatórias) como algo estrutural.
- A RDC 945/2024 cobre ensaios com medicamentos para registro. Outros contextos têm normas próprias (dispositivos médicos; terapias avançadas na RDC 506/2021). O sistema deve permitir que cada centro veja a norma aplicável ao seu tipo de estudo.
- **Validação humana necessária**: afirmações do tipo "a norma X, artigo Y, exige Z" devem ser confirmadas na íntegra da norma por alguém com autoridade regulatória antes de virarem conteúdo publicado. O sistema estrutura e marca a origem; a validação final é humana.

---

## 9. Processo-piloto: Gerenciar produto sob investigação

Piloto que validou o método (tese + GCP + norma + design, com origens marcadas). Serve de molde para os outros 26 processos.

### Caracterização base (da tese)

Objetivo: garantir o produto sob investigação em boa forma e apresentação, e instruir o correto uso ao participante.

- **Entradas**: agenda de visitas, pedido de dispensação, estoque de produtos.
- **Atividades**: receber PI, armazenar, controlar estoque, controlar ambiente, controlar prescrições, dispensar, calcular aderência, solicitar reposição, descartar/retornar/destruir, reportar evento adverso à farmacovigilância.
- **Saídas**: PI dispensado, relatório de farmacovigilância.
- **Indicadores (da tese)**: participantes sem o PI na hora correta; tempo para reposição de estoque; aderência ao uso do PI.
- **Regra de negócio**: delegation form.
- **Recursos**: double-check de dispensação, controle de ambiente, controle de estoque.

### Escalonamento nos cinco níveis

Legenda de origem: [T] tese · [G] boa prática GCP · [A] norma ANVISA · [D] design.

*A classificação de cada artefato como essencial ou complementar dentro do nível (ver seção 4) é curadoria pendente.*

**Nível 1 — Inicial**
PI guardado de forma improvisada, sem local próprio, sem controle de temperatura nem registro de dispensação.

**Nível 2 — Informal**
- Farmácia / sala do PI com controle de acesso [T]
- Refrigeração funcionando (geladeira/freezer) [T]
- Equipe conhece a rotina, sem procedimento escrito [G]

**Nível 3 — Definido**
- POP de recebimento e armazenamento do PI [T]
- POP de dispensação com double-check [T]
- POP de descarte / retorno conforme PGRSS [A]
- Delegation log: equipe treinada e delegada [T]
- Histórico de dispensação rastreável por participante [G]

**Nível 4 — Gerenciado**
- Controle de estoque / accountability unidade a unidade [T]
- Monitoramento de temperatura com registro e alarme [G]
- POP de gestão de excursão de temperatura [G]
- Indicadores medidos: PI na hora certa, reposição, aderência [T]
- POP de quebra de cego de emergência [G]

**Nível 5 — Otimizado**
- Indicadores revisados periodicamente geram ações de melhoria [G]
- Integração com IVRS/IWRS para randomização e dispensação [T]
- Equipamentos qualificados (IQ/OQ/PQ) e mapeamento térmico [G]
- Cadeia de custódia com assinatura em cada transferência [D]

### Lições do piloto (aplicáveis aos 28 processos)

- A caracterização da tese realmente contém material para derivar artefatos — o método se sustenta.
- A progressão deve respeitar dependências físicas (não medir temperatura sem ter refrigeração).
- Artefatos críticos de segurança entram cedo, independentemente do nível gerencial.
- A trilha de melhoria se lê diretamente do escalonamento (o que falta para o próximo nível = a lista de tarefas).
- O selo de origem funciona como segundo eixo de priorização dentro da trilha (norma e segurança antes de recomendações).
- Ponto a decidir por processo: farmacovigilância aparece tanto aqui quanto em "gerenciar eventos adversos" — resolver via artefato compartilhado ou definir processo dono.

---

## 10. Arquitetura de referência: os 28 processos da tese

**Processos centrais (19)**

*Grupo 1 — Entrada de estudos:* 1.1 Prospectar estudos · 1.2 Participar de feasibility · 1.3 Aprovar novo protocolo (contrato e orçamento) · 1.4 Aprovar novo protocolo (aprovação ética) · 1.5 Alinhar procedimentos do protocolo (startup) · 1.6 Definir lista de participantes potenciais (pré-triagem)

*Grupo 2 — Condução:* 2.1 Recrutar participante · 2.2 Desenvolver agenda de visitas · 2.3 Conduzir visita · 2.4 Preencher ficha clínica (CRF) · 2.5 Gerenciar produto sob investigação · 2.6 Gerenciar materiais · 2.7 Gerenciar amostras biológicas · 2.8 Excluir participantes

*Grupo 3 — Controle da qualidade:* 3.1 Gerenciar evento adverso e evento adverso grave · 3.2 Gerenciar desvios na condução do estudo · 3.3 Manter aprovação ética e regulatória · 3.4 Gerenciar monitorias, auditorias e inspeções

*Encerramento:* 4 Encerrar protocolo (close-out, reconciliação e arquivamento)

> **Correção de catálogo (rodada de conteúdo):** o processo central "4 Encerrar Protocolo" (Quadro 29 da tese) não constava na contagem original de 27. O catálogo correto tem **28 processos** (19 centrais + 5 suporte + 4 gestão).

**Processos de suporte (5):** Gerenciar finanças · Conduzir compras · Gerenciar equipe · Gerenciar infraestrutura · Gerenciar comunicação

**Processos de gestão (4):** Gerenciar orçamento · Gerenciar planejamento estratégico · Gerenciar processos · Gerenciar portfólio de protocolos

*Nomenclatura conforme a tese, com a atualização de "produto investigacional" para "produto sob investigação".*

---

## 11. Pendências registradas

- **Empacotamento da camada paga** — dois planos definidos como exemplo para o MVP (Autosserviço R$ 3.870/mês; Premium R$ 7.500/mês); validação comercial dos valores pendente.
- **Confirmação final dos selos de origem** como recurso — inclinação favorável.
- **Validação regulatória humana** de todo conteúdo que afirme exigência normativa.
- **Definição, por processo, de artefatos compartilhados e processo-dono** (ex.: farmacovigilância).
- **Detalhamento evolutivo dos processos** no molde do piloto — recorte inicial com ênfase em processos centrais e de suporte; escopo decidido a cada iteração.
- **Classificação essencial × complementar** dos artefatos de cada nível (curadoria dos processos detalhados).
- **Nome do relatório de maturidade** — atrativo, sem sugerir certificação.
- **Registro da marca TrialScale** — busca formal no INPI e parecer especializado (busca web não encontrou colisão direta, mas o prefixo "Trial-" é denso no setor); definir estratégia de domínio; contingências: Trialha, Farol, SiteScale.
- **Validade / expiração de artefatos** (maturidade decai: POPs vencem, equipes mudam, indicadores param de ser medidos) — levantado na revisão crítica, sem decisão; interage com a gamificação (queda de nível).
- **Comparabilidade do benchmark** — o nível geral ponderado pelos objetivos do centro serve à priorização interna, mas não é comparável entre centros; a comparação deve usar níveis por processo ou um índice não ponderado. Recomendação da revisão, a confirmar.
- **Campos exatos do cadastro médio** e redação do consentimento LGPD.
- **Design de telas / UX** de cada fase.

---

*Fim da versão 2 do documento de concepção.*
