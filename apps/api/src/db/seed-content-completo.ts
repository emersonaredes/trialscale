/**
 * Seed do CATÁLOGO COMPLETO — os 23 processos restantes (decisão 2026-07-24:
 * "seed tudo e valido pelo CMS"), fiel a docs/conteudo/conteudo_processos_
 * centrais.md e conteudo_processos_suporte_gestao.md.
 *
 * ⚠️ CURADORIA PENDENTE (constituição §6): todo item [A] e toda classificação
 * E/C exigem validação humana — o usuário valida via CMS. Antes do beta com
 * centros reais, os [A] precisam de parecer regulatório.
 * Compartilhamentos entre processos (delegation, temperatura, templates de
 * EA etc.) ficam para a curadoria via CMS (placements cruzados).
 * Idempotente: pula processos que já têm versão publicada.
 */
import { contentService, type DraftGraphInput } from '../services/content-service'
import { contentRepository } from '../repositories/content-repository'

type Cls = 'essencial' | 'complementar'
interface A {
  key: string
  type: string
  title: string
  dod: string
  seals: string[]
  cls: Cls
  level: number
}
interface P {
  code: string
  level1: string
  artifacts: A[]
}

const E = 'essencial' as Cls
const C = 'complementar' as Cls

export const PROCESSOS_COMPLETO: P[] = [
  // ================= GRUPO 1 — STARTUP =================
  {
    code: '1.2',
    level1: 'Feasibilities respondidos de improviso, sem critério de avaliação de capacidade.',
    artifacts: [
      { key: 'fluxo-resposta-feasibility', type: 'ferramenta', title: 'Fluxo de resposta a feasibility conhecido', dod: 'Existe um responsável e um caminho para receber, avaliar e responder convites.', seals: ['T'], cls: E, level: 2 },
      { key: 'cda-modelo', type: 'ferramenta', title: 'CDA-modelo disponível', dod: 'Modelo de acordo de confidencialidade pronto para uso.', seals: ['T'], cls: C, level: 2 },
      { key: 'pop-feasibility', type: 'pop', title: 'POP de feasibility', dod: 'Procedimento aprovado, assinado, versionado, cobrindo recebimento, avaliação de viabilidade, definição de investigador e resposta ao questionário.', seals: ['T', 'G'], cls: E, level: 3 },
      { key: 'checklist-capacidade', type: 'ferramenta', title: 'Checklist de avaliação de capacidade', dod: 'Instrumento que confronta o desenho do estudo com RH, infraestrutura e perfil epidemiológico do centro.', seals: ['T'], cls: E, level: 3 },
      { key: 'criterios-selecao-pi', type: 'ferramenta', title: 'Critérios de seleção do PI documentados', dod: 'Regras para escolha do investigador principal por estudo.', seals: ['T'], cls: C, level: 3 },
      { key: 'indicador-aprovacao-recusa', type: 'indicador', title: 'Indicador medido: índice de aprovação/recusa', dod: 'Taxa de conversão de feasibilities acompanhada em rotina de gestão.', seals: ['T'], cls: E, level: 4 },
      { key: 'registro-decisoes-feasibility', type: 'registro', title: 'Registro de decisões de feasibility', dod: 'Histórico de convites recebidos, decisão (aceite/recusa) e justificativa.', seals: ['T', 'D'], cls: E, level: 4 },
      { key: 'vinculo-portfolio', type: 'ferramenta', title: 'Vínculo com a estratégia de portfólio', dod: 'Decisões de feasibility explicitamente conectadas às metas do portfólio de protocolos.', seals: ['T'], cls: C, level: 4 },
      { key: 'revisao-criterios-viabilidade', type: 'indicador', title: 'Revisão periódica dos critérios de viabilidade', dod: 'Análise que ajusta critérios com base no histórico de estudos aceitos e seu desempenho real.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  {
    code: '1.3',
    level1: 'Contratos aceitos sem análise estruturada de cláusulas ou custeio.',
    artifacts: [
      { key: 'responsavel-contrato', type: 'registro', title: 'Responsável por contrato/orçamento definido', dod: 'Pessoa/área que conduz a negociação identificada.', seals: ['T'], cls: E, level: 2 },
      { key: 'contratos-arquivados', type: 'registro', title: 'Contratos anteriores arquivados como referência', dod: 'Contratos assinados guardados e recuperáveis.', seals: ['T'], cls: C, level: 2 },
      { key: 'tabela-custos', type: 'ferramenta', title: 'Tabela de custos de procedimentos e equipamentos', dod: 'Tabela que permite custear um estudo, com valores por procedimento, revisada nos últimos 12 meses.', seals: ['T'], cls: E, level: 3 },
      { key: 'avaliacao-clausulas-criticas', type: 'ferramenta', title: 'Instrumento de avaliação de cláusulas críticas', dod: 'Checklist/guia de cláusulas contratuais sensíveis (pagamento, responsabilidade, rescisão, propriedade de dados) usado na análise.', seals: ['T', 'G'], cls: E, level: 3 },
      { key: 'pop-contrato-orcamento', type: 'pop', title: 'POP de aprovação de contrato e orçamento', dod: 'Procedimento aprovado, assinado, versionado, do recebimento à assinatura.', seals: ['T'], cls: E, level: 3 },
      { key: 'alcada-juridica', type: 'ferramenta', title: 'Alçada jurídica/institucional mapeada', dod: 'Quem assina o quê e limites de aprovação definidos. (Regras jurídicas variam por instituição.)', seals: ['A'], cls: C, level: 3 },
      { key: 'indicadores-tempo-margem', type: 'indicador', title: 'Indicadores medidos: tempo de aprovação e margem', dod: 'Tempo por fase e margem execução×negociado acompanhados.', seals: ['T'], cls: E, level: 4 },
      { key: 'modelo-contrato-base', type: 'ferramenta', title: 'Modelo de contrato base próprio', dod: 'Minuta-base do centro para acelerar negociações (do PIC).', seals: ['T'], cls: C, level: 4 },
      { key: 'rentabilidade-retroalimenta', type: 'indicador', title: 'Análise de rentabilidade retroalimenta a tabela de custos', dod: 'Comparação periódica entre orçado e realizado ajusta a precificação.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  {
    code: '1.4',
    level1: 'Submissões preparadas caso a caso, com retrabalho e pendências frequentes.',
    artifacts: [
      { key: 'plataforma-brasil', type: 'infraestrutura', title: 'Acesso e uso da Plataforma Brasil', dod: 'Centro submete via Plataforma Brasil com responsável habilitado.', seals: ['A'], cls: E, level: 2 },
      { key: 'modelos-regulatorios-reunidos', type: 'ferramenta', title: 'Modelos de documentos regulatórios reunidos', dod: 'Cartas e declarações-padrão disponíveis.', seals: ['T'], cls: C, level: 2 },
      { key: 'pop-submissao-etica', type: 'pop', title: 'POP de submissão ética', dod: 'Procedimento aprovado, assinado, versionado, cobrindo preparo do pacote, submissão, acompanhamento e resposta a pendências, aderente às regras do CEP local. (Validação: fluxo CEP/CONEP e áreas temáticas especiais.)', seals: ['T', 'A'], cls: E, level: 3 },
      { key: 'conjunto-modelos-documentos', type: 'ferramenta', title: 'Conjunto completo de modelos de documentos', dod: 'Carta de submissão, declaração de infraestrutura, anuência e responsabilidade do investigador, versionados.', seals: ['T'], cls: E, level: 3 },
      { key: 'checklist-pacote-regulatorio', type: 'ferramenta', title: 'Checklist de pacote regulatório', dod: 'Lista de conferência antes de submeter.', seals: ['T'], cls: C, level: 3 },
      { key: 'indicadores-aprovacao-pendencias', type: 'indicador', title: 'Indicadores medidos: tempo de aprovação e pendências por tipo', dod: 'Acompanhados por fase e categoria de pendência.', seals: ['T'], cls: E, level: 4 },
      { key: 'base-pendencias-recorrentes', type: 'registro', title: 'Base de pendências recorrentes', dod: 'Registro das pendências mais comuns para prevenir na origem.', seals: ['G'], cls: C, level: 4 },
      { key: 'prevencao-pendencias', type: 'indicador', title: 'Prevenção de pendências alimentada pelo histórico', dod: 'Ajustes no preparo do pacote reduzem pendências ao longo do tempo, evidenciados por dado.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  {
    code: '1.5',
    level1: 'Início do estudo sem alinhamento estruturado; equipe aprende "fazendo".',
    artifacts: [
      { key: 'reuniao-alinhamento-startup', type: 'treinamento', title: 'Reunião de alinhamento de equipe no startup', dod: 'Reunião com PI, coordenação e equipe clínica acontece antes do primeiro participante.', seals: ['T'], cls: E, level: 2 },
      { key: 'materiais-recebidos-conferidos', type: 'registro', title: 'Materiais do estudo recebidos e conferidos', dod: 'Registro de recebimento dos materiais do protocolo.', seals: ['T'], cls: C, level: 2 },
      { key: 'pop-startup', type: 'pop', title: 'POP/checklist de startup de protocolo', dod: 'Procedimento aprovado, assinado, versionado, cobrindo treinamentos, setup de sistemas, definição de equipe e visita de iniciação.', seals: ['T', 'G'], cls: E, level: 3 },
      { key: 'delegation-log-inicial', type: 'registro', title: 'Delegation log inicial preenchido', dod: 'Delegação definida e assinada antes do início (compartilhado com 7 — curadoria).', seals: ['T'], cls: E, level: 3 },
      { key: 'guia-visitas-protocolo', type: 'ferramenta', title: 'Guia/checklist de atendimento de visitas do protocolo', dod: 'Roteiro das visitas do estudo disponível à equipe.', seals: ['T'], cls: E, level: 3 },
      { key: 'metas-prazos-registrados', type: 'registro', title: 'Metas e prazos realistas registrados', dod: 'Metas de inclusão e prazos definidos com a equipe.', seals: ['T'], cls: C, level: 3 },
      { key: 'indicador-treinados-ativacao', type: 'indicador', title: 'Indicador medido: membros treinados na ativação', dod: 'Cobertura de treinamento por protocolo acompanhada.', seals: ['T'], cls: E, level: 4 },
      { key: 'setup-sistemas-padronizado', type: 'ferramenta', title: 'Setup de sistemas padronizado', dod: 'Rotina de configuração de eCRF/IWRS e demais sistemas por estudo.', seals: ['T'], cls: C, level: 4 },
      { key: 'licoes-startup', type: 'indicador', title: 'Lições de startup incorporadas', dod: 'Aprendizados de ativações anteriores revisados e aplicados aos próximos startups.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  {
    code: '1.6',
    level1: 'Pré-triagem improvisada, sem estratégia por origem nem aprovação das abordagens.',
    artifacts: [
      { key: 'estrategia-recrutamento-estudo', type: 'ferramenta', title: 'Estratégia de recrutamento definida por estudo', dod: 'Como e onde buscar candidatos definido no início do protocolo.', seals: ['T'], cls: E, level: 2 },
      { key: 'materiais-divulgacao-cep', type: 'registro', title: 'Materiais de divulgação submetidos ao CEP', dod: 'Peças de recrutamento com aprovação ética quando exigido.', seals: ['A'], cls: C, level: 2 },
      { key: 'pop-pre-triagem', type: 'pop', title: 'POP de pré-triagem', dod: 'Procedimento aprovado, assinado, versionado, cobrindo fontes, abordagem, registro por origem e exames de pré-triagem, com aderência ética.', seals: ['T', 'G'], cls: E, level: 3 },
      { key: 'lista-pre-triagem-origem', type: 'ferramenta', title: 'Lista de pré-triagem gerenciada por origem', dod: 'Registro de candidatos com origem do referenciamento rastreável.', seals: ['T'], cls: E, level: 3 },
      { key: 'lgpd-candidatos', type: 'registro', title: 'Conformidade LGPD no uso de dados de candidatos', dod: 'Base legal e cuidados de privacidade no tratamento de dados de potenciais participantes definidos.', seals: ['A'], cls: C, level: 3 },
      { key: 'indicadores-origem-falha', type: 'indicador', title: 'Indicadores medidos: potenciais por origem e falha de triagem', dod: 'Métricas por origem acompanhadas para direcionar esforço.', seals: ['T'], cls: E, level: 4 },
      { key: 'analise-eficacia-canais', type: 'indicador', title: 'Análise de eficácia de canais', dod: 'Comparação de rendimento entre fontes de referenciamento.', seals: ['T'], cls: C, level: 4 },
      { key: 'otimizacao-canais-dados', type: 'indicador', title: 'Otimização de canais orientada por dados', dod: 'Investimento de recrutamento realocado conforme rendimento medido por origem.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  // ================= GRUPO 2 — CONDUÇÃO =================
  {
    code: '2.1',
    level1: 'Consentimento e triagem sem padronização; risco alto de desvio.',
    artifacts: [
      { key: 'tcle-versao-vigente', type: 'registro', title: 'Uso da versão vigente do TCLE/TALE aprovada pelo CEP', dod: 'Apenas a versão aprovada e vigente é utilizada; versões controladas.', seals: ['A'], cls: E, level: 2 },
      { key: 'checklist-elegibilidade', type: 'ferramenta', title: 'Checklist de elegibilidade em uso', dod: 'Critérios de inclusão/exclusão conferidos por instrumento.', seals: ['T'], cls: C, level: 2 },
      { key: 'pop-consentimento-inclusao', type: 'pop', title: 'POP de consentimento e inclusão', dod: 'Procedimento aprovado, assinado, versionado, cobrindo verificação de aptidão para consentir, aplicação do TCLE/TALE, registro do processo em documento fonte e inclusão no IWRS/IVRS, aderente à BPC e ao sistema CEP/CONEP. (Validação regulatória/ética.)', seals: ['T', 'A'], cls: E, level: 3 },
      { key: 'registro-consentimento-fonte', type: 'registro', title: 'Registro do processo de consentimento em documento fonte', dod: 'Cada consentimento com registro de como/quando foi obtido.', seals: ['T'], cls: E, level: 3 },
      { key: 'controle-versoes-tcle', type: 'ferramenta', title: 'Controle de versões de TCLE/TALE', dod: 'Histórico de versões aprovadas e qual foi aplicada a cada participante.', seals: ['T'], cls: C, level: 3 },
      { key: 'indicadores-meta-triagem', type: 'indicador', title: 'Indicadores medidos: meta de inclusão e falha de triagem', dod: 'Acompanhados em rotina de gestão.', seals: ['T'], cls: E, level: 4 },
      { key: 'status-participantes', type: 'ferramenta', title: 'Acompanhamento de status dos participantes', dod: 'Painel/registro do estágio de cada participante, atualizado.', seals: ['T'], cls: E, level: 4 },
      { key: 'indicador-desvios-bpc-recrutamento', type: 'indicador', title: 'Indicador de desvios de BPC no recrutamento', dod: 'Desvios ligados ao consentimento/triagem monitorados.', seals: ['T'], cls: C, level: 4 },
      { key: 'melhoria-falhas-triagem', type: 'indicador', title: 'Ações de melhoria orientadas por falhas de triagem e desvios', dod: 'Análise periódica gera mudanças no processo de recrutamento.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  {
    code: '2.2',
    level1: 'Visitas agendadas ad hoc; conflitos de sala/equipe frequentes.',
    artifacts: [
      { key: 'agenda-compartilhada', type: 'ferramenta', title: 'Agenda compartilhada de visitas', dod: 'Existe uma agenda única visível à equipe.', seals: ['T'], cls: E, level: 2 },
      { key: 'flowchart-acessivel', type: 'ferramenta', title: 'Flowchart do protocolo acessível', dod: 'Cronograma de visitas de cada estudo disponível.', seals: ['T'], cls: C, level: 2 },
      { key: 'pop-agendamento', type: 'pop', title: 'POP de agendamento de visitas', dod: 'Procedimento aprovado, assinado, versionado, cobrindo pré-agendamento, conciliação de agendas e preparação de visita conforme janelas.', seals: ['T', 'G'], cls: E, level: 3 },
      { key: 'visit-planner', type: 'ferramenta', title: 'Visit planner / ferramenta de planejamento', dod: 'Instrumento que aloca sala, equipe e recursos por visita.', seals: ['T'], cls: E, level: 3 },
      { key: 'planejamento-semanal', type: 'ferramenta', title: 'Planejamento semanal da equipe', dod: 'Escala semanal considerando visitas de todos os protocolos.', seals: ['T'], cls: C, level: 3 },
      { key: 'indicadores-reagendamento', type: 'indicador', title: 'Indicadores medidos: reagendamentos e desvios de janela', dod: 'Acompanhados com razões.', seals: ['T'], cls: E, level: 4 },
      { key: 'indicador-ociosidade', type: 'indicador', title: 'Indicador de uso/ociosidade de recursos', dod: 'Taxa de ocupação de salas/equipamentos monitorada.', seals: ['T'], cls: C, level: 4 },
      { key: 'otimizacao-capacidade', type: 'indicador', title: 'Otimização de capacidade orientada por dados', dod: 'Ajustes de escala e agenda reduzem conflitos e ociosidade, evidenciados por indicador.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  {
    code: '2.3',
    level1: 'Visitas conduzidas sem roteiro; registros incompletos ou tardios.',
    artifacts: [
      { key: 'documentos-fonte-visita', type: 'registro', title: 'Documentos fonte utilizados na visita', dod: 'Registro em documento fonte acontece em toda visita.', seals: ['T'], cls: E, level: 2 },
      { key: 'kits-preparados', type: 'registro', title: 'Kits/insumos preparados antes da visita', dod: 'Preparação prévia da visita ocorre.', seals: ['T'], cls: C, level: 2 },
      { key: 'pop-conducao-visita', type: 'pop', title: 'POP de condução de visita', dod: 'Procedimento aprovado, assinado, versionado, cobrindo preparação, execução, registro em documento fonte, EA e medicação concomitante, e programação da próxima visita.', seals: ['T', 'G'], cls: E, level: 3 },
      { key: 'checklist-visita', type: 'ferramenta', title: 'Checklist de visita e pré-visita', dod: 'Roteiro conferido por visita.', seals: ['T'], cls: E, level: 3 },
      { key: 'templates-registro-visita', type: 'ferramenta', title: 'Templates de registro (visita, EA, medicação concomitante)', dod: 'Modelos padronizados em uso (compartilha com 3.1 — curadoria).', seals: ['T'], cls: E, level: 3 },
      { key: 'alcoa', type: 'treinamento', title: 'Boas práticas de documentação (ALCOA)', dod: 'Princípios de qualidade de dado-fonte conhecidos e aplicados.', seals: ['G'], cls: C, level: 3 },
      { key: 'indicadores-desvios-retencao', type: 'indicador', title: 'Indicadores medidos: desvios em visita e retenção', dod: 'Acompanhados por tipo em rotina de gestão.', seals: ['T'], cls: E, level: 4 },
      { key: 'analise-causas-desvio-visita', type: 'indicador', title: 'Análise de causas de desvio de visita', dod: 'Desvios classificados por causa (janela, procedimento, dose, delegation).', seals: ['T'], cls: C, level: 4 },
      { key: 'melhoria-experiencia-participante', type: 'indicador', title: 'Melhoria contínua da experiência do participante', dod: 'Ações para aderência/retenção definidas a partir de indicadores.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  {
    code: '2.4',
    level1: 'Dados lançados com atraso e muitas queries; sem padrão de imputação.',
    artifacts: [
      { key: 'responsavel-prazo-dados', type: 'registro', title: 'Responsável e prazo de entrada de dados conhecidos', dod: 'Quem lança e em que prazo está definido.', seals: ['T'], cls: E, level: 2 },
      { key: 'acesso-crf', type: 'infraestrutura', title: 'Acesso ao sistema de CRF configurado', dod: 'Equipe com acesso e credenciais ao eCRF do estudo.', seals: ['T'], cls: C, level: 2 },
      { key: 'pop-crf', type: 'pop', title: 'POP de preenchimento de CRF', dod: 'Procedimento aprovado, assinado, versionado, cobrindo separação de fonte, imputação, submissão e resposta a queries.', seals: ['T', 'G'], cls: E, level: 3 },
      { key: 'guia-imputacao', type: 'ferramenta', title: 'Guia de imputação de dados', dod: 'Instruções de como preencher campos-chave do CRF.', seals: ['T'], cls: E, level: 3 },
      { key: 'verificacao-fonte-crf', type: 'ferramenta', title: 'Prática de verificação fonte×CRF', dod: 'Conferência entre documento fonte e dado lançado definida.', seals: ['G'], cls: C, level: 3 },
      { key: 'indicadores-tempo-queries', type: 'indicador', title: 'Indicadores medidos: tempo de preenchimento e queries por tipo', dod: 'Acompanhados em rotina.', seals: ['T'], cls: E, level: 4 },
      { key: 'analise-causas-queries', type: 'indicador', title: 'Análise de causas de queries', dod: 'Queries classificadas para prevenir recorrência.', seals: ['T'], cls: C, level: 4 },
      { key: 'reducao-queries', type: 'indicador', title: 'Redução de queries orientada por dados', dod: 'Ações preventivas reduzem taxa de queries ao longo do tempo.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  {
    code: '2.6',
    level1: 'Materiais sem controle; faltas surpreendem a equipe.',
    artifacts: [
      { key: 'local-armazenamento', type: 'infraestrutura', title: 'Local de armazenamento definido', dod: 'Materiais guardados em local próprio conhecido.', seals: ['T'], cls: E, level: 2 },
      { key: 'conferencia-recebimento-materiais', type: 'registro', title: 'Conferência de recebimento', dod: 'Remessas conferidas na chegada.', seals: ['T'], cls: C, level: 2 },
      { key: 'pop-materiais', type: 'pop', title: 'POP de gestão de materiais', dod: 'Procedimento aprovado, assinado, versionado, cobrindo recebimento, armazenamento, controle, ressuprimento e descarte, com rastreabilidade.', seals: ['T', 'G'], cls: E, level: 3 },
      { key: 'controle-estoque-materiais', type: 'ferramenta', title: 'Controle de estoque em uso', dod: 'Registro de entradas, saídas e saldo por item/kit.', seals: ['T'], cls: E, level: 3 },
      { key: 'regras-armazenamento-transporte', type: 'ferramenta', title: 'Regras de armazenamento e transporte documentadas', dod: 'Condições por tipo de material definidas.', seals: ['T'], cls: C, level: 3 },
      { key: 'indicadores-estoque-faltas', type: 'indicador', title: 'Indicadores medidos: nível de estoque e visitas adiadas por falta', dod: 'Acompanhados; ponto de ressuprimento definido.', seals: ['T'], cls: E, level: 4 },
      { key: 'alerta-estoque-minimo', type: 'ferramenta', title: 'Alerta de estoque mínimo', dod: 'Gatilho de reposição antes da ruptura.', seals: ['T'], cls: C, level: 4 },
      { key: 'previsao-consumo-agenda', type: 'indicador', title: 'Previsão de consumo a partir da agenda', dod: 'Reposição planejada com base na agenda de visitas futura.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  {
    code: '2.7',
    level1: 'Coleta e envio sem procedimento; perdas por manuseio/transporte.',
    artifacts: [
      { key: 'fluxo-coleta-envio', type: 'ferramenta', title: 'Fluxo de coleta e envio conhecido', dod: 'Equipe sabe coletar, preparar e enviar dentro dos prazos do courier.', seals: ['T'], cls: E, level: 2 },
      { key: 'controle-basico-amostras', type: 'registro', title: 'Controle básico de amostras', dod: 'Registro do que foi coletado e enviado.', seals: ['T'], cls: C, level: 2 },
      { key: 'pop-amostras', type: 'pop', title: 'POP de manejo de amostras', dod: 'Procedimento aprovado, assinado, versionado, cobrindo coleta, processamento, armazenamento, envio e controle de qualidade, aderente às regras de transporte (IATA/ANVISA). (Validação: transporte de material biológico.)', seals: ['T', 'A'], cls: E, level: 3 },
      { key: 'controle-amostras-rastreavel', type: 'ferramenta', title: 'Controle de amostras rastreável', dod: 'Cada amostra rastreável da coleta ao resultado.', seals: ['T'], cls: E, level: 3 },
      { key: 'treinamento-iata', type: 'treinamento', title: 'Equipe com treinamento IATA vigente', dod: 'Quem manuseia/envia possui certificação IATA válida (compartilha com 7 — curadoria).', seals: ['A'], cls: C, level: 3 },
      { key: 'indicadores-perdas-tempo', type: 'indicador', title: 'Indicadores medidos: amostras perdidas e tempo do processo', dod: 'Acompanhados em rotina.', seals: ['T'], cls: E, level: 4 },
      { key: 'controle-condicoes-armazenamento', type: 'registro', title: 'Controle de condições de armazenamento', dod: 'Temperatura de armazenamento de amostras registrada (compartilha com 8 — curadoria).', seals: ['T'], cls: E, level: 4 },
      { key: 'gestao-prazos-courier', type: 'ferramenta', title: 'Gestão de prazos do courier', dod: 'Janelas de envio controladas para não perder estabilidade.', seals: ['T'], cls: C, level: 4 },
      { key: 'padroes-biobanco', type: 'registro', title: 'Aderência a padrões internacionais (biobanco)', dod: 'Centros com biobanco atendem ISBER/ISO 15189 documentadamente.', seals: ['G'], cls: C, level: 5 },
      { key: 'reducao-perdas', type: 'indicador', title: 'Redução de perdas orientada por dados', dod: 'Análise de perdas gera ações corretivas.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  {
    code: '2.8',
    level1: 'Exclusões sem registro estruturado nem notificação padronizada.',
    artifacts: [
      { key: 'registro-exclusao-prontuario', type: 'registro', title: 'Registro de exclusão no prontuário', dod: 'Toda saída registrada no documento fonte.', seals: ['T'], cls: E, level: 2 },
      { key: 'motivo-saida', type: 'registro', title: 'Motivo da saída identificado', dod: 'Causa registrada para cada exclusão.', seals: ['T'], cls: C, level: 2 },
      { key: 'pop-exclusao', type: 'pop', title: 'POP de exclusão de participante', dod: 'Procedimento aprovado, assinado, versionado, cobrindo registro, notificação a patrocinador/participante/CEP e conduta de acompanhamento pós-estudo.', seals: ['T', 'A'], cls: E, level: 3 },
      { key: 'fluxo-comunicacao-cep', type: 'ferramenta', title: 'Fluxo de comunicação ao CEP definido', dod: 'Notificação e relatório parcial ao CEP padronizados.', seals: ['T'], cls: C, level: 3 },
      { key: 'indicadores-retencao-motivos', type: 'indicador', title: 'Indicadores medidos: retenção e motivos de exclusão', dod: 'Acompanhados para orientar ações de retenção.', seals: ['T'], cls: E, level: 4 },
      { key: 'tentativa-retencao', type: 'ferramenta', title: 'Tentativa estruturada de retenção', dod: 'Abordagem de retenção antes de efetivar a saída, quando aplicável.', seals: ['G'], cls: C, level: 4 },
      { key: 'acoes-retencao-motivos', type: 'indicador', title: 'Ações de retenção orientadas por motivos', dod: 'Causas de saída geram melhorias que reduzem exclusões evitáveis.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  // ================= GRUPO 3 — QUALIDADE =================
  {
    code: '3.1',
    level1: 'EA registrados de forma inconsistente; prazos de notificação não controlados.',
    artifacts: [
      { key: 'ea-registrados-notificados', type: 'registro', title: 'EA registrados e notificados', dod: 'Eventos são registrados na evolução e notificados ao patrocinador/CEP quando aplicável.', seals: ['A'], cls: E, level: 2 },
      { key: 'template-ea', type: 'ferramenta', title: 'Template de acompanhamento de EA em uso', dod: 'Tabela/modelo de registro de EA disponível (compartilha com 2.3 — curadoria).', seals: ['T'], cls: C, level: 2 },
      { key: 'pop-eventos-adversos', type: 'pop', title: 'POP de gestão de eventos adversos', dod: 'Procedimento aprovado, assinado, versionado, cobrindo identificação, classificação (EA/EAG), graduação, avaliação de causalidade, intervenção, follow-up e reporte a CEP/CONEP e farmacovigilância, com prazos regulatórios. (Validação regulatória obrigatória.)', seals: ['T', 'A'], cls: E, level: 3 },
      { key: 'regras-classificacao-prazos', type: 'ferramenta', title: 'Regras de classificação e prazos documentadas', dod: 'Critérios de EA/EAG e prazos de notificação registrados e acessíveis.', seals: ['T'], cls: E, level: 3 },
      { key: 'fluxo-continuidade-participante', type: 'ferramenta', title: 'Fluxo de avaliação de continuidade do participante', dod: 'Como decidir manter/excluir após EA definido.', seals: ['T'], cls: C, level: 3 },
      { key: 'indicadores-ea-tempos', type: 'indicador', title: 'Indicadores medidos: EA por classificação e tempos dos EAG', dod: 'Acompanhados; cumprimento de prazos monitorado.', seals: ['T'], cls: E, level: 4 },
      { key: 'controle-prazos-notificacao', type: 'ferramenta', title: 'Controle de prazos de notificação', dod: 'Prazos regulatórios de reporte rastreados por evento.', seals: ['T'], cls: E, level: 4 },
      { key: 'indicador-desvios-ea', type: 'indicador', title: 'Indicador de desvios na gestão de EA', dod: 'Falhas no fluxo de EA monitoradas.', seals: ['T'], cls: C, level: 4 },
      { key: 'plano-melhoria-ea', type: 'indicador', title: 'Plano de melhoria a partir de EA', dod: 'Análise de eventos gera ações preventivas documentadas.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  {
    code: '3.2',
    level1: 'Desvios tratados informalmente, sem CAPA nem análise de causa.',
    artifacts: [
      { key: 'desvios-registrados', type: 'registro', title: 'Desvios registrados', dod: 'Desvios identificados são registrados em documento fonte.', seals: ['T'], cls: E, level: 2 },
      { key: 'notificacao-desvios', type: 'registro', title: 'Notificação de desvios relevantes', dod: 'Desvios notificados a patrocinador/CEP quando aplicável.', seals: ['A'], cls: C, level: 2 },
      { key: 'pop-desvios', type: 'pop', title: 'POP de gestão de desvios', dod: 'Procedimento aprovado, assinado, versionado, cobrindo identificação, classificação, registro, solução, CAPA e reporte a CEP/patrocinador.', seals: ['T', 'A'], cls: E, level: 3 },
      { key: 'log-desvios', type: 'ferramenta', title: 'Registro/log de desvios', dod: 'Todos os desvios em um controle único rastreável.', seals: ['T'], cls: E, level: 3 },
      { key: 'gestao-capa', type: 'ferramenta', title: 'Gestão de CAPA (ações preventivas e corretivas)', dod: 'Cada desvio relevante com plano de ação e acompanhamento até o fechamento.', seals: ['T'], cls: E, level: 3 },
      { key: 'indicadores-desvios-tempo', type: 'indicador', title: 'Indicadores medidos: desvios por tipo/causa e tempo de notificação', dod: 'Acompanhados em rotina de gestão.', seals: ['T'], cls: E, level: 4 },
      { key: 'analise-tendencias-desvio', type: 'indicador', title: 'Análise de tendências de desvio', dod: 'Padrões por equipe/protocolo/causa identificados.', seals: ['T'], cls: C, level: 4 },
      { key: 'prevencao-causa-raiz', type: 'indicador', title: 'Prevenção orientada por causa-raiz', dod: 'CAPAs recorrentes convertidas em melhorias de processo que reduzem desvios, evidenciado por indicador.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  {
    code: '3.3',
    level1: 'Emendas e relatórios enviados com atraso; equipe nem sempre ciente das mudanças.',
    artifacts: [
      { key: 'emendas-relatorios-cep', type: 'registro', title: 'Emendas e relatórios parciais submetidos ao CEP', dod: 'Obrigações periódicas ao CEP cumpridas, ainda que reativamente.', seals: ['A'], cls: E, level: 2 },
      { key: 'arquivo-processos-eticos', type: 'registro', title: 'Arquivo de processos éticos por protocolo', dod: 'Histórico ético do estudo guardado.', seals: ['T'], cls: C, level: 2 },
      { key: 'pop-manutencao-etica', type: 'pop', title: 'POP de manutenção ética e regulatória', dod: 'Procedimento aprovado, assinado, versionado, cobrindo emendas, notificações de segurança, relatórios parciais/final e comunicação à equipe, aderente às regras do CEP local.', seals: ['T', 'A'], cls: E, level: 3 },
      { key: 'controle-obrigacoes-prazos', type: 'ferramenta', title: 'Controle de obrigações e prazos regulatórios', dod: 'Calendário de relatórios/emendas com prazos por protocolo.', seals: ['T'], cls: E, level: 3 },
      { key: 'fluxo-atualizacao-equipe', type: 'treinamento', title: 'Fluxo de atualização da equipe sobre mudanças', dod: 'Alterações de protocolo comunicadas e treinadas (compartilha com 7 — curadoria).', seals: ['T'], cls: E, level: 3 },
      { key: 'checklist-emenda', type: 'ferramenta', title: 'Checklist de pacote de emenda', dod: 'Conferência padrão para submissão de emendas.', seals: ['T'], cls: C, level: 3 },
      { key: 'indicadores-cep-tempos', type: 'indicador', title: 'Indicadores medidos: solicitações ao CEP por tipo e tempos', dod: 'Acompanhados por fase.', seals: ['T'], cls: E, level: 4 },
      { key: 'painel-status-regulatorio', type: 'ferramenta', title: 'Painel de status regulatório do portfólio', dod: 'Visão consolidada da situação ética de todos os protocolos.', seals: ['T'], cls: C, level: 4 },
      { key: 'prevencao-pendencias-atrasos', type: 'indicador', title: 'Prevenção de pendências e atrasos por dado', dod: 'Histórico orienta melhorias que reduzem tempo/pendências.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  {
    code: '3.4',
    level1: 'Monitorias enfrentadas sem preparo; pendências resolvidas com atraso.',
    artifacts: [
      { key: 'fonte-disponivel-visita', type: 'registro', title: 'Documentos fonte disponibilizados na visita', dod: 'Acesso à documentação garantido ao monitor.', seals: ['T'], cls: E, level: 2 },
      { key: 'registro-visitas-monitoria', type: 'registro', title: 'Registro das visitas de monitoria', dod: 'Histórico de visitas e relatórios guardado.', seals: ['T'], cls: C, level: 2 },
      { key: 'pop-monitorias', type: 'pop', title: 'POP de monitorias, auditorias e inspeções', dod: 'Procedimento aprovado, assinado, versionado, cobrindo agendamento, preparação, acompanhamento, recebimento e resposta a relatórios.', seals: ['T', 'G'], cls: E, level: 3 },
      { key: 'checklist-preparacao-visita', type: 'ferramenta', title: 'Checklist de preparação/agendamento', dod: 'Roteiro de preparação do centro para cada visita.', seals: ['T'], cls: E, level: 3 },
      { key: 'fluxo-pendencias-capa', type: 'ferramenta', title: 'Fluxo de resolução de pendências (com CAPA)', dod: 'Pendências convertidas em ações rastreadas até o fechamento (compartilha com 3.2 — curadoria).', seals: ['T'], cls: E, level: 3 },
      { key: 'autoinspecao-mock', type: 'ferramenta', title: 'Prática de autoinspeção/mock', dod: 'Revisão interna prévia às inspeções externas.', seals: ['G'], cls: C, level: 3 },
      { key: 'indicadores-prazo-pendencias', type: 'indicador', title: 'Indicadores medidos: prazo de resposta e resolução de pendências', dod: 'Acompanhados por visita.', seals: ['T'], cls: E, level: 4 },
      { key: 'analise-achados-recorrentes', type: 'indicador', title: 'Análise de achados recorrentes', dod: 'Pendências classificadas para prevenção.', seals: ['T'], cls: C, level: 4 },
      { key: 'prevencao-achados-raiz', type: 'indicador', title: 'Prevenção de achados por causa-raiz', dod: 'Achados recorrentes eliminados na origem, evidenciado por queda em inspeções seguintes.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  // ================= ENCERRAMENTO =================
  {
    code: '4',
    level1: 'Encerramento informal; pendências financeiras e de arquivo ficam soltas.',
    artifacts: [
      { key: 'close-out-registrado', type: 'registro', title: 'Visita de close-out realizada e registrada', dod: 'Close-out acontece com registro.', seals: ['T'], cls: E, level: 2 },
      { key: 'supply-retornado', type: 'registro', title: 'Materiais e PI retornados/destruídos', dod: 'Supply remanescente devolvido ou destruído com registro.', seals: ['T'], cls: C, level: 2 },
      { key: 'pop-encerramento', type: 'pop', title: 'POP de encerramento de protocolo', dod: 'Procedimento aprovado, assinado, versionado, cobrindo revisão pré close-out, visita, reconciliação, destruição/retorno de supply, carta de ciência do CEP e arquivamento.', seals: ['T', 'G'], cls: E, level: 3 },
      { key: 'arquivamento-retencao', type: 'registro', title: 'Arquivamento do investigador conforme período de retenção', dod: 'Documentação arquivada pelo prazo exigido, em local seguro e recuperável. (Validação: período de retenção aplicável.)', seals: ['T', 'A'], cls: E, level: 3 },
      { key: 'reconciliacao-final', type: 'ferramenta', title: 'Reconciliação financeira final', dod: 'Conferência de pagamentos realizados e pendentes concluída antes do encerramento.', seals: ['T'], cls: E, level: 3 },
      { key: 'conduta-pos-estudo', type: 'ferramenta', title: 'Definição de conduta pós-estudo ao participante', dod: 'Tratamento/encaminhamento pós-estudo avaliado quando aplicável.', seals: ['T'], cls: C, level: 3 },
      { key: 'indicadores-tempos-closeout', type: 'indicador', title: 'Indicadores medidos: tempos de close-out', dod: 'Tempo entre última visita e close-out acompanhado.', seals: ['T'], cls: E, level: 4 },
      { key: 'checklist-encerramento', type: 'ferramenta', title: 'Checklist de encerramento', dod: 'Roteiro completo de close-out conferido.', seals: ['T'], cls: C, level: 4 },
      { key: 'registro-publicacoes', type: 'registro', title: 'Registro de publicações/resultados gerados', dod: 'Produção científica derivada do estudo registrada.', seals: ['T'], cls: C, level: 5 },
      { key: 'licoes-encerramento', type: 'indicador', title: 'Lições de encerramento retroalimentam o ciclo', dod: 'Aprendizados de close-out melhoram startups e conduções futuras.', seals: ['G'], cls: E, level: 5 },
    ],
  },
  // ================= SUPORTE (restantes) =================
  {
    code: '5',
    level1: 'Finanças misturadas (pessoal/institucional/protocolos), sem visão por estudo; cobrança só quando o patrocinador envia invoice.',
    artifacts: [
      { key: 'controle-basico-financeiro', type: 'ferramenta', title: 'Controle básico de recebimentos e pagamentos', dod: 'Registro simples (planilha) do que entrou e saiu, com responsável definido.', seals: ['T'], cls: E, level: 2 },
      { key: 'conta-separada', type: 'infraestrutura', title: 'Conta bancária/gestão separada para a operação de pesquisa', dod: 'Movimentação dos protocolos separável da instituição/pessoa física.', seals: ['D'], cls: C, level: 2 },
      { key: 'pop-financeiro', type: 'pop', title: 'POP financeiro', dod: 'Procedimento aprovado, assinado, com versão e data, cobrindo registro de execução, conferência, cobrança, recebimento e distribuição de pagamentos.', seals: ['G'], cls: E, level: 3 },
      { key: 'controle-por-protocolo', type: 'ferramenta', title: 'Controle financeiro por protocolo', dod: 'Cada lançamento classificado por protocolo, tipo (taxa/visita/reembolso/distribuição) e status, previsto × realizado.', seals: ['T'], cls: E, level: 3 },
      { key: 'controle-execucao-cobranca', type: 'ferramenta', title: 'Controle de execução de visitas e procedimentos para cobrança', dod: 'Tudo que foi executado (visitas, procedimentos, extras, condicionais) registrado e comparável ao contrato.', seals: ['T'], cls: E, level: 3 },
      { key: 'rotina-reembolso', type: 'ferramenta', title: 'Rotina de reembolso de participantes', dod: 'Valores reembolsáveis, forma de prestação de contas e instrução ao participante definidos e praticados — participante não tem ônus. (Validação ética: ressarcimento conforme CNS 466/2012.)', seals: ['T', 'A'], cls: E, level: 3 },
      { key: 'regras-distribuicao', type: 'ferramenta', title: 'Regras de distribuição de pagamentos documentadas', dod: 'Quem recebe o quê por procedimento/visita definido por escrito.', seals: ['T'], cls: C, level: 3 },
      { key: 'cobranca-ativa', type: 'ferramenta', title: 'Cobrança ativa com conciliação', dod: 'Solicitações de pagamento geradas pelo centro conforme periodicidade contratual, conciliadas com o controle do patrocinador.', seals: ['T'], cls: E, level: 4 },
      { key: 'fluxo-caixa-protocolo', type: 'indicador', title: 'Fluxo de caixa por protocolo acompanhado', dod: 'Saldo atual e projeção futura (participantes ativos × visitas futuras × valores) revisados em rotina de gestão.', seals: ['T'], cls: E, level: 4 },
      { key: 'indicadores-recebimento', type: 'indicador', title: 'Indicadores medidos: prazo médio de recebimento e inadimplência', dod: 'Prazo médio de recebimento e inadimplência por patrocinador registrados e revisados periodicamente.', seals: ['G'], cls: E, level: 4 },
      { key: 'moeda-estrangeira', type: 'ferramenta', title: 'Tratamento de recebimentos em moeda estrangeira', dod: 'Variação cambial e retenções de invoice consideradas no controle.', seals: ['T'], cls: C, level: 4 },
      { key: 'rotina-fiscal', type: 'ferramenta', title: 'Rotina fiscal', dod: 'Emissão de notas e obrigações fiscais da operação com fluxo definido.', seals: ['G'], cls: C, level: 4 },
      { key: 'rentabilidade-protocolo', type: 'indicador', title: 'Análise de rentabilidade por protocolo retroalimenta orçamentos', dod: 'Margem por protocolo calculada e usada nas negociações seguintes (taxas que cobrem custos ocultos).', seals: ['G'], cls: E, level: 5 },
      { key: 'integracao-execucao-financeiro', type: 'ferramenta', title: 'Integração execução→financeiro automatizada', dod: 'Visitas registradas geram automaticamente valores a receber (sistema integrado).', seals: ['T'], cls: C, level: 5 },
    ],
  },
  {
    code: '9',
    level1: 'Comunicação esporádica e reativa; sem presença digital consistente nem padrão interno.',
    artifacts: [
      { key: 'canais-basicos', type: 'infraestrutura', title: 'Canais básicos ativos', dod: 'Ao menos um canal externo (site ou rede social) existente e com informações corretas do centro.', seals: ['T'], cls: E, level: 2 },
      { key: 'comunicacao-interna', type: 'ferramenta', title: 'Rotina de comunicação interna', dod: 'Canal e ritmo definidos para a equipe (reuniões, mural, grupo).', seals: ['T'], cls: C, level: 2 },
      { key: 'plano-anual-comunicacao', type: 'ferramenta', title: 'Plano anual de comunicação', dod: 'Planilha/documento com temas, objetivo estratégico, público, canal e datas, aprovado.', seals: ['T'], cls: E, level: 3 },
      { key: 'aprovacao-etica-materiais', type: 'pop', title: 'Fluxo de aprovação ética de materiais a participantes', dod: 'Todo material de recrutamento/contato com participantes segue o protocolo ou passa por aprovação do CEP antes da veiculação, com registro. (Validação ética obrigatória.)', seals: ['A'], cls: E, level: 3 },
      { key: 'identidade-mensagens', type: 'ferramenta', title: 'Identidade e mensagens-padrão', dod: 'Apresentação institucional, descrição do centro e materiais com identidade única.', seals: ['G'], cls: C, level: 3 },
      { key: 'responsavel-comunicacao', type: 'registro', title: 'Responsável ou parceiro de comunicação definido', dod: 'Dono do processo nomeado (interno ou contratado).', seals: ['T'], cls: C, level: 3 },
      { key: 'indicador-engajamento', type: 'indicador', title: 'Indicador medido: engajamento por canal', dod: 'Métricas (cliques, respostas, alcance) registradas e revisadas em rotina.', seals: ['T'], cls: E, level: 4 },
      { key: 'monitoramento-interacao', type: 'ferramenta', title: 'Monitoramento e interação sistemáticos', dod: 'Mensagens e dúvidas do público respondidas em prazo definido.', seals: ['T'], cls: E, level: 4 },
      { key: 'segmentacao-publicos', type: 'ferramenta', title: 'Segmentação de públicos', dod: 'Conteúdos direcionados por persona/público (patrocinador × participante × comunidade).', seals: ['T'], cls: C, level: 4 },
      { key: 'avaliacao-retroalimenta', type: 'indicador', title: 'Avaliação de resultados retroalimenta o plano', dod: 'Análise periódica documentada ajusta temas, canais e investimento.', seals: ['G'], cls: E, level: 5 },
      { key: 'comunicacao-recrutamento', type: 'indicador', title: 'Comunicação integrada ao recrutamento', dod: 'Campanhas de recrutamento por protocolo com resultados medidos (candidatos gerados por canal).', seals: ['T'], cls: C, level: 5 },
    ],
  },
  // ================= GESTÃO =================
  {
    code: '10',
    level1: 'Sem orçamento; decisões de gasto caso a caso, olhando o saldo em conta.',
    artifacts: [
      { key: 'estrutura-custos', type: 'ferramenta', title: 'Estrutura de custos conhecida', dod: 'Custos fixos e principais variáveis listados, mesmo sem orçamento formal.', seals: ['T'], cls: E, level: 2 },
      { key: 'faturamento-previsto', type: 'ferramenta', title: 'Noção de faturamento previsto', dod: 'Estimativa simples de receita dos protocolos ativos.', seals: ['T'], cls: C, level: 2 },
      { key: 'orcamento-anual', type: 'ferramenta', title: 'Orçamento anual elaborado e aprovado', dod: 'Plano anual de despesas e receitas distribuído mensalmente, aprovado pela gestão/mantenedores.', seals: ['T'], cls: E, level: 3 },
      { key: 'pop-orcamentario', type: 'pop', title: 'POP/rito orçamentário', dod: 'Procedimento com calendário, responsáveis e critérios de elaboração, controle e revisão, aprovado.', seals: ['G'], cls: E, level: 3 },
      { key: 'premissas-precificacao', type: 'ferramenta', title: 'Premissas de precificação e overhead documentadas', dod: 'Base de custos usada para precificar procedimentos e overhead registrada (conecta com 1.3).', seals: ['P'], cls: C, level: 3 },
      { key: 'orcado-realizado', type: 'indicador', title: 'Controle mensal orçado × realizado', dod: 'Comparativo mensal com análise de desvios e ações registradas.', seals: ['T'], cls: E, level: 4 },
      { key: 'relatorios-gerenciais', type: 'ferramenta', title: 'Relatórios analítico-gerenciais periódicos', dod: 'Relatório para gestão/mantenedores em periodicidade definida.', seals: ['T'], cls: E, level: 4 },
      { key: 'indicadores-lucratividade', type: 'indicador', title: 'Indicadores medidos: lucratividade e liquidez', dod: 'Calculados e revisados em rotina de gestão.', seals: ['T'], cls: E, level: 4 },
      { key: 'revisao-orcamentaria', type: 'ferramenta', title: 'Revisão orçamentária formal', dod: 'Gatilhos e rito de revisão definidos e usados quando o cenário muda.', seals: ['T'], cls: C, level: 4 },
      { key: 'orcamento-cenarios', type: 'indicador', title: 'Orçamento orientado a cenários e estratégia', dod: 'Cenários (pessimista/base/otimista) e simulações sustentam decisões de investimento e aceite de estudos.', seals: ['G'], cls: E, level: 5 },
      { key: 'demonstracoes-financeiras', type: 'ferramenta', title: 'Demonstrações financeiras estruturadas', dod: 'DRE e fluxo de caixa consolidados do centro, com análise vertical/horizontal.', seals: ['T'], cls: C, level: 5 },
    ],
  },
  {
    code: '11',
    level1: 'Sem direcionamento formal; o centro reage às oportunidades que aparecem.',
    artifacts: [
      { key: 'objetivos-lideranca', type: 'registro', title: 'Objetivos conhecidos pela liderança', dod: 'Liderança sabe declarar as prioridades do centro, mesmo sem documento.', seals: ['T'], cls: E, level: 2 },
      { key: 'objetivos-stakeholders', type: 'registro', title: 'Objetivos dos stakeholders explicitados', dod: 'Expectativas de donos/mantenedores/instituição registradas.', seals: ['T'], cls: C, level: 2 },
      { key: 'diretrizes-documentadas', type: 'ferramenta', title: 'Diretrizes estratégicas documentadas', dod: 'Missão, visão e objetivos priorizados registrados e comunicados à equipe.', seals: ['T'], cls: E, level: 3 },
      { key: 'metas-smart', type: 'ferramenta', title: 'Metas SMART definidas', dod: 'Metas quantitativas com prazo, derivadas dos objetivos, aprovadas.', seals: ['T'], cls: E, level: 3 },
      { key: 'analise-ambiente', type: 'ferramenta', title: 'Análise de ambiente registrada', dod: 'SWOT/Canvas (ou equivalente) atualizado no ciclo vigente.', seals: ['T', 'P'], cls: C, level: 3 },
      { key: 'rito-monitoramento', type: 'ferramenta', title: 'Rito periódico de monitoramento', dod: 'Reunião de acompanhamento das metas com registro de status e ações (periodicidade definida).', seals: ['T'], cls: E, level: 4 },
      { key: 'indicador-projetos-estrategicos', type: 'indicador', title: 'Indicador medido: % de projetos estratégicos concluídos', dod: 'Projetos do plano acompanhados até a conclusão.', seals: ['T'], cls: E, level: 4 },
      { key: 'desdobramento-processos', type: 'ferramenta', title: 'Desdobramento em processos', dod: 'Cada meta ligada aos processos que a entregam (ponte formal com o processo 12).', seals: ['T'], cls: C, level: 4 },
      { key: 'ciclo-anual-revisao', type: 'indicador', title: 'Ciclo anual completo de revisão estratégica', dod: 'Revisão anual documentada de ambiente, metas e planos, retroalimentada pelos resultados.', seals: ['G'], cls: E, level: 5 },
      { key: 'posicionamento-revisitado', type: 'ferramenta', title: 'Posicionamento de mercado revisitado', dod: 'Foco e segmentação (do Design/PIC) reavaliados no ciclo.', seals: ['P'], cls: C, level: 5 },
    ],
  },
  {
    code: '12',
    level1: 'Cada pessoa trabalha do seu jeito; POPs inexistentes ou desatualizados e ignorados.',
    artifacts: [
      { key: 'rotinas-conhecidas', type: 'registro', title: 'Rotinas principais conhecidas', dod: 'A equipe sabe descrever como as principais atividades são feitas, mesmo sem documento.', seals: ['T'], cls: E, level: 2 },
      { key: 'responsavel-qualidade', type: 'registro', title: 'Responsável pela qualidade/processos identificado', dod: 'Dono nomeado para o tema.', seals: ['D'], cls: C, level: 2 },
      { key: 'arquitetura-processos', type: 'ferramenta', title: 'Arquitetura de processos adotada', dod: 'Mapa dos processos do centro definido (a arquitetura de referência do TrialScale cumpre este artefato).', seals: ['T'], cls: E, level: 3 },
      { key: 'controle-documentos', type: 'ferramenta', title: 'Controle de documentos', dod: 'Lista mestra de POPs com versão, data, aprovador e ciclo de revisão definido; POPs vigentes acessíveis e obsoletos recolhidos.', seals: ['G'], cls: E, level: 3 },
      { key: 'treinamento-pops', type: 'treinamento', title: 'Treinamento da equipe nos POPs', dod: 'Registro de que cada pessoa foi treinada nos POPs que executa (conecta com 7 — curadoria).', seals: ['G'], cls: E, level: 3 },
      { key: 'manual-qualidade', type: 'ferramenta', title: 'Manual da qualidade', dod: 'Documento que consolida política de qualidade, arquitetura e regras documentais.', seals: ['P'], cls: C, level: 3 },
      { key: 'indicadores-processo', type: 'indicador', title: 'Indicadores de processo definidos e medidos', dod: 'Os processos priorizados têm indicadores registrados e revisados em rotina.', seals: ['T'], cls: E, level: 4 },
      { key: 'portfolio-transformacao', type: 'ferramenta', title: 'Portfólio de transformação priorizado', dod: 'Fila de melhorias de processos com critério explícito e acompanhamento (as rodadas do TrialScale cumprem este artefato).', seals: ['T'], cls: E, level: 4 },
      { key: 'auditoria-interna', type: 'ferramenta', title: 'Auditoria interna', dod: 'Autoavaliação/auditoria interna periódica com registro de achados e ações.', seals: ['G', 'P'], cls: C, level: 4 },
      { key: 'ciclos-melhoria', type: 'indicador', title: 'Ciclos de melhoria contínua rodando', dod: 'Melhorias implementadas a partir de indicadores, com efeito medido (indicador melhorou após a ação).', seals: ['T'], cls: E, level: 5 },
      { key: 'gestao-mudancas-pop', type: 'ferramenta', title: 'Gestão de mudanças de processo', dod: 'Alterações de POP comunicadas, treinadas e com data de vigência controlada.', seals: ['G'], cls: C, level: 5 },
    ],
  },
  {
    code: '13',
    level1: 'Cada protocolo é um mundo; ninguém tem a visão do conjunto; aceita-se estudo novo sem olhar capacidade.',
    artifacts: [
      { key: 'relacao-protocolos-ativos', type: 'ferramenta', title: 'Relação dos protocolos ativos mantida', dod: 'Lista atualizada dos estudos (fase, área, patrocinador, status, coordenador responsável).', seals: ['T'], cls: E, level: 2 },
      { key: 'visao-pipeline', type: 'ferramenta', title: 'Visão de pipeline', dod: 'Estudos em prospecção/feasibility/startup listados junto aos ativos.', seals: ['D'], cls: C, level: 2 },
      { key: 'estrategia-portfolio', type: 'ferramenta', title: 'Estratégia de portfólio documentada', dod: 'Diretrizes de seleção (áreas, complexidade, duração, tipo de patrocinador) registradas e usadas no feasibility.', seals: ['T'], cls: E, level: 3 },
      { key: 'criterio-aceite-capacidade', type: 'ferramenta', title: 'Critério de aceite considerando capacidade', dod: 'Decisão de participar de novo estudo registra a checagem de capacidade (equipe/infra — conecta com 7 e 1.2).', seals: ['G'], cls: E, level: 3 },
      { key: 'indicadores-chave-definidos', type: 'ferramenta', title: 'Conjunto de indicadores-chave definido', dod: 'Métricas agregadas escolhidas (tempos, recrutamento, desvios, financeiro) com fonte definida.', seals: ['T'], cls: C, level: 3 },
      { key: 'dashboard-agregado', type: 'ferramenta', title: 'Dashboard agregado ativo', dod: 'Painel com os indicadores-chave de todos os protocolos, atualizado e usado em rotina de gestão à vista.', seals: ['T'], cls: E, level: 4 },
      { key: 'rito-revisao-portfolio', type: 'ferramenta', title: 'Rito de revisão do portfólio', dod: 'Reunião periódica registra análise do conjunto e ajustes encaminhados.', seals: ['T'], cls: E, level: 4 },
      { key: 'concentracao-patrocinador', type: 'indicador', title: 'Indicador: concentração por patrocinador/área', dod: 'Dependência de poucos patrocinadores medida e acompanhada.', seals: ['G'], cls: C, level: 4 },
      { key: 'portfolio-balanceado', type: 'indicador', title: 'Portfólio balanceado por dado', dod: 'Decisões de aceite, ajuste e encerramento sustentadas pelos indicadores agregados e pela estratégia, com registro.', seals: ['T', 'G'], cls: E, level: 5 },
      { key: 'simulacao-capacidade', type: 'ferramenta', title: 'Simulação de capacidade futura', dod: 'Projeção de carga (visitas futuras × equipe) usada para planejar contratações e aceites.', seals: ['G'], cls: C, level: 5 },
    ],
  },
]

export async function seedContentCompleto(): Promise<{ published: string[]; totalA: number }> {
  const published: string[] = []
  let totalA = 0
  for (const p of PROCESSOS_COMPLETO) {
    const process = await contentRepository.findProcessByCode(p.code)
    if (!process) {
      // eslint-disable-next-line no-console
      console.warn(`Processo ${p.code} não existe no catálogo — rode seed:journey antes.`)
      continue
    }
    const processId = process.get('id') as number
    totalA += p.artifacts.filter((a) => a.seals.includes('A')).length
    if (await contentRepository.findPublishedVersion(processId)) continue

    let draft = await contentRepository.findDraftVersion(processId)
    if (!draft) {
      await contentService.createDraft(processId, null)
      draft = await contentRepository.findDraftVersion(processId)
    }
    const draftId = draft!.get('id') as number

    const graph: DraftGraphInput = {
      levels: [
        { number: 1, description: p.level1 },
        { number: 2, description: null },
        { number: 3, description: null },
        { number: 4, description: null },
        { number: 5, description: null },
      ],
      artifacts: p.artifacts.map((a) => ({
        logicalKey: a.key,
        typeCode: a.type,
        title: a.title,
        dodText: a.dod,
        seals: a.seals,
        conditionCode: null,
        ownLevel: a.level,
        ownClassification: a.cls,
      })),
    }
    await contentService.saveDraft(draftId, graph)
    await contentService.publish(draftId, null)
    published.push(p.code)
  }
  return { published, totalA }
}

if (require.main === module) {
  seedContentCompleto()
    .then(({ published, totalA }) => {
      // eslint-disable-next-line no-console
      console.log(
        published.length
          ? `Catálogo completo: ${published.length} processos publicados (${published.join(', ')}). Itens [A] pendentes de validação humana: ${totalA}.`
          : 'Nada a publicar — catálogo já estava completo.',
      )
      process.exit(0)
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Falha no seed do catálogo completo:', err)
      process.exit(1)
    })
}
