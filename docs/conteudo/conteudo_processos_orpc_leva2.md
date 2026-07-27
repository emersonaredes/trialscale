# TrialScale — Catálogo ORPC · Segunda Leva de Conteúdo
## Iniciar Estudo (Start-up) · Aprovar Regulatório (Anvisa) · Acompanhar Aprovação Ética · Gerenciar Dados · Gerenciar Farmacovigilância

> ## ⚠ ATUALIZAÇÃO REGULATÓRIA PENDENTE (julho/2026)
>
> Este arquivo **precede** as mudanças consolidadas em `atualizacao_regulatoria_2026.md`. Antes de publicar qualquer conteúdo deste arquivo no CMS, aplicar a errata e o enriquecimento descritos lá. Pontos principais: (a) o E6(R2) — e não o E6(R3) — é a referência de BPC usada pela Anvisa em inspeções; (b) o sistema de ética passou de CEP/Conep para Sinep/Inaep (Decreto nº 12.651/2025); (c) novos prazos e regras de diligência da análise ética (Despacho Inaep nº 2/2026); (d) artefatos e DoDs a ajustar conforme os achados reais do Relatório de Métricas de Inspeções de BPC 2024–2025 da Anvisa.

*Versão 1 — mesmo molde da primeira leva ORPC. Terminologia padronizada em ORPC.*

**Legenda de origem:** [R] arquitetura de referência ORPC · [G] boa prática de mercado / GCP · [A] exigência de norma vigente · [D] proposta de design.
**Classificação:** (E) essencial · (C) complementar. **DoD** = definição de pronto.

> **Status: proposta para curadoria.** Esta é a leva de maior densidade regulatória do catálogo ORPC. Todos os itens [A] exigem validação humana antes da publicação, e os prazos e fluxos citados devem ser confirmados na norma vigente no momento do uso — este é um domínio em transição ativa (ver aviso abaixo).

> ## ⚠ Aviso de transição regulatória — sistema de ética em pesquisa
>
> O arcabouço de ética em pesquisa no Brasil passou por reformulação estrutural que **não está refletida nos textos das levas anteriores do catálogo CPC**, que descreviam o Sistema CEP/Conep como vigente:
>
> - A **Lei nº 14.874/2024** instituiu o Sistema Nacional de Ética em Pesquisa com Seres Humanos, e foi regulamentada pelo **[Decreto nº 12.651, de 07/10/2025](https://www.planalto.gov.br/ccivil_03/_Ato2023-2026/2025/Decreto/D12651.htm)**, que instituiu a **Instância Nacional de Ética em Pesquisa (Inaep)**, vinculada à Secretaria de Ciência, Tecnologia e Inovação e do Complexo Econômico-Industrial da Saúde do Ministério da Saúde.
> - As funções de regulação, normatização e credenciamento de comitês foram transferidas da **Conep** para a **Inaep**; a Conep permanece como instância recursal até a posse dos membros da nova instância (art. 40 do Decreto).
> - Os **CEPs já credenciados mantêm sua condição até reavaliação** (art. 37) e seguem exercendo a análise ética de forma independente e autônoma (art. 22).
> - A **Plataforma Brasil permanece** como base nacional e unificada para registro, peticionamento, avaliação e acompanhamento eletrônico das pesquisas (art. 8º do Decreto); os procedimentos de submissão não foram alterados.
> - As **resoluções do CNS** (466/2012, 510/2016 e outras) permanecem válidas enquanto compatíveis com a Lei e o Decreto (art. 39).
> - Atos posteriores a consultar: **Nota Técnica nº 1/2026-DECIT/SCTIE/MS** (tramitação de protocolos de risco elevado) e **Despachos nº 1 e nº 2, de 27/04/2026** (funcionamento dos CEPs, prazos de análise ética e harmonização do sistema). A Inaep mantém material de perguntas e respostas em [gov.br/saude — Inaep](https://www.gov.br/saude/pt-br/composicao/orgaos-colegiados/inaep).
>
> **Consequência para o produto:** a nomenclatura "Sistema CEP/Conep" usada nos textos instrutivos das levas 1 a 4 do catálogo CPC precisa de passe de atualização. Este é exatamente o caso que justifica a decisão de manter o conteúdo regulatório atualizável no CMS.

---

# Iniciar Estudo (Start-up)

**Descrição de uma linha (termômetro):** Como a ORPC prepara e ativa os centros para começarem a recrutar.

**Objetivo:** levar cada centro aprovado da condição de selecionado à condição de ativado, com documentação, contratos, sistemas, materiais e equipe treinada em condições de incluir o primeiro participante.

**Caracterização base [R]:** Entradas: centros aprovados; protocolo e documentos do estudo; aprovações regulatória e ética. Atividades: traduzir e adaptar o estudo e a documentação à realidade local; negociar contratos e orçamentos com os centros; configurar acessos aos sistemas do estudo; alinhar parceiros e serviços do projeto; realizar o encontro de investigadores; verificar as condições de ativação de cada centro. Saídas: centros ativados, aptos a recrutar. Observação de fronteira: a visita de iniciação, embora pertença cronologicamente ao start-up, foi tratada no processo Monitorar estudo, onde a arquitetura de referência a posiciona — decisão de curadoria a confirmar.

### Escalonamento por nível

**Nível 1 — Inicial**
Cada centro é ativado de um jeito diferente, no ritmo de quem estiver disponível; a data de ativação é descoberta em vez de planejada.

**Nível 2 — Informal**
- (E) [R] Controle de status dos centros em start-up — DoD: relação dos centros com etapa atual (tradução, contrato, sistemas, treinamento) e responsável.
- (C) [D] Responsável pelo start-up definido — DoD: pessoa nomeada conduz a ativação dos centros do projeto.

**Nível 3 — Definido**
- (E) [G] POP de start-up de centro — DoD: procedimento aprovado, assinado, com versão e data, cobrindo tradução e adaptação de documentos, contratação do centro, configuração de acessos, treinamento e critérios de ativação.
- (E) [G] Critérios de ativação documentados *(governança)* — DoD: lista objetiva de condições que um centro deve cumprir para ser liberado para recrutar (aprovações vigentes, contrato assinado, equipe treinada e delegada, sistemas com acesso, materiais e produto disponíveis), com registro da liberação.
- (E) [R] POP ou fluxo de tradução e adaptação de documentos — DoD: procedimento que define quem traduz, quem revisa tecnicamente e como se controla a versão dos documentos localizados.
- (E) [R] Template de contrato e orçamento com centros — DoD: modelos base com cláusulas e tabela de procedimentos, prontos para adaptação por centro.
- (C) [G] Checklist de configuração de sistemas por centro — DoD: usuários, permissões e treinamentos em cada sistema do estudo verificados antes da ativação.

**Nível 4 — Gerenciado**
- (E) [G] Ferramenta de acompanhamento de start-up com marcos por centro — DoD: sistema ou planilha com as etapas e datas previstas e realizadas de cada centro, atualizada.
- (E) [G] Indicadores medidos — DoD: tempo da aprovação à ativação por centro, tempo até o primeiro participante incluído e proporção de centros ativados no prazo, registrados e revisados em rotina.
- (E) [R] Registro do encontro de investigadores — DoD: agenda, material apresentado e lista de presença arquivados, com evidência do treinamento realizado.
- (C) [G] Gestão de riscos do start-up — DoD: riscos por centro identificados (dependências locais, capacidade, sazonalidade) com ações preventivas registradas.

**Nível 5 — Otimizado**
- (E) [G] Paralelização e padronização orientadas por dado — DoD: análise dos tempos por etapa identifica gargalos e reorganiza a sequência (atividades em paralelo, pacotes pré-aprovados), com efeito medido nos indicadores.
- (C) [G] Base de conhecimento por centro e por região — DoD: particularidades locais (exigências do CEP, prazos de instituições, contratos) registradas e reutilizadas em novos estudos.

### Compartilhamentos e observações
- Recebe de Selecionar e qualificar centros; entrega para Monitorar estudo (visita de iniciação e acompanhamento de recrutamento).
- Depende de Aprovar regulatório e de Acompanhar aprovação ética; a paralelização entre esses três é a principal alavanca de redução do tempo total de start-up.
- Contratos com centros compartilham com Gerenciar financeiro (marcos e repasses) e com Definir orçamento e proposta (premissas de custo por centro).
- **Aplicabilidade:** universal em ORPCs que ativam centros.
- **Regulatório:** conforme o [ICH E6(R3)](https://database.ich.org/sites/default/files/ICH_E6(R3)_Step4_FinalGuideline_2025_0106.pdf), nenhuma atividade do ensaio pode iniciar em um centro antes das aprovações aplicáveis e da formalização dos acordos escritos; o patrocinador deve assegurar que investigador e equipe estão qualificados, treinados e informados sobre o protocolo e o produto sob investigação. Quando a ORPC conduz o start-up por delegação, o patrocinador mantém o dever de supervisão.

---

# Aprovar Regulatório (Anvisa)

**Descrição de uma linha (termômetro):** Como a ORPC obtém e mantém a anuência sanitária do ensaio junto à Anvisa.

**Objetivo:** obter a aprovação da autoridade sanitária para a condução do ensaio clínico no país e manter a regularidade das petições ao longo do estudo.

**Caracterização base [R]:** Entradas: protocolo e documentos do patrocinador; escopo de delegação contratada. Atividades: preparar o dossiê; submeter às agências; acompanhar a análise; resolver pendências; obter a aprovação. Saídas: ensaio aprovado e petições regulares. Observação: a extensão deste processo depende diretamente de quais atribuições do patrocinador a ORPC assumiu perante a Anvisa — variável central de configuração deste processo.

### Escalonamento por nível

**Nível 1 — Inicial**
Submissões preparadas caso a caso, sem checklist nem controle de prazos; pendências descobertas quando a agência responde.

**Nível 2 — Informal**
- (E) [R] Controle das petições submetidas — DoD: relação de petições por estudo, tipo, data de submissão e status.
- (E) [A][D] Escopo de delegação documentado *(governança)* — DoD: registro claro de quais atribuições do patrocinador a ORPC assume perante a Anvisa em cada projeto, conforme o contrato.
- (C) [D] Responsável regulatório definido — DoD: pessoa ou área nomeada responde pelas petições.

**Nível 3 — Definido**
- (E) [G] POP de submissão e acompanhamento regulatório — DoD: procedimento aprovado, assinado, com versão e data, cobrindo montagem do dossiê, conferência, submissão, acompanhamento, resposta a pendências e arquivamento.
- (E) [A][G] Checklist de composição do dossiê por tipo de petição — DoD: relação dos documentos exigidos para cada tipo de submissão, mantida atualizada conforme as normas e manuais vigentes.
- (E) [G] Controle de versões dos documentos submetidos — DoD: cada documento submetido tem versão e data identificáveis, e a versão vigente é recuperável a qualquer momento.
- (C) [G] Biblioteca de modelos e formulários oficiais — DoD: formulários e modelos exigidos pela agência mantidos em versão vigente, com data da última verificação.

**Nível 4 — Gerenciado**
- (E) [G] Ferramenta de gestão de petições com prazos — DoD: sistema ou planilha com todas as petições, prazos regulatórios, prazos internos e alertas de vencimento.
- (E) [G] Indicadores medidos — DoD: tempo de montagem do dossiê, tempo total até a aprovação, pendências por tipo e taxa de submissões sem pendência, registrados e revisados em rotina.
- (E) [G] Análise de pendências por causa — DoD: pendências classificadas por origem (documento ausente, formato, conteúdo técnico) com ações sobre as recorrentes.
- (C) [G] Rotina de vigilância normativa — DoD: monitoramento periódico de publicações da agência (normas, instruções normativas, manuais) com registro do que foi verificado e das mudanças aplicadas aos checklists.

**Nível 5 — Otimizado**
- (E) [G] Estratégia regulatória por projeto — DoD: caminho de submissão escolhido deliberadamente conforme as opções disponíveis na norma (procedimentos otimizados, submissão de dados de forma progressiva, aproveitamento de avaliações de autoridades estrangeiras quando aplicável), com justificativa registrada.
- (C) [G] Histórico consolidado de submissões realimenta as estimativas — DoD: base de tempos reais por tipo de petição usada nos cronogramas de novos projetos.

### Compartilhamentos e observações
- Depende de Definir escopo (o que foi contratado) e alimenta Iniciar estudo e Gerenciar projeto (marcos de cronograma).
- O escopo de delegação é artefato compartilhado com Definir orçamento e proposta e com o processo de contratação — dono natural: este processo.
- **Aplicabilidade:** aplica-se a ORPCs que assumem atribuições regulatórias; não se aplica a organizações contratadas exclusivamente para serviços que não envolvem peticionamento (caso legítimo de "não se aplica").
- **Regulatório:** de acordo com a [RDC nº 945/2024](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/pesquisaclinica/regulamentacao), a ORPC é a empresa contratada que assume, parcial ou totalmente, as atribuições do patrocinador perante a Anvisa. A norma organiza a submissão em torno do Dossiê de Desenvolvimento Clínico de Medicamento (DDCM) e do Dossiê Específico de Ensaio Clínico (DEEC); estabeleceu prazo máximo de 90 dias úteis para conclusão da análise de petições primárias, em consonância com a Lei nº 14.874/2024; e previu procedimentos otimizados, incluindo *reliance* — consideração de avaliações de Autoridade Reguladora Estrangeira Equivalente — e submissão contínua de dados parciais. A Instrução Normativa nº 338/2024 detalha os critérios do procedimento otimizado, e a Anvisa publicou manuais de submissão de DDCM e DEEC, além do Formulário de Apresentação de Ensaio Clínico. A mesma norma prevê que a inspeção da Anvisa pode alcançar as instalações da ORPC e ser conduzida de forma remota ou híbrida. **Verificar sempre a versão vigente de normas, instruções normativas, manuais e formulários no momento do uso.**

---

# Acompanhar Aprovação Ética

**Descrição de uma linha (termômetro):** Como a ORPC conduz e acompanha a análise ética do estudo e a mantém vigente.

**Objetivo:** assegurar que o estudo tenha aprovação ética válida em cada centro antes de qualquer atividade com participantes, e que ela permaneça vigente durante todo o ciclo de vida do projeto.

**Caracterização base [R]:** Entradas: pacote de documentos do estudo; regras do comitê competente. Atividades: preparar o dossiê ético; encaminhar ao centro coordenador ou ao comitê competente conforme o fluxo aplicável; acompanhar a análise; responder pendências; obter e distribuir os pareceres; manter as aprovações vigentes ao longo do estudo (emendas, notificações e relatórios). Saídas: aprovações éticas válidas e rastreáveis por centro.

### Escalonamento por nível

**Nível 1 — Inicial**
Acompanhamento informal por e-mail; não há visão consolidada de qual centro está aprovado, pendente ou com aprovação a vencer.

**Nível 2 — Informal**
- (E) [R] Controle das submissões éticas por centro — DoD: relação com centro, comitê, data de submissão e status.
- (C) [D] Responsável pelo acompanhamento ético definido — DoD: pessoa nomeada conduz e monitora as submissões.

**Nível 3 — Definido**
- (E) [G] POP de submissão e acompanhamento ético — DoD: procedimento aprovado, assinado, com versão e data, cobrindo montagem do dossiê, submissão, acompanhamento, resposta a pendências, distribuição de pareceres e arquivamento.
- (E) [A][G] Checklist do pacote ético — DoD: relação dos documentos exigidos, mantida atualizada conforme as normas vigentes e as exigências do comitê competente.
- (E) [G] Controle de vigência das aprovações por centro — DoD: registro que permite responder, a qualquer momento, qual centro tem aprovação válida e para qual versão dos documentos.
- (C) [G] Base de particularidades por comitê — DoD: exigências, calendário de reuniões e modelos de cada comitê registrados e reutilizados.

**Nível 4 — Gerenciado**
- (E) [G] Ferramenta de gestão com prazos e alertas — DoD: sistema ou planilha com submissões, prazos de resposta a pendências e alertas de vencimento de aprovações e relatórios.
- (E) [G] Indicadores medidos — DoD: tempo por fase (preparo, submissão, pendências, aprovação), pendências por tipo e proporção de submissões sem pendência, registrados e revisados em rotina.
- (E) [G] Fluxo de distribuição de pareceres e versões — DoD: procedimento que garante que centros, patrocinador e equipe operem sempre com a versão aprovada mais recente, com evidência de comunicação.
- (C) [G] Análise de pendências por causa — DoD: causas recorrentes tratadas com ajuste dos checklists e dos modelos.

**Nível 5 — Otimizado**
- (E) [G] Rotina de vigilância normativa ética — DoD: monitoramento periódico de atos da instância nacional e dos comitês, com registro do que foi verificado e das mudanças aplicadas ao processo.
- (C) [G] Histórico de tempos por comitê realimenta cronogramas — DoD: base de tempos reais usada nas estimativas de start-up de novos projetos.

### Compartilhamentos e observações
- Alimenta Iniciar estudo (condição de ativação) e Manter documentação do estudo (emendas e relatórios); recebe insumos de Gerenciar farmacovigilância (notificações de segurança) e de Monitorar estudo (desvios a reportar).
- **Aplicabilidade:** aplica-se conforme a delegação contratada; em muitos projetos o centro conduz a submissão e a ORPC acompanha — a configuração do processo deve refletir isso.
- **Regulatório:** de acordo com a [Lei nº 14.874/2024](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14874.htm) e o [Decreto nº 12.651/2025](https://www.planalto.gov.br/ccivil_03/_Ato2023-2026/2025/Decreto/D12651.htm), que a regulamentou, o sistema nacional de ética em pesquisa passou a ter como instância normativa e de credenciamento a Instância Nacional de Ética em Pesquisa (Inaep), permanecendo a Conep como instância recursal até a posse dos membros da nova instância (art. 40 do Decreto). Os CEPs credenciados mantêm sua condição até reavaliação (art. 37) e seguem conduzindo a análise ética de forma independente e autônoma (art. 22). A **Plataforma Brasil permanece** como base nacional e unificada de registro, peticionamento, avaliação e acompanhamento (art. 8º do Decreto), com procedimentos de submissão não alterados. Quanto a prazos, a Lei nº 14.874/2024 estabelece que o pesquisador tem 10 dias úteis, prorrogáveis por igual período mediante justificativa, para corrigir pendências documentais e ressubmeter o protocolo, sob pena de cancelamento da análise (art. 14, §2º). As resoluções do CNS permanecem válidas enquanto compatíveis com a Lei e o Decreto (art. 39). Atos posteriores devem ser consultados, incluindo a Nota Técnica nº 1/2026-DECIT/SCTIE/MS sobre protocolos de risco elevado e os Despachos nº 1 e nº 2, de 27/04/2026, sobre funcionamento dos comitês, prazos de análise e harmonização do sistema. **Este é um domínio em transição ativa: confirmar sempre os atos vigentes junto à Inaep e ao comitê competente.**

---

# Gerenciar Dados

**Descrição de uma linha (termômetro):** Como a ORPC constrói, alimenta, limpa e encerra a base de dados do estudo.

**Objetivo:** garantir que os dados do ensaio sejam completos, acurados, rastreáveis e defensáveis, do desenho do instrumento de coleta até o fechamento da base para análise.

**Caracterização base [R]:** Entradas: protocolo e plano de análise; dados gerados nos centros; dados externos (laboratório, imagem, dispositivos). Atividades: elaborar as fichas clínicas e configurar o sistema de coleta; acompanhar a entrada de dados; gerar e acompanhar discrepâncias; limpar a base; reconciliar dados externos; fechar a base para análise; acompanhar a análise estatística. Saídas: base de dados fechada e apta à análise.

### Escalonamento por nível

**Nível 1 — Inicial**
Coleta em planilhas ou instrumentos improvisados; sem controle de versões, sem trilha de auditoria, sem critério de fechamento.

**Nível 2 — Informal**
- (E) [R] Instrumento de coleta definido por estudo — DoD: fichas clínicas ou sistema em uso, conhecidos pela equipe.
- (E) [R] Acompanhamento da entrada de dados — DoD: alguém verifica periodicamente se os centros estão inserindo dados.
- (C) [D] Responsável por dados definido — DoD: pessoa nomeada responde pela base do estudo.

**Nível 3 — Definido**
- (E) [G] POP de gestão de dados — DoD: procedimento aprovado, assinado, com versão e data, cobrindo desenho do instrumento, configuração, testes, entrada, discrepâncias, limpeza e fechamento.
- (E) [G] Plano de gestão de dados por estudo *(governança)* — DoD: documento que define estrutura da base, regras de validação, fluxo de discrepâncias, dados externos e critérios de fechamento, aprovado antes do início da coleta.
- (E) [A][G] Registro de testes e aceite do sistema de coleta — DoD: evidência documentada de que as regras de validação e o fluxo foram testados e aceitos antes de entrar em produção.
- (E) [G] Guia de preenchimento das fichas clínicas — DoD: instruções por campo disponibilizadas aos centros e usadas no treinamento.
- (C) [G] Controle de acessos e perfis por estudo — DoD: usuários e permissões definidos e revisados, com atribuibilidade individual das ações.

**Nível 4 — Gerenciado**
- (E) [G] Gestão ativa de discrepâncias — DoD: discrepâncias geradas, classificadas e acompanhadas até a resolução, com prazos definidos.
- (E) [G] Indicadores medidos — DoD: tempo entre visita e entrada do dado, discrepâncias por tipo e por centro, tempo de resolução e taxa de dados pendentes, registrados e revisados em rotina.
- (E) [G] Reconciliação de dados externos — DoD: dados de laboratório, imagem e dispositivos conferidos contra a base clínica, com divergências tratadas e registradas.
- (E) [G] Procedimento de fechamento da base — DoD: critérios e etapas do fechamento definidos, com registro formal de quem autorizou e quando.
- (C) [G] Codificação padronizada de termos — DoD: eventos adversos e medicações codificados com dicionários reconhecidos, em versão registrada.

**Nível 5 — Otimizado**
- (E) [G] Revisão de qualidade de dados orientada por risco — DoD: análise centralizada identifica padrões e sinais (inconsistências, outliers, comportamento de centro) direcionando o esforço de limpeza e de monitoria, com registro.
- (C) [G] Reconciliação sistemática entre base clínica e base de segurança — DoD: conferência periódica documentada entre eventos adversos registrados nas duas bases, com divergências resolvidas.
- (C) [G] Padronização de instrumentos entre estudos — DoD: biblioteca de fichas e regras reutilizáveis reduzindo tempo de configuração, com uso registrado.

### Compartilhamentos e observações
- Recebe de Monitorar estudo (verificação de dados fonte e achados) e alimenta Analisar dados e estatística e Encerrar estudo (relatório final).
- A reconciliação com a base de segurança é artefato compartilhado com Gerenciar farmacovigilância — dono a definir na curadoria.
- Os sistemas de coleta compartilham com Gerenciar TI e sistemas validados, dono natural dos requisitos de validação.
- **Aplicabilidade:** universal em ORPCs que prestam gestão de dados; não se aplica a organizações contratadas apenas para serviços de campo.
- **Regulatório:** conforme o [ICH E6(R3)](https://database.ich.org/sites/default/files/ICH_E6(R3)_Step4_FinalGuideline_2025_0106.pdf), espera-se governança de dados ao longo de todo o ciclo de vida, com dados atribuíveis, legíveis, contemporâneos, originais, acurados e completos, trilhas de auditoria adequadas, controle de acessos e rastreabilidade dos dados reportados até os registros fonte; os sistemas eletrônicos empregados devem ser validados de forma proporcional ao risco de seu uso. De acordo com a [RDC nº 945/2024](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/pesquisaclinica/regulamentacao), a monitoria compreende certificar-se de que o ensaio é conduzido, registrado e relatado conforme o protocolo, os POPs, as BPC e as exigências regulatórias — o que alcança a qualidade do registro e do reporte dos dados. Requisitos adicionais de registros eletrônicos podem ser exigidos contratualmente por patrocinadores sujeitos a outras jurisdições; trata-se de exigência contratual, não de norma brasileira.

---

# Gerenciar Farmacovigilância

**Descrição de uma linha (termômetro):** Como a ORPC coleta, avalia e notifica informações de segurança do estudo.

**Objetivo:** assegurar que informações de segurança sejam coletadas, avaliadas, notificadas e comunicadas nos prazos aplicáveis, protegendo os participantes e cumprindo as obrigações regulatórias assumidas.

**Caracterização base [R]:** Entradas: eventos adversos comunicados pelos centros; informações de segurança do patrocinador. Atividades: receber e registrar eventos; avaliar seriedade, expectativa e causalidade; codificar; notificar o que for notificável nos prazos aplicáveis; distribuir notificações de segurança aos centros e comitês; acompanhar até o desfecho; consolidar relatórios periódicos de segurança; reconciliar com a base clínica. Saídas: notificações realizadas, relatórios de segurança consolidados, centros e comitês informados.

> **Atenção especial:** a extensão deste processo depende do escopo delegado. Conforme a norma vigente, a responsabilidade primária de notificação à autoridade sanitária é do patrocinador, sendo admitida a delegação à ORPC — e é justamente por isso que o registro do escopo de delegação é artefato essencial aqui.

### Escalonamento por nível

**Nível 1 — Inicial**
Eventos chegam por e-mail e são tratados conforme a disponibilidade de quem os recebe; sem prazo controlado, sem registro consolidado.

**Nível 2 — Informal**
- (E) [R] Registro dos eventos recebidos — DoD: relação com participante (identificado por código), centro, evento, datas e status.
- (E) [A][D] Escopo de delegação de segurança documentado *(governança)* — DoD: registro do que a ORPC assume em matéria de segurança em cada projeto (recebimento, avaliação, notificação à autoridade, distribuição), conforme o contrato.
- (C) [D] Responsável por farmacovigilância definido — DoD: pessoa ou área nomeada, com contato disponível aos centros.

**Nível 3 — Definido**
- (E) [A][G] POP de gestão de eventos adversos e notificações de segurança — DoD: procedimento aprovado, assinado, com versão e data, definindo recebimento, avaliação de seriedade, expectativa e causalidade, prazos e responsáveis por cada tipo de notificação.
- (E) [A][G] Fluxo de prazos documentado *(governança)* — DoD: prazos aplicáveis a cada tipo de comunicação registrados por escrito, com o caminho de escalonamento em caso de indisponibilidade do responsável.
- (E) [G] Templates de coleta e de acompanhamento de evento — DoD: formulários que garantem a captura completa das informações necessárias à avaliação e à notificação.
- (E) [G] Registro de treinamento da equipe de segurança — DoD: evidência de treinamento em BPC, no procedimento e no protocolo específico, com vigência controlada.
- (C) [G] Fluxo de distribuição de notificações de segurança — DoD: procedimento que garante e evidencia a ciência dos investigadores e comitês sobre informações de segurança recebidas.

**Nível 4 — Gerenciado**
- (E) [G] Base de dados de segurança com controle de prazos — DoD: sistema ou instrumento que registra cada evento, suas datas críticas e o cumprimento dos prazos, com alertas.
- (E) [G] Indicadores medidos — DoD: tempo entre ciência e notificação, proporção de notificações no prazo, eventos por classificação e pendências de acompanhamento em aberto, registrados e revisados em rotina.
- (E) [G] Codificação padronizada e controle de versão do dicionário — DoD: eventos e medicações codificados com dicionário reconhecido, em versão registrada.
- (E) [G] Reconciliação entre base de segurança e base clínica — DoD: conferência periódica documentada, com divergências tratadas.
- (C) [A][G] Consolidação de relatórios periódicos de segurança — DoD: relatório de atualização de segurança do desenvolvimento consolidado nos prazos e formatos aplicáveis, quando delegado.

**Nível 5 — Otimizado**
- (E) [G] Revisão periódica do desempenho e do perfil de segurança — DoD: análise documentada dos indicadores e do perfil de eventos gerando ações de melhoria e, quando aplicável, subsídio à reavaliação de risco-benefício pelo patrocinador.
- (C) [G] Simulação de contingência — DoD: teste periódico do fluxo de notificação urgente (indisponibilidade de responsável, feriados, falha de sistema) com registro e ajustes.
- (C) [G] Análise de sinais em conjunto com a monitoria — DoD: padrões de eventos por centro cruzados com achados de monitoria, orientando ações preventivas.

### Compartilhamentos e observações
- **Simetria entre catálogos:** este processo é a contraparte de "Gerenciar evento adverso e evento adverso grave" no catálogo CPC — o centro identifica, avalia e comunica; a ORPC recebe, avalia, notifica e devolve informação de segurança ao sistema.
- A reconciliação compartilha com Gerenciar dados; a distribuição de notificações alimenta Acompanhar aprovação ética e Manter documentação do estudo.
- **Aplicabilidade:** aplica-se conforme delegação; ORPCs que não assumem função de segurança marcam "não se aplica" com justificativa, mas mantêm o fluxo de encaminhamento ao patrocinador.
- **Regulatório:** de acordo com a [RDC nº 945/2024](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/pesquisaclinica/regulamentacao), o patrocinador é o responsável pela notificação dos eventos adversos à Anvisa, sendo permitida a delegação dessa atividade à ORPC (art. 63); as Suspeitas de Reações Adversas Graves e Inesperadas (SUSAR) devem ser notificadas por meio do sistema eletrônico disponibilizado pela Agência (art. 64) — atualmente o [VigiMed](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/pesquisaclinica/notificacoes) —, e os demais eventos adversos são submetidos no relatório de atualização de segurança do desenvolvimento do medicamento experimental. A Agência orienta que sejam notificadas SUSARs ocorridas em território nacional e em estudos por ela aprovados. A norma prevê ainda que o investigador informe o patrocinador sobre eventos adversos graves em até 24 horas da ciência do evento (art. 70); que os investigadores monitorem e comuniquem todos os eventos adversos, inclusive os que cheguem ao seu conhecimento após o término do ensaio, manifestando opinião sobre causalidade (art. 57); que o patrocinador informe os investigadores sobre SUSARs, atualize a brochura e reavalie riscos e benefícios (art. 56); que estabeleça plano de monitoramento para detecção de eventos adversos tardios (art. 58); que a quebra de cegamento para notificação se restrinja à alocação do participante acometido; e que a Agência editará ato normativo complementar sobre monitoramento de segurança (art. 62). A Anvisa publicou manuais específicos de notificação de SUSARs e de uso do VigiMed. Conforme o [ICH E6(R3)](https://database.ich.org/sites/default/files/ICH_E6(R3)_Step4_FinalGuideline_2025_0106.pdf), o patrocinador mantém a responsabilidade de supervisão sobre atividades de segurança delegadas. **Prazos e fluxos devem ser confirmados na norma vigente e nos manuais atualizados no momento do uso.**

---

## Aprendizados desta leva

1. **O escopo de delegação é o artefato transversal do catálogo ORPC.** Apareceu como essencial em três dos cinco processos (regulatório, ética e farmacovigilância). Ele não tem equivalente no catálogo CPC, e é o que torna a maturidade de uma ORPC regulatoriamente consequente. Candidato natural a artefato compartilhado com processo-dono definido.
2. **Vigilância normativa emergiu como artefato recorrente.** Em domínios que mudam (Anvisa e ética), "acompanhar a norma" precisa ser artefato com DoD verificável, não boa intenção. A transição do sistema de ética documentada no aviso deste arquivo é a prova prática de por quê.
3. **Três processos são fortemente condicionais à delegação** (regulatório, ética, farmacovigilância) e dois são condicionais ao tipo de serviço (dados, start-up). A mecânica de "não se aplica" com justificativa é mais usada no catálogo ORPC do que no CPC — o que reforça a exigência de que a justificativa apareça no relatório.
4. **Segunda simetria confirmada:** farmacovigilância ORPC ↔ eventos adversos CPC, somando-se às duas simetrias da leva 1. Já são três pares de processos espelhados entre catálogos.
5. **O tipo "documento de governança" apareceu novamente** (critérios de ativação, escopo de delegação, plano de gestão de dados, fluxo de prazos de segurança). Sétima ocorrência no catálogo ORPC — a decisão de incluí-lo no vocabulário parece consolidada.

*Fim da segunda leva ORPC — 10 de 29 processos rascunhados.*
