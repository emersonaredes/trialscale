# TrialScale — Atualização Regulatória 2026
## Errata e enriquecimento dos catálogos CPC e ORPC

*Documento de referência única para o passe de atualização. Consolida três fontes verificadas em julho de 2026 e indica, arquivo por arquivo, o que corrigir e o que acrescentar. Deve ser aplicado ao conteúdo antes da publicação no CMS.*

**Fontes desta atualização:**
1. **[Decreto nº 12.651, de 07/10/2025](https://www.planalto.gov.br/ccivil_03/_Ato2023-2026/2025/Decreto/D12651.htm)** — regulamenta a Lei nº 14.874/2024 e institui a Instância Nacional de Ética em Pesquisa (Inaep).
2. **Atos da Inaep e do Ministério da Saúde em 2026** — Nota Técnica nº 1/2026-DECIT/SCTIE/MS (13/01/2026); Despachos de Orientação nº 1 e nº 2, de 27/04/2026; Resolução Inaep nº 2/2026. Material de referência: [Inaep — Ministério da Saúde](https://www.gov.br/saude/pt-br/composicao/orgaos-colegiados/inaep).
3. **[Relatório de Métricas de Inspeções de BPC 2024–2025 — COPEC/Anvisa](https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/copy_of_COPEC_MtricasdeinspeodeBPC_20242025.pdf)** — achados reais de 11 inspeções concluídas.

---

## PARTE 1 — Correções obrigatórias

### 1.1 ⚠ Correção de premissa: status do ICH E6(R3) no Brasil

**O que os textos das levas 1 a 4 do catálogo CPC afirmam:** que o art. 7º da RDC 945/2024 adota o E6(R2) "e suas atualizações", o que estenderia sua aplicação ao E6(R3), tratando-o como referência vigente.

**O que a Anvisa afirma no relatório de inspeções de 2026:** a referência de Boas Práticas Clínicas utilizada pela Agência para inspeções de BPC **atualmente é o Guia ICH E6(R2)**; a Revisão 3, publicada pelo ICH em 2025, **ainda está em fase de implementação em diversos países, incluindo o Brasil**. Todos os critérios de avaliação citados no relatório de inspeção remetem a seções do E6(R2).

**Correção a aplicar:** onde o texto disser que o E6(R3) é a diretriz aplicável ou vigente, substituir por formulação que preserve a verdade dos dois fatos — o E6(R2) é a referência operativa das inspeções da Anvisa; o E6(R3) é a revisão internacional mais recente, em fase de implementação no país, e a redação do art. 7º da RDC 945/2024 ("e suas atualizações") sinaliza sua futura aplicabilidade. **Fórmula sugerida:**

> "A referência de BPC utilizada pela Anvisa em inspeções é o Guia ICH E6(R2); a Revisão 3 (E6(R3)), publicada em 2025, encontra-se em fase de implementação no Brasil e antecipa expectativas de gestão de qualidade baseada em risco e governança de dados que já orientam boas práticas."

Isso não invalida as recomendações do E6(R3) presentes no conteúdo — apenas as reposiciona como boa prática antecipatória, e não como exigência vigente. **Arquivos afetados:** `textos_instrutivos_leva1.md` a `leva4.md` (cabeçalhos e todas as seções "Atualizações regulatórias"), `conteudo_processos_orpc_leva1.md` e `leva2.md`.

### 1.2 Sistema de ética: de CEP/Conep para Sinep/Inaep

**Substituir a nomenclatura "Sistema CEP/Conep"** (usada como vigente nos textos CPC) pela arquitetura atual:

| Antes (nos textos) | Agora |
|---|---|
| Sistema CEP/Conep | Sistema Nacional de Ética em Pesquisa (Sinep) |
| Conep como instância normativa e de credenciamento | **Inaep** — Instância Nacional de Ética em Pesquisa, vinculada à SECTICS/MS |
| Conep como instância superior de análise | Conep permanece apenas como **instância recursal** até a posse dos membros da Inaep (art. 40 do Decreto) |
| Resoluções CNS como base normativa principal | Resoluções CNS **permanecem válidas enquanto compatíveis** com a Lei nº 14.874/2024 e o Decreto nº 12.651/2025 (art. 39 do Decreto) |

**Não mudou** (manter como está nos textos): os **CEPs** seguem conduzindo a análise ética de forma independente e autônoma (art. 22 do Decreto) e os já credenciados mantêm sua condição até reavaliação (art. 37); a **Plataforma Brasil** permanece como base nacional e unificada de registro, peticionamento, avaliação e acompanhamento (art. 8º do Decreto), com procedimentos de submissão inalterados.

### 1.3 Prazos e fluxo da análise ética — Despacho de Orientação nº 2/2026

Regras a incorporar nos processos **1.4 (aprovação ética)** e **3.3 (manter aprovação ética)** do catálogo CPC e em **Acompanhar aprovação ética** do catálogo ORPC. Vigência a partir de 05/05/2026:

- **Contagem de prazos em dias úteis** segue o critério geral do ordenamento: exclui-se o dia do início, inclui-se o do vencimento, com início no primeiro dia útil subsequente ao ato que inaugura o prazo.
- O art. 14 da Lei nº 14.874/2024 estabelece **dois marcos temporais distintos**: verificação da integralidade documental e análise ética propriamente dita.
- O CEP pode **formular diligência** ao pesquisador ou ao patrocinador antes de emitir o parecer (art. 14, §1º da Lei).
- **A diligência suspende o prazo de análise ética** a partir de sua comunicação. A suspensão não constitui prazo autônomo do CEP: sua duração corresponde ao período efetivamente utilizado pelo pesquisador para responder.
- **Limite máximo global de suspensão: 20 dias úteis.**
- Resposta que não atenda integralmente à diligência permite ao CEP **reiterar a diligência**, por decisão fundamentada, respeitado o limite global.
- Para responder pendências documentais, o pesquisador tem **10 dias úteis, prorrogáveis por outros 10 mediante justificativa**; o descumprimento pode levar ao cancelamento da análise (art. 14, §2º da Lei).
- Há previsão de **aprovação por decurso de prazo**, mediante deliberação colegiada registrada em ata, após a submissão da resposta na Plataforma Brasil, com comunicação formal ao pesquisador e ao patrocinador.
- Enquanto a Plataforma Brasil não tiver funcionalidades automatizadas de monitoramento, **a contagem dos prazos é feita pelo próprio CEP** com base nos registros de checagem documental e pareceres, assegurando rastreabilidade no histórico de trâmites.

> **Implicação prática para o conteúdo:** o centro e a ORPC deixam de ser meros espectadores do prazo. Como a suspensão depende do tempo que *eles* levam para responder, a agilidade na resposta a diligências passou a ser variável sob seu controle — e merece indicador próprio. Ver artefato novo em 2.3.

### 1.4 Protocolos de risco elevado — Nota Técnica nº 1/2026

A Nota Técnica nº 1/2026-DECIT/SCTIE/MS (13/01/2026) trata da tramitação de protocolos, competências no Sinep, prorrogação excepcional de credenciamento de CEPs e procedimentos aplicáveis a biobancos. O ponto de maior impacto operacional:

- Protocolos classificados como **de risco elevado** devem ser analisados por **CEP acreditado**, instância competente e legitimamente designada para essa análise.
- **Todas as tramitações subsequentes** — incluindo emendas e notificações — também correm pelo CEP acreditado.
- Durante a transição, há mecanismo de transferência em que um parecer de "Aprovado" pode ser liberado com a **única finalidade de acelerar a transferência** do protocolo para um CEP acreditado, sem representar manifestação do colegiado de origem sobre a eticidade (com fundamento no art. 9º, §1º, II da Lei nº 14.874/2024 e no art. 25, II do Decreto nº 12.651/2025).
- Há Nota Técnica específica anterior sobre **classificação de risco** de pesquisas no âmbito do Sinep (12/11/2025), que deve ser consultada para o enquadramento.

**Conteúdo a acrescentar:** o centro e a ORPC precisam saber, na fase de start-up, **se o protocolo é de risco elevado e se o CEP de referência é acreditado** — porque isso determina o caminho de tramitação de todo o ciclo de vida do estudo, não apenas da submissão inicial. É informação de planejamento, não de burocracia.

### 1.5 Governança dos CEPs — Despacho de Orientação nº 1/2026

Estabelece parâmetros mínimos obrigatórios para os regimentos internos dos CEPs (composição, votação por membros titulares, critérios de substituição de titulares por suplentes, periodicidade de reuniões suficiente para o cumprimento dos prazos). Impacto no conteúdo dos catálogos: **indireto mas relevante** — reforça o achado de inspeção sobre isenção de voto (ver 2.1) e dá base para o centro exigir previsibilidade de calendário do seu CEP. Consultar também a **Resolução Inaep nº 2/2026**, que integra o mesmo conjunto de medidas.

### 1.6 Fornecimento pós-estudo

Dois pontos a confirmar no texto da Lei e do Decreto antes de publicar (indício forte, fonte secundária para o primeiro):

- A Lei nº 14.874/2024 aparentemente **limita a obrigatoriedade de fornecimento pós-estudo a 5 anos após a comercialização do produto no Brasil**, em contraste com o suprimento contínuo enquanto houvesse benefício, previsto na Resolução CNS nº 466/2012.
- O **programa de fornecimento pós-estudo deve ser elaborado pelo patrocinador e submetido à avaliação do CEP competente** — não basta notificar (art. 31, §1º do Decreto nº 12.651/2025, conforme material de perguntas e respostas da Inaep).

**Arquivo afetado:** `textos_instrutivos_leva4.md`, processo 4 (Encerrar protocolo), e `conteudo_processos_centrais.md`.

---

## PARTE 2 — Enriquecimento a partir dos achados reais de inspeção

O relatório da COPEC/Anvisa é a fonte mais valiosa já incorporada ao projeto: são achados reais de 11 inspeções concluídas em 2024–2025, com as recomendações da própria Agência. Isso permite calibrar artefatos e DoDs com base no que efetivamente reprova em inspeção — não em suposição.

### 2.0 Contexto e base legal reforçada

- Foram **12 inspeções em 2024–2025** (4 em 2024, 8 em 2025), todas presenciais e em centros; 11 de rotina e 1 investigativa; 136 achados nos 11 relatórios concluídos. Estados: BA, MG, ES, PA, RS, SP, SE. Fases 1 a 3, majoritariamente fase 3.
- **Nenhuma inspeção em patrocinador ou ORPC** no período — mas foram registrados achados de responsabilidade do patrocinador/ORPC identificados durante inspeções em centros, classificados pelo Guia nº 36/2020.
- Base legal das inspeções, a incorporar no conteúdo: a **Lei nº 14.874/2024 autoriza expressamente a autoridade sanitária a realizar inspeções de BPC em centros, patrocinadores e ORPCs** (art. 58, §4º), e estabelece que o **descumprimento das normas de BPC constitui infração sanitária**, sujeitando o infrator às penalidades da Lei nº 6.437/1977, sem prejuízo das sanções civis e penais (art. 60).
- Instrumentos de inspeção: **IN nº 122/2022** (procedimentos e classificação de achados em Críticos, Maiores, Menores e Informativos) e os **Guias nº 35/2020 (centros) e nº 36/2020 (patrocinadores e ORPCs), versão 2 de 26/01/2022**, disponíveis no portal da Anvisa.

> **Descoberta de alto valor para o produto:** os Anexos 2 e 3 do relatório trazem a **estrutura completa de categorias e subcategorias de inspeção** — 7 categorias para centros e 3 para patrocinadores/ORPCs, com subcategorias detalhadas. Isso é, na prática, um *checklist oficial e público* contra o qual o catálogo de artefatos do TrialScale pode ser validado item a item. Recomendação: fazer uma passada de conferência do catálogo CPC contra o Anexo 2 e do catálogo ORPC contra o Anexo 3, marcando quais artefatos cobrem quais subcategorias. Ressalva: os Guias são de 2020/2022 e referenciam a RDC 09/2015 em pontos como os critérios de seleção de inspeção.

### 2.1 Onde as inspeções mais reprovam — calibragem de prioridade

**Centros (Guia 35):** achados **críticos** concentram-se em *Documentação Fonte e CRF*, seguidos de *Infraestrutura*, *Sistema de Qualidade* e *Organização e equipe*. Achados **maiores** concentram-se em *Sistema da Qualidade*, seguido de *Documentação Fonte e CRF* e *Infraestrutura*. As subcategorias críticas mais frequentes: **concordância entre dados fonte × CRF × relatório**, **procedimentos para manuseio de registros eletrônicos** e **histórico do participante**. As maiores mais frequentes: **treinamento e educação continuada** e **manuseio dos dados dos participantes**.

**Patrocinadores/ORPCs (Guia 36):** críticos e maiores concentram-se em *Procedimentos Operacionais*, com destaque para **sistemas utilizados para controle e gerenciamento dos estudos**, **gerenciamento de dados** e **desenho da CRF**; alguns críticos em *Infraestrutura*.

**Implicação para o TrialScale:** essa é a melhor evidência externa disponível para calibrar os pesos da priorização e para justificar quais artefatos são **essenciais** e não complementares. Sugestão concreta: no catálogo CPC, elevar a essencial tudo o que sustenta a concordância fonte–CRF, o manuseio de registros eletrônicos e o registro de treinamento; no catálogo ORPC, tudo o que sustenta validação de sistemas e gestão de dados.

### 2.2 Achados por processo do catálogo CPC — artefatos e DoDs a ajustar

**Processo 7 — Gerenciar equipe**
Achados: um funcionário responsável por mais de 20 estudos, sem backups; ausência de registro de treinamento em procedimentos do estudo; atividade específica não descrita claramente na lista de delegação; **funcionário não delegado executou atividades do estudo**.
- Ajustar DoD do delegation form: as atividades devem estar **claramente descritas**, e o centro deve avaliar se as atividades listadas (frequentemente padronizadas pelo patrocinador/ORPC) contemplam o que cada pessoa efetivamente faz — solicitando esclarecimento por escrito em caso de dúvida.
- Elevar a **essencial** o artefato de avaliação de capacidade antes do aceite de novo estudo, com DoD explícito: a avaliação considera **número de colaboradores × número de estudos × número de participantes incluídos**, e a existência de **backups preparados** para as funções.
- Acrescentar artefato: **fluxo de entrada e saída de colaborador no estudo** — DoD: procedimento que garante treinamento e delegação antes de qualquer atividade e atualização até a saída.

**Processo 2.5 — Gerenciar produto sob investigação**
Achados: armários do produto sem acesso restrito; controle de temperatura ambiente não realizado **dentro do armário** onde o produto estava armazenado; falta de controle de estoque de suprimentos (kits, testes de gravidez); **ausência de registro de temperatura nos fins de semana e feriados, sem plano de contingência para excursão nesse período**; ausência de farmacêutico responsável.
- Ajustar DoD do registro de temperatura: cobertura **contínua, incluindo fins de semana e feriados**, com plano de contingência aplicável a esses períodos, e ponto de medição **no local efetivo de armazenamento**.
- Acrescentar artefato **[A] essencial**: farmacêutico responsável pelo gerenciamento do produto sob investigação — DoD: pelo menos um farmacêutico na equipe do estudo responde por armazenamento, dispensação, preparo e transporte, conforme a **Resolução CFF nº 509/2009, art. 3º, III**, que define essas atividades como atribuição privativa do farmacêutico em pesquisa clínica.

**Processo 8 — Gerenciar infraestrutura**
Achados: arquivo do investigador sem acesso restrito e sem certificado contra incêndio nem plano de contingência documentado; **carrinho de emergência** com medicações vencidas, ausência de medicamentos essenciais conforme diretrizes da **Sociedade Brasileira de Cardiologia**, discrepância entre lista e frascos, problemas no teste de carga e descarga do desfibrilador, e carrinho **não localizado no mesmo local** onde o produto era administrado; certificado de acreditação de laboratório local vencido; ausência de calibração; **inconsistências nos certificados de calibração** (erro de informação, desvios sem avaliação de impacto, faixa de temperatura calibrada diferente da usada no estudo); falta de correlação entre equipamento usado e certificado; salas de monitoria insuficientes; ausência de contrato com UTI móvel em centro sem UTI própria.
- Acrescentar artefatos essenciais: **carrinho de emergência conforme diretrizes da SBC**, com conferência periódica registrada e localização no ponto de atendimento; **contrato vigente de UTI móvel** para centros sem UTI própria, vigente antes do início do recrutamento; **plano de contingência do arquivo** (incêndio, enchente, pragas) com acesso restrito documentado.
- Ajustar DoD da calibração: além de existir, o certificado deve passar por **análise crítica** (informações corretas, faixa calibrada compatível com o uso no estudo, desvios com avaliação de impacto) e o **número de série ou modelo do equipamento usado deve estar documentado nos arquivos do estudo**, permitindo correlação equipamento–certificado–exame.
- Acrescentar artefato: **controle de vigência de certificados de terceiros** (acreditação de laboratório local), verificado antes do início e monitorado durante o estudo.

**Processos 2.3 e 2.4 — Conduzir visita e Preencher CRF** *(a categoria que mais reprova)*
Achados: adendos e dados inseridos de forma **não contemporânea**, incluindo horários de coleta e de administração, sem evidência que os embase; templates de prontuário discrepantes do protocolo, com campos em branco e entrada retroativa; ausência de registro de cálculos exigidos pelo protocolo (parâmetros, aderência); **assinaturas e rubricas em documento fonte diferentes das constantes na lista de delegação**; discrepâncias entre documentos fonte; exames de imagem sem data; **traçados de ECG em papel térmico sem cópias certificadas**; resultados fora da normalidade não avaliados quanto à significância clínica, ou avaliados tardiamente; inconsistências fonte–CRF, **inclusive em páginas já bloqueadas para análise**; informações na CRF ausentes no documento fonte; CRF bloqueada sem assinatura do investigador principal.
- Acrescentar artefato essencial: **procedimento de adendo em documento fonte** — DoD: adendos são feitos apenas quando embasados em outro documento fonte, com registro do fundamento (a Anvisa dá o exemplo aceitável: intensidade de anemia definida retroativamente a partir de resultado laboratorial do período).
- Acrescentar artefato essencial: **conferência de correspondência entre rubricas em documento fonte e lista de delegação**.
- Acrescentar artefato: **rotina de cópia certificada** para registros em mídia instável (papel térmico) e **identificação de data e visita** em exames e laudos.
- Acrescentar artefato: **fluxo de avaliação de resultados laboratoriais e de imagem** quanto à significância clínica, com prazo definido.
- Ajustar DoD da CRF: a CRF **não deve ser usada como documento fonte**, salvo quando claramente previsto e justificado no protocolo (item 6.4.9 do E6(R2)); e o bloqueio de páginas exige assinatura do investigador principal.

**Processo 12 — Gerenciar processos (POPs e sistema de qualidade)** *(maior fonte de achados maiores)*
Achados: POPs sem campo de referências; **datas de vigência e revisão não padronizadas** (uns com mês/ano, outros com dia/mês/ano) ou discrepantes entre si (data de aprovação anterior à de elaboração); tempo de efetividade muito curto; abrangência restrita à gerência; **ausência de rastreabilidade da elaboração até a aprovação**; ausência de treinamento nos POPs; ausência de sistema de qualidade ou sistema ineficiente.
- Ajustar o DoD do controle de documentos usando os requisitos que a própria Anvisa lista (itens "p" a "u" do item 8.4.1 do Guia nº 35/2020): existência e aderência aos procedimentos; controle de versão e histórico de alterações; **registro de treinamento da equipe nos procedimentos vigentes**; disponibilidade e acessibilidade; atualização e frequência de revisões **comprovadas por lista mestra**; e **arquivo histórico dos procedimentos substituídos**.
- Elevar a essencial o **registro de treinamento nos POPs** — é a subcategoria com maior frequência de achados maiores em centros.

**Processos 1.4, 3.2 e 3.3 — Aprovações, desvios e manutenção ética**
Achados: desvios reportados ao CEP muito tempo depois da ocorrência ou em desacordo com o próprio POP do centro; atraso na notificação de eventos adversos graves ao CEP; **ausência de documentação atestando isenção de voto de membro da equipe do estudo que também era membro do CEP**; contrato entre patrocinador e investigador assinado **após** o início do estudo.
- Acrescentar artefato essencial de alto valor, com a recomendação literal da Anvisa: **fluxo próprio de detecção de desvios pelo centro**, não dependente da monitoria — DoD: quem realiza entrada de dados repassa ao responsável pela submissão ao CEP todos os desvios identificados no preenchimento (visitas não realizadas, visitas atrasadas, aderência fora do previsto). A Agência é explícita: não reportar ao CEP apenas os desvios detectados pelos monitores, já que a verificação deles é amostral e sujeita a erro — e o fluxo próprio garante autonomia e independência ao centro.
- Acrescentar artefato: **declaração de isenção de voto** quando membro da equipe do estudo integrar o CEP.
- Ajustar DoD dos contratos: assinatura **antes** do início do estudo, com conferência prévia dos documentos regulatórios mínimos.

**Processos 2.7 e 8 — Amostras biológicas**
Achados: problemas no controle e envio de amostras ao exterior; local inadequado para armazenamento de kits; **processamento não realizado conforme o manual do estudo, ou sem evidência de como foi realizado**.
- Ajustar DoD: rastreabilidade e **evidência de aderência ao manual de laboratório do estudo** em cada etapa, da obtenção ao envio.

**Processo 3.4 — Monitorias, auditorias e inspeções**
Enriquecimento direto: os critérios de seleção de estudos para inspeção estão publicados (Anexo 1 do relatório) e incluem estudos não inspecionados por outras agências, estudos com **populações vulneráveis**, estudos avaliados como complexos, medicamentos estratégicos para o país, resultados de inspeções anteriores e denúncia.
- Acrescentar artefato: **autoavaliação periódica contra as categorias dos Guias nº 35/2020 e nº 36/2020** — DoD: conferência documentada das categorias aplicáveis, com plano de ação para as lacunas. É a forma mais direta de preparar o centro para inspeção.

**Processo 3.1 — Eventos adversos**
Achados: notificação de eventos adversos graves ao patrocinador **fora do prazo**; ausência de avaliação detalhada de causalidade.
- Reforçar o DoD da avaliação de causalidade: registro **detalhado**, não apenas a classificação.

### 2.3 Achados por processo do catálogo ORPC — artefatos e DoDs a ajustar

**Gerenciar TI e sistemas validados** *(maior concentração de achados críticos e maiores de ORPC)*
Achados: **ausência de validação de sistemas eletrônicos** (CRF, IRT, TMF, ePRO); ausência de **validação específica para o ensaio inspecionado**, havendo apenas validação geral do sistema; documentação de validação **não arquivada no arquivo do patrocinador** (o fornecedor teve de fornecê-la aos inspetores); ausência de rastreabilidade entre dados inseridos pelo participante em ePRO e os dados na CRF; **funcionários com acesso a sistemas após saírem do estudo**; perfis de acesso incompatíveis com a função.
- Elevar a essencial e detalhar: **dossiê de validação por sistema e por estudo**, arquivado sob custódia da própria ORPC (não do fornecedor), com abordagem de validação baseada em avaliação de risco que considere o uso pretendido e o potencial de afetar a proteção dos participantes e a confiabilidade dos resultados.
- Acrescentar artefato essencial: **POP de uso dos sistemas computadorizados** cobrindo configuração, instalação, uso, testes de funcionalidade, coleta e processamento de dados, manutenção, segurança, controle de mudanças, backup e recuperação, contingência e desativação — com responsabilidades claras e treinamento dos usuários.
- Acrescentar artefato essencial: **gestão do ciclo de vida de acessos** — DoD: revogação de acesso na saída do estudo, perfis compatíveis com a função, lista mantida dos indivíduos autorizados a alterar dados, e trilha de auditoria que documente mudanças sem deleção do dado original.
- Acrescentar artefato: **rastreabilidade de dados reportados pelo participante** (ePRO) até a CRF.

**Gerenciar dados**
Achados: **desenho da CRF em desacordo com o protocolo** ou com campos limitados, impedindo o centro de reportar adequadamente; **dados de CRF alterados após a análise de dados** pelo patrocinador.
- Acrescentar artefato essencial: **revisão de conformidade da CRF ao protocolo antes da liberação em produção**, com registro de aprovação.
- Ajustar DoD do fechamento da base: alterações após a análise exigem controle formal e justificativa registrada.

**Monitorar estudo**
Achados: **plano de monitoria inadequado ou descumprimento do plano**; **ausência de relatórios para algumas visitas**; **desvios importantes não identificados pelo monitor**; ausência de evidência de que a infraestrutura do centro foi avaliada pela ORPC ou patrocinador; falha de comunicação entre centro e ORPC em ações críticas; ausência de registro de atas de reuniões em que assuntos críticos foram discutidos; ausência de evidência de que recomendações do Comitê de Monitoramento de Dados foram seguidas.
- Ajustar DoD do plano de monitoria com os elementos que a norma de referência exige: **estratégia de monitoria, responsabilidades de todas as partes, métodos utilizados e fundamentação de seu uso**, com ênfase em **dados e processos críticos** e atenção especial a aspectos que não são prática clínica rotineira.
- Elevar a essencial: **relatório escrito após cada visita ou comunicação relacionada ao ensaio** — sem exceção.
- Acrescentar artefato essencial: **evidência de avaliação da infraestrutura do centro**.
- Acrescentar artefato: **atas de reuniões de equipe do estudo** registrando decisões e instruções críticas.
- Acrescentar artefato: **acompanhamento documentado das recomendações de comitês independentes** (ex.: Comitê de Monitoramento de Dados), quando aplicável.

**Gerenciar suprimentos do estudo / produto sob investigação**
Achados: **impossibilidade de reconciliação global do produto sob investigação** por ausência de informação; inexistência de inventário geral do centro (do recebimento ao retorno); **ausência dos números dos kits nos formulários**, impedindo o controle de estoque; ausência de documentação sobre o tempo de estabilidade da amostra biológica em temperatura ambiente.
- Acrescentar artefato essencial: **reconciliação global do produto** por estudo, consolidando envio, recebimento, destino, devolução e destruição.
- Ajustar DoD do inventário: **inventário geral por centro** com identificação de kits, lotes, validade e códigos de alocação.

**Iniciar estudo (start-up) / Contratar**
Achados: **ausência de apólice de seguro desde o início do estudo**; **ausência de licenças sanitárias aplicáveis**; modelos de questionário do participante sem campo de assinatura ou identificação.
- Acrescentar aos critérios de ativação, como itens essenciais verificados **antes do recrutamento**: apólice de seguro vigente desde o início e licenças sanitárias aplicáveis disponíveis e vigentes.
- Acrescentar artefato: **conferência de conformidade dos instrumentos dirigidos ao participante** (campos de identificação e assinatura).

**Acompanhar aprovação ética** *(novo artefato derivado da Parte 1)*
- Acrescentar artefato essencial: **controle de resposta a diligências com prazo próprio** — DoD: a ORPC (ou o centro) responde a diligências dentro de prazo interno definido, monitorando o consumo do limite global de 20 dias úteis de suspensão, com registro. Justificativa: sob o Despacho nº 2/2026, a suspensão do prazo de análise corresponde ao tempo efetivamente usado por quem responde — a agilidade passou a ser variável sob controle da organização.
- Acrescentar artefato: **registro do enquadramento de risco do protocolo e da acreditação do CEP de referência**, verificado no start-up, dado que protocolos de risco elevado tramitam integralmente em CEP acreditado.
- Acrescentar artefato: **conferência independente da contagem de prazos** — DoD: como a contagem é hoje feita pelo próprio CEP com base em registros da Plataforma Brasil, a organização mantém seu próprio controle paralelo e rastreável.

---

## PARTE 3 — Itens a validar antes de publicar

1. **Números de dispositivos**: os artigos do Decreto nº 12.651/2025 citados (8º, 22, 37, 39, 40) e da Lei nº 14.874/2024 (14 §1º e §2º, 58 §4º, 60) vieram de fontes institucionais confiáveis, mas devem ser conferidos no texto oficial antes da publicação no CMS.
2. **Limite de 5 anos do fornecimento pós-estudo**: confirmar diretamente no texto da Lei.
3. **Resolução Inaep nº 2/2026**: obter e analisar; integra o conjunto de medidas de 2026 e não foi examinada aqui.
4. **Nota Técnica de classificação de risco (12/11/2025)**: obter para definir com precisão o que é "risco elevado" no conteúdo.
5. **Guias nº 35/2020 e nº 36/2020, versão 2**: obter os textos completos para a passada de conferência categoria por categoria recomendada em 2.0.
6. **Resolução CFF nº 509/2009**: confirmar a redação do art. 3º, III antes de publicar como exigência.
7. **Diretrizes da SBC para carrinho de emergência**: confirmar a referência aplicável e sua versão vigente.

---

## PARTE 4 — O que este episódio ensina sobre o produto

Este passe de atualização é, ele mesmo, a melhor prova de três decisões de concepção:

**O conteúdo regulatório precisa viver no CMS, versionado e atualizável.** Em menos de dois anos mudaram a lei, o decreto, a instância normativa nacional, os prazos de análise ética e a norma sanitária de ensaios clínicos. Conteúdo regulatório embutido em código seria um passivo.

**A "vigilância normativa" merece ser artefato de maturidade, com DoD verificável** — nos dois catálogos. Uma organização que não tem rotina de acompanhamento normativo estava, até hoje, operando com o arcabouço de 2020.

**O selo de origem provou seu valor.** Foi ele que permitiu localizar em minutos, entre milhares de linhas de conteúdo, exatamente o que precisava de revisão: os itens marcados como norma. Sem essa marcação, o passe de atualização exigiria reler tudo.

E acrescenta um requisito de produto que ainda não estava previsto: **o histórico de conteúdo precisa registrar a data da última verificação regulatória de cada artefato marcado como [A]**. Sem esse campo, não há como saber o que está defasado — e a plataforma perderia justamente a autoridade que a diferencia.

*Fim do documento de atualização regulatória 2026.*
