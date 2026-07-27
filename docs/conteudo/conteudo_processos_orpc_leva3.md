# TrialScale — Catálogo ORPC · Terceira Leva de Conteúdo
## Gerenciar Suprimentos do Estudo · Manter Documentação do Estudo · Gerenciar Documentos Essenciais (TMF/eTMF) · Encerrar Estudo · Gerenciar Projeto (PMO)

*Versão 1 — mesmo molde das levas anteriores. **Esta leva já incorpora a atualização regulatória consolidada em `atualizacao_regulatoria_2026.md`**, não exigindo passe posterior de errata.*

**Legenda de origem:** [R] arquitetura de referência ORPC · [G] boa prática de mercado / GCP · [A] exigência de norma vigente · [I] achado real de inspeção de BPC (Relatório COPEC/Anvisa 2024–2025) · [D] proposta de design.
**Classificação:** (E) essencial · (C) complementar. **DoD** = definição de pronto.

> **Novo selo [I]:** esta leva introduz a marcação de artefatos derivados de **achados reais de inspeção**. É a evidência mais forte disponível para justificar por que um artefato é essencial — não é opinião de curadoria, é o que efetivamente gerou achado em inspeção da Anvisa. Recomenda-se avaliar a inclusão do selo [I] no vocabulário de `origin_seal` (impacto: um INSERT em lookup).

> **Nota de referência de BPC:** a referência de Boas Práticas Clínicas utilizada pela Anvisa em inspeções é o **Guia ICH E6(R2)**. O E6(R3), publicado pelo ICH em 2025, encontra-se em fase de implementação no Brasil e é citado aqui como boa prática antecipatória, não como exigência vigente.

---

# Gerenciar Suprimentos do Estudo

**Descrição de uma linha (termômetro):** Como a ORPC garante que produto sob investigação, kits, materiais e equipamentos cheguem e permaneçam aptos ao uso nos centros.

**Objetivo:** assegurar disponibilidade contínua e integridade dos insumos do estudo em todos os centros, com rastreabilidade completa do recebimento ao destino final.

**Caracterização base [R]:** Entradas: cronograma e previsão de recrutamento; especificações do produto e dos materiais. Atividades: projetar a demanda por centro e período; importar produto sob investigação, medicação concomitante e kits, quando aplicável; liberar e distribuir aos centros; monitorar condições de armazenamento e transporte; controlar validade e ressuprimento; gerenciar devoluções, destruições e realocações; consolidar a reconciliação do estudo. Saídas: centros abastecidos, cadeia de custódia documentada, reconciliação final.

### Escalonamento por nível

**Nível 1 — Inicial**
Suprimentos enviados conforme pedido dos centros, sem previsão de demanda nem controle consolidado; rupturas descobertas quando um centro avisa.

**Nível 2 — Informal**
- (E) [R] Controle de envios por centro — DoD: registro do que foi enviado a cada centro, com data e quantidade.
- (C) [D] Responsável por suprimentos definido — DoD: pessoa nomeada responde pela cadeia de abastecimento do estudo.

**Nível 3 — Definido**
- (E) [G] POP de gestão de suprimentos do estudo — DoD: procedimento aprovado, assinado, com versão e data, cobrindo previsão, liberação, distribuição, armazenamento, controle de validade, ressuprimento, devolução e destruição.
- (E) [I][A] Inventário geral por centro — DoD: inventário que permite acompanhar cada unidade **do recebimento até o retorno ou destruição**, com identificação de lote, validade e **número do kit**. *(Achado de inspeção: contabilidade do produto sem inventário geral e formulários sem os números dos kits, impedindo o controle de estoque.)*
- (E) [G] Especificações de armazenamento e transporte documentadas — DoD: condições exigidas por item (temperatura, umidade, luz, prazo) registradas e comunicadas aos centros.
- (E) [G] Previsão de demanda por centro e período — DoD: projeção baseada em recrutamento previsto, visitas futuras e prazo de ressuprimento, revisada periodicamente.
- (C) [A] Controle das etapas de importação — DoD: quando aplicável, registro do trâmite de importação vinculado à aprovação do ensaio, com documentação arquivada.

**Nível 4 — Gerenciado**
- (E) [G] Monitoramento de cadeia de temperatura no transporte e no destino — DoD: registro das condições em trânsito e no recebimento, com procedimento definido para excursões (segregação, avaliação de impacto, decisão documentada de liberação ou descarte).
- (E) [G] Indicadores medidos — DoD: rupturas de estoque por centro, visitas afetadas por indisponibilidade, perdas por validade e tempo de ressuprimento, registrados e revisados em rotina.
- (E) [I] Controle de validade com alerta antecipado — DoD: validades monitoradas com antecedência suficiente para realocação ou substituição antes do vencimento.
- (C) [I] Documentação de estabilidade das amostras e materiais — DoD: tempo de estabilidade em temperatura ambiente documentado e disponível às equipes. *(Achado de inspeção: ausência dessa documentação.)*

**Nível 5 — Otimizado**
- (E) [I][A] Reconciliação global do estudo — DoD: consolidação, por estudo, de tudo o que foi produzido, enviado, recebido, dispensado, devolvido e destruído, permitindo responder pelo destino de cada unidade. *(Achado de inspeção: impossibilidade de realizar a reconciliação global por ausência de informação.)*
- (C) [G] Previsão orientada por dados de recrutamento em tempo real — DoD: ajuste automático ou periódico da projeção conforme o ritmo real de inclusão, reduzindo excesso e ruptura.
- (C) [G] Análise de perdas e custo de suprimento — DoD: perdas por validade, excursão e realocação analisadas periodicamente, orientando decisões de distribuição.

### Compartilhamentos e observações
- Consome o cronograma de Gerenciar projeto e a previsão de Selecionar e qualificar centros; entrega para Monitorar estudo (verificação de contabilidade no centro) e para Encerrar estudo (reconciliação final).
- Contraparte no catálogo CPC: os processos de produto sob investigação (2.5) e de materiais (2.6) — o centro controla o seu estoque; a ORPC responde pela cadeia entre centros.
- **Aplicabilidade:** aplica-se conforme delegação; ORPCs que não gerenciam suprimentos marcam "não se aplica" com justificativa.
- **Regulatório:** conforme a [RDC nº 945/2024](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/pesquisaclinica/regulamentacao), a importação de produtos sob investigação observa rito próprio vinculado à aprovação do ensaio clínico, e a ORPC assume as atribuições do patrocinador na medida do contratado. O descarte de resíduos observa a [RDC nº 222/2018](https://bvsms.saude.gov.br/bvs/saudelegis/anvisa/2018/rdc0222_28_03_2018.pdf). O Guia ICH E6(R2), referência de BPC nas inspeções da Anvisa, atribui ao patrocinador a responsabilidade pelo fornecimento, manuseio, armazenamento e contabilidade do produto sob investigação, com registros que permitam rastrear cada unidade — obrigação que a ORPC assume quando delegada.

---

# Manter Documentação do Estudo

**Descrição de uma linha (termômetro):** Como a ORPC mantém protocolo, brochura, consentimento e comunicados de segurança atualizados e em uso nos centros.

**Objetivo:** garantir que todos os centros conduzam o estudo pela versão vigente e aprovada de cada documento, e que as informações de segurança cheguem a quem decide conduta clínica.

**Caracterização base [R]:** Entradas: alterações do patrocinador; informações de segurança; pareceres éticos e regulatórios. Atividades: manter o protocolo e suas emendas; manter a brochura do investigador; elaborar e distribuir comunicados de segurança; manter as versões do termo de consentimento; controlar versões e distribuição; evidenciar treinamento e implementação nos centros. Saídas: centros operando na versão vigente, com evidência.

> **Distinção importante:** este processo trata do **conteúdo vivo** dos documentos do estudo (o que está vigente e em uso). O arquivamento e a completude do dossiê são tratados em Gerenciar documentos essenciais (TMF/eTMF).

### Escalonamento por nível

**Nível 1 — Inicial**
Versões circulam por e-mail; não há como afirmar com segurança qual centro está usando qual versão de qual documento.

**Nível 2 — Informal**
- (E) [R] Registro das versões vigentes por documento — DoD: relação de protocolo, brochura e consentimento com número de versão e data.
- (C) [D] Responsável pela documentação do estudo definido — DoD: pessoa nomeada controla versões e distribuição.

**Nível 3 — Definido**
- (E) [G] POP de controle de versões e distribuição — DoD: procedimento aprovado, assinado, com versão e data, cobrindo recebimento da alteração, submissão quando aplicável, distribuição, treinamento e retirada de versões superadas.
- (E) [I][A] Matriz de versões por centro — DoD: instrumento que responde, a qualquer momento, qual versão de cada documento está aprovada e em uso em cada centro. *(Achados de inspeção correlatos: participante que não assinou a última versão aprovada do consentimento e reconsentimento não realizado na visita seguinte.)*
- (E) [A][G] Fluxo de comunicados de segurança com evidência de ciência — DoD: procedimento que garante o envio das informações de segurança aos investigadores e comitês, **com registro da ciência** de quem decide conduta clínica.
- (E) [G] Evidência de treinamento nas alterações — DoD: registro de que a equipe de cada centro foi treinada na nova versão antes de aplicá-la.
- (C) [G] Controle de retirada de versões superadas — DoD: procedimento que evita a coexistência de versões em uso.

**Nível 4 — Gerenciado**
- (E) [G] Indicadores medidos — DoD: tempo entre aprovação e implementação por centro, proporção de centros na versão vigente e tempo de distribuição de comunicados de segurança, registrados e revisados em rotina.
- (E) [I] Controle do ciclo de reconsentimento — DoD: quando a alteração exige reconsentimento, controle por participante da realização na primeira oportunidade aplicável, com registro.
- (C) [G] Plano de implementação de emendas — DoD: para emendas com impacto operacional, plano com etapas, responsáveis e prazos por centro.

**Nível 5 — Otimizado**
- (E) [G] Revisão periódica do processo de implementação — DoD: análise dos tempos e das falhas de implementação gerando ajustes, com efeito medido.
- (C) [G] Integração entre controle de versões e sistemas do estudo — DoD: versão vigente refletida automaticamente nos sistemas e portais usados pelos centros.

### Compartilhamentos e observações
- Recebe de Acompanhar aprovação ética (pareceres) e de Gerenciar farmacovigilância (informações de segurança); alimenta Monitorar estudo (verificação de versão em uso) e Gerenciar documentos essenciais (arquivamento).
- Contraparte no catálogo CPC: o processo 3.3, do lado de quem submete e implementa localmente.
- **Aplicabilidade:** universal em ORPCs que gerenciam estudos multicêntricos.
- **Regulatório:** o Guia ICH E6(R2), referência das inspeções da Anvisa, exige que emendas sejam aprovadas antes da implementação — salvo quando necessárias para eliminar risco imediato — e que o patrocinador mantenha os investigadores informados sobre novas informações de segurança relevantes, com atualização da brochura. De acordo com a [Lei nº 14.874/2024](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14874.htm) e o [Decreto nº 12.651/2025](https://www.planalto.gov.br/ccivil_03/_Ato2023-2026/2025/Decreto/D12651.htm), as tramitações éticas ocorrem no âmbito do Sinep, com a Plataforma Brasil como canal nacional; protocolos classificados como de risco elevado tramitam integralmente em CEP acreditado, **incluindo emendas e notificações** — informação que deve estar refletida no fluxo deste processo.

---

# Gerenciar Documentos Essenciais (TMF/eTMF)

**Descrição de uma linha (termômetro):** Como a ORPC organiza, mantém e preserva o dossiê do estudo em condições de inspeção.

**Objetivo:** manter o conjunto de documentos essenciais completo, atual, íntegro e recuperável ao longo do estudo e pelo período de guarda aplicável, demonstrando como o ensaio foi conduzido.

**Caracterização base [R]:** Entradas: documentos gerados por todos os processos do estudo. Atividades: planejar a estrutura do dossiê; receber e indexar documentos; verificar completude e qualidade; controlar acessos; transferir e arquivar ao encerramento; preservar pelo período de guarda. Saídas: dossiê íntegro, recuperável e apto a inspeção.

### Escalonamento por nível

**Nível 1 — Inicial**
Documentos acumulados em pastas de rede ou caixas, sem índice nem verificação de completude; encontrar um documento depende de quem o arquivou.

**Nível 2 — Informal**
- (E) [R] Estrutura de arquivamento definida — DoD: organização de pastas ou índice em uso, conhecida pela equipe.
- (C) [D] Responsável pelo dossiê definido — DoD: pessoa nomeada responde pela organização e completude.

**Nível 3 — Definido**
- (E) [G] POP de gestão de documentos essenciais — DoD: procedimento aprovado, assinado, com versão e data, cobrindo estrutura, indexação, prazos de arquivamento, verificação de completude, controle de acesso, transferência e guarda.
- (E) [I][G] Plano do dossiê com índice de referência — DoD: documento que define a estrutura esperada, quais documentos são exigidos em cada seção e quem é responsável por cada um. *(Achados de inspeção: forma de arquivamento e preparação, revisão e aprovação de documentos foram as subcategorias mais frequentes de achados menores em patrocinadores e ORPCs.)*
- (E) [I][A] Definição de qual repositório é o oficial — DoD: quando há arquivo físico e eletrônico, está documentado qual é o oficial, evitando duplicidade e documentos existentes em apenas um deles. *(Achado de inspeção: arquivos físico e eletrônico com documentos duplicados ou presentes só no físico, que não era o oficial.)*
- (E) [I][G] Conferência de assinaturas e versionamento — DoD: verificação de que páginas de assinatura estão assinadas e que a numeração de versões é única e sequencial. *(Achados de inspeção: páginas de assinatura de protocolo não assinadas e duas versões distintas identificadas com o mesmo número.)*
- (C) [G] Controle de acesso ao dossiê — DoD: perfis definidos, com registro de quem pode incluir, alterar e consultar.

**Nível 4 — Gerenciado**
- (E) [I][A] Dossiê de validação do sistema de dossiê eletrônico sob custódia própria — DoD: quando o dossiê é eletrônico, a documentação de validação do sistema — incluindo validação específica para o estudo — está arquivada sob custódia da própria organização, não apenas do fornecedor. *(Achado de inspeção: documentação de validação não estava no arquivo do patrocinador, tendo sido obtida junto ao fornecedor.)*
- (E) [G] Verificação periódica de completude e atualidade — DoD: conferência em intervalos definidos contra o índice de referência, com pendências registradas e tratadas.
- (E) [G] Indicadores medidos — DoD: completude por seção, tempo entre geração e arquivamento do documento e pendências em aberto, registrados e revisados em rotina.
- (C) [G] Trilha de auditoria do dossiê eletrônico — DoD: inclusões, alterações e exclusões registradas com autor e data, sem perda do documento original.

**Nível 5 — Otimizado**
- (E) [G] Prontidão para inspeção mantida continuamente — DoD: o dossiê é mantido em condição de inspeção a qualquer momento, verificado por simulações periódicas, e não preparado às pressas quando uma inspeção é anunciada.
- (C) [G] Plano de guarda e destinação de longo prazo — DoD: período de guarda por estudo definido em contrato, com meio, local, responsável e critério de descarte documentados.
- (C) [G] Transferência estruturada ao encerramento — DoD: procedimento de transferência do dossiê ao patrocinador ou ao arquivo definitivo, com inventário e aceite formal.

### Compartilhamentos e observações
- Recebe documentos de praticamente todos os processos; é o processo mais dependente da disciplina dos outros.
- Compartilha com Gerenciar TI e sistemas validados (validação do sistema de dossiê) e com Gerenciar infraestrutura e arquivo (guarda física).
- Contraparte no catálogo CPC: o arquivo do investigador, tratado nos processos de qualidade e de encerramento.
- **Aplicabilidade:** universal.
- **Regulatório:** o Guia ICH E6(R2), referência das inspeções da Anvisa, dedica seção específica aos documentos essenciais para a condução de um ensaio clínico, estabelecendo quais devem existir, em que fase e sob a guarda de quem, e exigindo que permaneçam recuperáveis para auditoria e inspeção. De acordo com a [Lei nº 14.874/2024](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14874.htm), a autoridade sanitária está expressamente autorizada a realizar inspeções de Boas Práticas Clínicas em centros, patrocinadores e ORPCs (art. 58, §4º), e o descumprimento das normas de BPC constitui infração sanitária, sujeitando o infrator às penalidades da Lei nº 6.437/1977 (art. 60). A [RDC nº 945/2024](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/pesquisaclinica/regulamentacao) prevê que a inspeção pode alcançar as instalações da ORPC e ser conduzida de forma remota ou híbrida — o que torna a recuperabilidade eletrônica do dossiê um requisito prático, e não apenas uma conveniência.

---

# Encerrar Estudo

**Descrição de uma linha (termômetro):** Como a ORPC encerra os centros e o estudo sem deixar pendências técnicas, financeiras ou documentais.

**Objetivo:** concluir formalmente as atividades em cada centro e no estudo, com reconciliações completas, documentação arquivada, obrigações com participantes definidas e resultados encaminhados.

**Caracterização base [R]:** Entradas: última visita do último participante; base de dados fechada. Atividades: planejar e realizar o encerramento de cada centro; concluir as reconciliações de produto, materiais e financeira; resolver pendências de dados e de monitoria; elaborar o relatório final do estudo; encaminhar a comunicação de encerramento às instâncias competentes; organizar e transferir o dossiê; coordenar o programa de fornecimento pós-estudo quando aplicável; registrar lições aprendidas. Saídas: centros e estudo encerrados, relatório final, dossiê arquivado.

### Escalonamento por nível

**Nível 1 — Inicial**
O encerramento acontece por esvaziamento: as atividades cessam sem visita formal, sem reconciliação consolidada e com pendências que ninguém fecha.

**Nível 2 — Informal**
- (E) [R] Registro de encerramento por centro — DoD: data e responsável pelo encerramento de cada centro registrados.
- (C) [D] Responsável pelo encerramento definido — DoD: pessoa nomeada conduz o encerramento do estudo.

**Nível 3 — Definido**
- (E) [G] POP de encerramento de centro e de estudo — DoD: procedimento aprovado, assinado, com versão e data, cobrindo preparação, visita de encerramento, reconciliações, resolução de pendências, arquivamento e comunicações.
- (E) [G] Checklist de encerramento por centro — DoD: roteiro que cobre produto e materiais, dossiê do centro, pendências de dados e de monitoria, obrigações financeiras e orientação sobre guarda de documentos.
- (E) [I][A] Reconciliações concluídas e documentadas — DoD: produto sob investigação, materiais e obrigações financeiras reconciliados com registro do resultado, permitindo responder pelo destino de tudo o que foi enviado. *(Achado de inspeção: impossibilidade de reconciliação global do produto por ausência de informação.)*
- (E) [A][G] Comunicação formal de encerramento às instâncias competentes — DoD: encerramento comunicado às instâncias ética e sanitária conforme as exigências aplicáveis e a delegação contratada, com evidência arquivada.
- (C) [A] Definição documentada sobre fornecimento pós-estudo — DoD: quando aplicável, o programa de fornecimento pós-estudo está definido, submetido à avaliação do comitê competente e operacionalizado com os centros.

**Nível 4 — Gerenciado**
- (E) [G] Controle de pendências até o encerramento formal — DoD: nenhum centro é encerrado com pendência aberta sem registro da decisão e do encaminhamento.
- (E) [G] Indicadores medidos — DoD: tempo entre a última visita do último participante e o encerramento do centro, tempo até o fechamento da base, tempo até o relatório final e pendências por centro, registrados e revisados em rotina.
- (E) [I][G] Controle de alterações após o fechamento da base — DoD: qualquer alteração de dados posterior à análise exige justificativa, autorização e registro. *(Achado de inspeção: dados de CRF alterados após a análise dos dados.)*
- (C) [G] Transferência do dossiê com aceite formal — DoD: inventário de transferência assinado pelas partes.

**Nível 5 — Otimizado**
- (E) [G] Lições aprendidas incorporadas — DoD: análise documentada do projeto encerrado (desempenho de centros, desvios recorrentes, precisão das premissas, margem realizada) alimentando os processos de escopo, orçamento, seleção de centros e monitoria, com registro do uso.
- (C) [G] Divulgação de resultados coordenada — DoD: encaminhamento dos resultados aos participantes, centros e comunidade científica conforme os compromissos assumidos.
- (C) [G] Encerramento como projeto planejado — DoD: o encerramento tem cronograma, responsáveis e recursos previstos desde o planejamento inicial, não improvisados ao fim.

### Compartilhamentos e observações
- Consome Gerenciar suprimentos (reconciliação), Gerenciar dados (fechamento), Monitorar estudo (pendências) e Gerenciar financeiro (obrigações); alimenta Gerenciar documentos essenciais e Divulgar resultados.
- Contraparte no catálogo CPC: o processo 4 (Encerrar protocolo) — quarta simetria mapeada entre os catálogos.
- **Aplicabilidade:** universal.
- **Regulatório:** conforme a [RDC nº 945/2024](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/pesquisaclinica/regulamentacao), o relatório final do ensaio clínico é definido como o documento que contém informações específicas sobre a condução do ensaio em todos os centros participantes no Brasil, de acordo com o protocolo e as BPC. O Guia ICH E6(R2) exige a retenção dos documentos essenciais pelo período aplicável, com responsabilidades de guarda definidas entre patrocinador e investigador ou instituição. Sobre o fornecimento pós-estudo: o [Decreto nº 12.651/2025](https://www.planalto.gov.br/ccivil_03/_Ato2023-2026/2025/Decreto/D12651.htm) determina que o programa seja elaborado pelo patrocinador e **submetido à avaliação do comitê de ética competente — não bastando a notificação** (art. 31, §1º, conforme material de perguntas e respostas da Inaep). Há ainda indicação de que a [Lei nº 14.874/2024](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14874.htm) limita a obrigatoriedade de fornecimento pós-estudo a cinco anos após a comercialização do produto no Brasil, em contraste com o suprimento contínuo previsto na Resolução CNS nº 466/2012 — **item pendente de confirmação no texto legal antes da publicação**.

---

# Gerenciar Projeto (PMO)

**Descrição de uma linha (termômetro):** Como a ORPC planeja, controla e comunica o andamento de cada projeto, do contrato ao encerramento.

**Objetivo:** entregar cada projeto no prazo, no escopo, no custo e na qualidade acordados, com comunicação previsível ao cliente e decisões apoiadas em dados.

**Caracterização base [R]:** Entradas: contrato, escopo e orçamento aprovados. Atividades: planejar o projeto e integrar o cronograma; alocar equipe e recursos; controlar escopo, prazo, custo e riscos; conduzir a comunicação com o cliente e as reuniões de equipe; escalonar decisões; reportar andamento; encerrar administrativamente. Saídas: projeto conduzido e reportado, decisões registradas. Observação: o PMO atravessa todo o ciclo de vida — é o processo que integra os demais.

### Escalonamento por nível

**Nível 1 — Inicial**
Cada projeto é conduzido pela memória e pelo esforço de quem está à frente; o cliente descobre problemas quando já são atrasos.

**Nível 2 — Informal**
- (E) [R] Responsável por projeto designado — DoD: cada projeto tem um responsável identificado, conhecido pelo cliente e pela equipe.
- (E) [R] Cronograma em uso — DoD: cronograma com marcos principais existe e é consultado.
- (C) [D] Rotina de reunião de equipe do projeto — DoD: encontro periódico com a equipe do estudo acontece.

**Nível 3 — Definido**
- (E) [G] POP de gestão de projetos — DoD: procedimento aprovado, assinado, com versão e data, cobrindo abertura, planejamento, controle, comunicação, escalonamento e encerramento.
- (E) [G] Plano de projeto *(governança)* — DoD: documento por projeto com escopo, marcos, equipe e responsabilidades, plano de comunicação e critérios de escalonamento, aprovado no início.
- (E) [I][G] Atas de reuniões com registro de decisões — DoD: reuniões de equipe e com o cliente têm ata com decisões, responsáveis e prazos, arquivada. *(Achados de inspeção: ausência de registro de atas de reuniões em que assuntos críticos foram discutidos e falhas de comunicação entre centro e patrocinador ou ORPC em ações críticas.)*
- (E) [G] Registro de riscos e questões — DoD: riscos e questões abertas do projeto registrados com responsável, ação e prazo, revisados periodicamente.
- (C) [G] Matriz de responsabilidades por atividade — DoD: quem executa, quem aprova e quem é informado, definido por atividade e comunicado ao cliente.

**Nível 4 — Gerenciado**
- (E) [G] Controle integrado de prazo, escopo e custo — DoD: previsto versus realizado acompanhado periodicamente, com desvios analisados e ações registradas.
- (E) [G] Relatório de andamento ao cliente em periodicidade definida — DoD: reporte com marcos, recrutamento, qualidade, riscos e pendências, enviado no ritmo acordado.
- (E) [G] Indicadores medidos — DoD: aderência a marcos, desvio de prazo e de custo, utilização da equipe alocada e pendências em aberto, registrados e revisados em rotina de gestão.
- (E) [I][G] Acompanhamento documentado de recomendações de comitês independentes — DoD: quando o estudo tem comitê de monitoramento de dados ou equivalente, as recomendações e a evidência de seu cumprimento são registradas. *(Achado de inspeção: ausência de evidências de que as recomendações do comitê foram seguidas.)*
- (C) [G] Controle formal de mudanças — DoD: alterações de escopo, prazo ou custo tramitam por procedimento com análise de impacto e aprovação registrada.

**Nível 5 — Otimizado**
- (E) [G] Governança de portfólio e projeto integrada — DoD: decisões de alocação e priorização entre projetos tomadas com base nos indicadores consolidados, com registro.
- (E) [G] Lições aprendidas sistematizadas — DoD: encerramento de cada projeto alimenta base de lições consultada no planejamento dos próximos, com evidência de uso.
- (C) [G] Previsão orientada por dados históricos — DoD: estimativas de prazo e esforço calibradas por desempenho real de projetos anteriores.

### Compartilhamentos e observações
- Integra todos os processos centrais; consome indicadores de Monitorar estudo, Gerenciar dados, Gerenciar suprimentos e Gerenciar financeiro.
- Alimenta Gerenciar portfólio de projetos (visão agregada) e Pós-venda (relacionamento).
- **Aplicabilidade:** universal. Em ORPCs pequenas, o PMO é uma função exercida pela liderança, não um departamento — o processo aplica-se igualmente.
- **Regulatório:** processo de gestão, sem norma sanitária específica — registrar isso evita sugerir exigência inexistente. Duas fronteiras relevantes: o Guia ICH E6(R2), referência das inspeções da Anvisa, exige que as responsabilidades delegadas pelo patrocinador constem em acordo escrito e que o patrocinador mantenha supervisão sobre o que delegou — o que faz do registro de decisões e comunicações um artefato de conformidade, não apenas de gestão; e os achados de inspeção citados acima mostram que ausência de atas e falhas de comunicação em ações críticas efetivamente geram achados, ainda que classificados sob procedimentos operacionais.

---

## Aprendizados desta leva

1. **O selo [I] é a novidade metodológica mais valiosa até agora.** Marcar artefatos derivados de achados reais de inspeção transforma a justificativa de "essencial" de opinião de curadoria em evidência verificável. Recomendação: incluir [I] no vocabulário de selos e, na interface, exibi-lo com destaque — é o argumento mais persuasivo que a plataforma pode dar a um gestor cético.
2. **Quatro processos desta leva ganharam artefatos que eu não teria proposto sem o relatório de inspeção:** definição de qual repositório é o oficial, conferência de páginas de assinatura e de unicidade de versões, custódia própria da documentação de validação e controle de alterações após o fechamento da base. Nenhum deles é óbvio a partir da arquitetura de referência.
3. **A quarta simetria entre catálogos está mapeada** (Encerrar estudo ORPC ↔ Encerrar protocolo CPC), somando-se a feasibility, monitoria e farmacovigilância. Os catálogos estão convergindo em pares interligados — insumo relevante para a hipótese de benchmark comparado, ainda dependente de consentimento específico.
4. **Gerenciar documentos essenciais é o processo mais dependente dos outros.** Sua maturidade é, em boa medida, um espelho da disciplina do resto da organização — o que sugere que ele funciona como indicador indireto de maturidade geral. Vale investigar na curadoria se merece peso diferenciado no cálculo do nível consolidado.
5. **A prontidão contínua para inspeção apareceu como marca do nível 5** em dois processos. É uma formulação melhor que "auditoria interna periódica": o que distingue a organização otimizada não é preparar-se bem para a inspeção anunciada, é não precisar se preparar.

*Fim da terceira leva ORPC — 15 de 29 processos rascunhados.*
