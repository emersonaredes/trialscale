/**
 * Seed de conteúdo — primeira leva do MVP (5 processos), fiel a
 * docs/conteudo/conteudo_processos_mvp.md e concepção §9 (piloto 2.5).
 * Cria processo → rascunho → graph → PUBLICA (fluxo real do CMS).
 *
 * Compartilhados (aprendizado 3 da leva): 7 é dono de delegation;
 * 8 é dono de temperatura e IQ/OQ/PQ; 2.5 e demais referenciam.
 * Condicionais: compras públicas (centro_publico) e refrigeração
 * (possui_pi_refrigerado). Classificação E/C do piloto 2.5: PROVISÓRIA
 * (curadoria pendente na concepção §9) — editável no CMS.
 */
import { contentService, type DraftGraphInput } from '../services/content-service'
import { contentRepository } from '../repositories/content-repository'
import type { ProcessGroup } from '../types/domain'

type Cls = 'essencial' | 'complementar'
interface SeedArtifact {
  key: string
  type: string
  title: string
  dod: string
  seals: string[]
  cls: Cls
  level: number
  condition?: string
  also?: Array<{ code: string; level: number; cls: Cls }>
}
interface SeedProcess {
  code: string
  name: string
  group: ProcessGroup
  oneLine: string
  objective: string
  level1: string
  artifacts: SeedArtifact[]
}

const PROCESSES: SeedProcess[] = [
  {
    code: '7',
    name: 'Gerenciar equipe',
    group: 'suporte',
    oneLine: 'Como o centro contrata, treina, delega e retém as pessoas que executam a pesquisa.',
    objective:
      'Manter as pessoas e conhecimentos necessários para executar as tarefas do centro conforme a delegação de atividades, habilidades e conhecimentos.',
    level1:
      'Papéis difusos; treinamentos e documentos da equipe dispersos ou desatualizados; delegação registrada só quando o monitor cobra.',
    artifacts: [
      { key: 'delegation-form-por-protocolo', type: 'registro', title: 'Papéis conhecidos e delegation form preenchido por protocolo', dod: 'Cada protocolo ativo tem delegation form preenchido e assinado, ainda que a atualização seja reativa.', seals: ['T'], cls: 'essencial', level: 2 },
      { key: 'registros-treinamento-guardados', type: 'registro', title: 'Registros de treinamento guardados', dod: 'Certificados (GCP e específicos) arquivados, mesmo sem controle de vencimento.', seals: ['T'], cls: 'complementar', level: 2 },
      { key: 'descricao-cargos-competencias', type: 'ferramenta', title: 'Descrição de cargos e competências documentada', dod: 'Documento com cargos do centro, formação exigida, atividades, habilidades e requisitos, aprovado pela gestão.', seals: ['T'], cls: 'essencial', level: 3 },
      { key: 'pop-gestao-equipe', type: 'pop', title: 'POP de gestão de equipe e treinamentos', dod: 'Procedimento aprovado, assinado, com versão e data, cobrindo integração de novos membros, delegação, treinamentos obrigatórios e arquivamento de documentos.', seals: ['G'], cls: 'essencial', level: 3 },
      { key: 'delegation-form-atualizado', type: 'registro', title: 'Delegation form mantido atualizado', dod: 'Alterações de equipe refletidas no delegation e notificadas a CEP/patrocinador conforme aplicável.', seals: ['T'], cls: 'essencial', level: 3, also: [{ code: '2.5', level: 3, cls: 'essencial' }] },
      { key: 'arquivo-docs-equipe', type: 'registro', title: 'Arquivo centralizado de documentos da equipe', dod: 'CVs em PT/EN assinados e datados (revisão <= 12 meses), registros profissionais e certificados, em local único e recuperável.', seals: ['T'], cls: 'essencial', level: 3 },
      { key: 'cronograma-treinamentos', type: 'ferramenta', title: 'Cronograma anual de treinamentos', dod: 'Calendário de treinamentos do ano definido, incluindo renovações de GCP e IATA.', seals: ['T'], cls: 'complementar', level: 3 },
      { key: 'indicadores-equipe', type: 'indicador', title: 'Indicadores de equipe medidos', dod: 'Carga prevista×realizada por função/protocolo e rotatividade registradas e revisadas em rotina de gestão.', seals: ['T'], cls: 'essencial', level: 4 },
      { key: 'ferramenta-alocacao', type: 'ferramenta', title: 'Ferramenta de gestão de alocação', dod: 'Planilha ou sistema com a alocação de cada pessoa por protocolo e a escala de trabalho, atualizado.', seals: ['T'], cls: 'essencial', level: 4 },
      { key: 'matriz-treinamentos-alertas', type: 'ferramenta', title: 'Matriz de treinamentos com alertas de vencimento', dod: 'Controle com datas de validade por pessoa/treinamento e aviso antes do vencimento.', seals: ['G'], cls: 'complementar', level: 4 },
      { key: 'indicador-desvios-pessoas', type: 'indicador', title: 'Indicador: desvios de BPC relacionados a pessoas', dod: 'Desvios com causa "pessoas" classificados e acompanhados.', seals: ['T'], cls: 'complementar', level: 4 },
      { key: 'planejamento-capacidade', type: 'ferramenta', title: 'Planejamento de capacidade orienta o aceite de protocolos', dod: 'Análise documentada de disponibilidade da equipe usada na decisão de participar de novos estudos.', seals: ['T'], cls: 'essencial', level: 5 },
      { key: 'plano-retencao', type: 'ferramenta', title: 'Plano de retenção e desenvolvimento', dod: 'Ações de reconhecimento, carreira e capacitação definidas e revisadas periodicamente.', seals: ['T', 'G'], cls: 'complementar', level: 5 },
      { key: 'redundancia-funcoes-criticas', type: 'treinamento', title: 'Redundância de funções críticas', dod: 'Para cada função crítica, ao menos uma pessoa de backup treinada identificada.', seals: ['G'], cls: 'complementar', level: 5 },
    ],
  },
  {
    code: '8',
    name: 'Gerenciar infraestrutura',
    group: 'suporte',
    oneLine: 'Como o centro mantém equipamentos calibrados, ambiente controlado e instalações regularizadas.',
    objective:
      'Garantir que os equipamentos estejam em perfeito funcionamento para não influenciar negativamente os dados da pesquisa.',
    level1:
      'Equipamentos sem inventário nem agenda de calibração; manutenção só quando quebra; licenças tratadas sob demanda.',
    artifacts: [
      { key: 'inventario-equipamentos', type: 'ferramenta', title: 'Inventário de equipamentos', dod: 'Relação dos equipamentos do centro com identificação e localização.', seals: ['T'], cls: 'essencial', level: 2 },
      { key: 'equipamentos-criticos-operando', type: 'infraestrutura', title: 'Equipamentos críticos operando com manutenção sob demanda', dod: 'Os equipamentos essenciais à operação funcionam; incidentes são resolvidos, ainda que reativamente.', seals: ['T'], cls: 'essencial', level: 2 },
      { key: 'responsavel-infraestrutura', type: 'registro', title: 'Responsável pela infraestrutura definido', dod: 'Uma pessoa nomeada responde por equipamentos e instalações.', seals: ['D'], cls: 'complementar', level: 2 },
      { key: 'pop-gestao-equipamentos', type: 'pop', title: 'POP de gestão de equipamentos', dod: 'Procedimento aprovado, assinado, com versão e data, cobrindo calibração, manutenção preventiva/corretiva e tratamento de incidentes.', seals: ['G'], cls: 'essencial', level: 3 },
      { key: 'agenda-calibracoes', type: 'ferramenta', title: 'Agenda de calibrações com fornecedores certificados', dod: 'Cronograma de calibração por equipamento, executado por fornecedor com certificação metrológica reconhecida, com comprovantes arquivados.', seals: ['T'], cls: 'essencial', level: 3 },
      { key: 'licencas-certificados-prediais', type: 'registro', title: 'Licenças e certificados prediais vigentes e controlados', dod: 'Alvará/licença sanitária, AVCB e termos de responsabilidade técnica aplicáveis vigentes, com controle de validade. (Validação regulatória: exigências variam por município/estado.)', seals: ['A'], cls: 'essencial', level: 3 },
      { key: 'controle-acesso-fisico', type: 'infraestrutura', title: 'Controle de acesso físico definido', dod: 'Regras de acesso a áreas sensíveis (farmácia, arquivo, amostras) definidas e praticadas.', seals: ['T'], cls: 'complementar', level: 3 },
      { key: 'registro-temperatura-umidade', type: 'registro', title: 'Registro sistemático de temperatura e umidade', dod: 'Registros diários (momento, mínima, máxima) dos ambientes e equipamentos aplicáveis, com procedimento de tratamento de excursões (desvio + quarentena quando aplicável).', seals: ['T'], cls: 'essencial', level: 4, also: [{ code: '2.5', level: 4, cls: 'essencial' }] },
      { key: 'calendario-manutencoes-visitas', type: 'ferramenta', title: 'Calendário de manutenções integrado às visitas', dod: 'Manutenções e calibrações programadas considerando a agenda de visitas para não parar a operação.', seals: ['T'], cls: 'essencial', level: 4 },
      { key: 'indicador-desvios-calibracao', type: 'indicador', title: 'Indicador medido: desvios por falta de calibração', dod: 'Registrado e revisado em rotina de gestão.', seals: ['T'], cls: 'essencial', level: 4 },
      { key: 'plano-contingencia-equipamentos', type: 'ferramenta', title: 'Plano de contingência de equipamentos', dod: 'Para cada equipamento crítico, solução de contorno definida (backup próprio ou parceiro).', seals: ['T'], cls: 'complementar', level: 4 },
      { key: 'governanca-ti-basica', type: 'ferramenta', title: 'Governança básica de TI', dod: 'Controle de acesso a sistemas, backup e diretrizes LGPD definidos.', seals: ['T'], cls: 'complementar', level: 4 },
      { key: 'analise-preventiva-corretiva', type: 'indicador', title: 'Análise preventiva × corretiva orienta investimentos', dod: 'Custos de manutenção analisados periodicamente, orientando substituição de equipamentos.', seals: ['T'], cls: 'essencial', level: 5 },
      { key: 'qualificacao-iq-oq-pq', type: 'registro', title: 'Qualificação documentada de equipamentos críticos (IQ/OQ/PQ)', dod: 'Equipamentos críticos com qualificação formal e mapeamento térmico quando aplicável.', seals: ['G'], cls: 'complementar', level: 5, also: [{ code: '2.5', level: 5, cls: 'complementar' }] },
      { key: 'gestao-ti-estruturada', type: 'ferramenta', title: 'Gestão de TI estruturada', dod: 'Logs, segurança da informação e continuidade tratados formalmente.', seals: ['T', 'G'], cls: 'complementar', level: 5 },
    ],
  },
  {
    code: '2.5',
    name: 'Gerenciar produto sob investigação',
    group: 'central',
    oneLine: 'Como o centro recebe, armazena, dispensa e controla o produto sob investigação.',
    objective:
      'Garantir o produto sob investigação em boa forma e apresentação, e instruir o correto uso ao participante.',
    level1:
      'PI guardado de forma improvisada, sem local próprio, sem controle de temperatura nem registro de dispensação.',
    artifacts: [
      { key: 'farmacia-sala-pi', type: 'infraestrutura', title: 'Farmácia / sala do PI com controle de acesso', dod: 'Local próprio para o PI com acesso controlado à equipe autorizada.', seals: ['T'], cls: 'essencial', level: 2 },
      { key: 'refrigeracao-funcionando', type: 'infraestrutura', title: 'Refrigeração funcionando (geladeira/freezer)', dod: 'Equipamento de refrigeração dedicado e operante para PI termossensível.', seals: ['T'], cls: 'essencial', level: 2, condition: 'possui_pi_refrigerado' },
      { key: 'rotina-conhecida-pi', type: 'treinamento', title: 'Equipe conhece a rotina, sem procedimento escrito', dod: 'A rotina de recebimento/dispensação é conhecida e executada de forma consistente pela equipe.', seals: ['G'], cls: 'complementar', level: 2 },
      { key: 'pop-recebimento-armazenamento', type: 'pop', title: 'POP de recebimento e armazenamento do PI', dod: 'Procedimento aprovado, assinado, com versão e data, e conhecido pela equipe que o executa.', seals: ['T'], cls: 'essencial', level: 3 },
      { key: 'pop-dispensacao-double-check', type: 'pop', title: 'POP de dispensação com double-check', dod: 'Procedimento aprovado com dupla checagem de dispensação implantada (segurança do participante).', seals: ['T'], cls: 'essencial', level: 3 },
      { key: 'pop-descarte-pgrss', type: 'pop', title: 'POP de descarte / retorno conforme PGRSS', dod: 'Procedimento de descarte/retorno aprovado e aderente ao PGRSS aplicável.', seals: ['A'], cls: 'essencial', level: 3 },
      { key: 'historico-dispensacao', type: 'registro', title: 'Histórico de dispensação rastreável por participante', dod: 'Registro de dispensação recuperável por participante, sem dados identificáveis fora do source do centro.', seals: ['G'], cls: 'essencial', level: 3 },
      { key: 'controle-estoque-accountability', type: 'ferramenta', title: 'Controle de estoque / accountability unidade a unidade', dod: 'Controle de estoque com contabilidade unidade a unidade, atualizado e conferível.', seals: ['T'], cls: 'essencial', level: 4 },
      { key: 'pop-excursao-temperatura', type: 'pop', title: 'POP de gestão de excursão de temperatura', dod: 'Procedimento aprovado cobrindo desvio, quarentena e liberação pelo patrocinador.', seals: ['G'], cls: 'essencial', level: 4, condition: 'possui_pi_refrigerado' },
      { key: 'indicadores-pi', type: 'indicador', title: 'Indicadores medidos: PI na hora certa, reposição, aderência', dod: 'Os três indicadores da tese registrados e revisados em rotina de gestão.', seals: ['T'], cls: 'essencial', level: 4 },
      { key: 'pop-quebra-cego', type: 'pop', title: 'POP de quebra de cego de emergência', dod: 'Procedimento aprovado e conhecido pela equipe de plantão.', seals: ['G'], cls: 'complementar', level: 4 },
      { key: 'indicadores-geram-melhoria-pi', type: 'indicador', title: 'Indicadores revisados periodicamente geram ações de melhoria', dod: 'Análise documentada dos indicadores gera ações registradas de melhoria contínua.', seals: ['G'], cls: 'essencial', level: 5 },
      { key: 'integracao-ivrs-iwrs', type: 'ferramenta', title: 'Integração com IVRS/IWRS para randomização e dispensação', dod: 'Fluxo com IVRS/IWRS operante nos protocolos que o utilizam.', seals: ['T'], cls: 'complementar', level: 5 },
      { key: 'cadeia-custodia-assinada', type: 'registro', title: 'Cadeia de custódia com assinatura em cada transferência', dod: 'Toda transferência de PI registrada com assinatura de quem entrega e recebe.', seals: ['D'], cls: 'complementar', level: 5 },
    ],
  },
  {
    code: '1.1',
    name: 'Prospectar estudos',
    group: 'central',
    oneLine: 'Como o centro se apresenta ao mercado e atrai novos estudos e patrocinadores.',
    objective:
      'Fazer o centro ser reconhecido como potencial parceiro para novos estudos, direcionando esforços de divulgação aos patrocinadores certos com as informações certas.',
    level1:
      'Prospecção reativa e ocasional; o centro depende de convites espontâneos, sem definição de áreas de interesse nem material próprio.',
    artifacts: [
      { key: 'areas-terapeuticas-definidas', type: 'ferramenta', title: 'Áreas terapêuticas de interesse definidas', dod: 'Lista das áreas registrada e conhecida pela liderança, coerente com a expertise da equipe.', seals: ['T'], cls: 'essencial', level: 2 },
      { key: 'material-basico-apresentacao', type: 'ferramenta', title: 'Material básico de apresentação do centro', dod: 'Apresentação ou documento que descreve o centro (equipe, estrutura, experiência) existe e é enviável a um patrocinador.', seals: ['T'], cls: 'essencial', level: 2 },
      { key: 'responsavel-prospeccao', type: 'registro', title: 'Responsável pela prospecção identificado', dod: 'Uma pessoa nomeada responde pelo relacionamento com patrocinadores.', seals: ['D'], cls: 'complementar', level: 2 },
      { key: 'pop-playbook-prospeccao', type: 'pop', title: 'POP/playbook de prospecção', dod: 'Procedimento aprovado, assinado, com versão e data, cobrindo identificação de patrocinadores, apresentação do centro e resposta a contatos.', seals: ['T', 'G'], cls: 'essencial', level: 3 },
      { key: 'perfil-epidemiologico', type: 'registro', title: 'Perfil epidemiológico potencial documentado', dod: 'Levantamento escrito da população potencial nas áreas de interesse (fontes e data do levantamento indicadas).', seals: ['T'], cls: 'essencial', level: 3 },
      { key: 'material-comunicacao-atualizado', type: 'ferramenta', title: 'Material de comunicação profissional atualizado', dod: 'Apresentação institucional e/ou site com dados do centro, revisados nos últimos 12 meses.', seals: ['T', 'P'], cls: 'essencial', level: 3 },
      { key: 'mapa-patrocinadores-alvo', type: 'ferramenta', title: 'Mapa de patrocinadores e CROs-alvo', dod: 'Lista priorizada de indústrias, CROs, AROs e editais de fomento de interesse, com contatos.', seals: ['T'], cls: 'complementar', level: 3 },
      { key: 'plano-resposta-patrocinador', type: 'ferramenta', title: 'Plano padrão de resposta ao patrocinador', dod: 'Modelo de resposta/plano de melhoria pronto para adaptar a cada contato.', seals: ['T'], cls: 'complementar', level: 3 },
      { key: 'indicadores-prospeccao', type: 'indicador', title: 'Indicadores de prospecção medidos', dod: 'Feasibilities recebidos por período e participação em feasibilities nas áreas de interesse registrados e revisados em rotina de gestão.', seals: ['T'], cls: 'essencial', level: 4 },
      { key: 'pipeline-patrocinadores', type: 'ferramenta', title: 'Ferramenta de gestão do relacionamento (pipeline)', dod: 'Planilha ou CRM com o funil de patrocinadores (contato → apresentação → feasibility), atualizado.', seals: ['G', 'D'], cls: 'essencial', level: 4 },
      { key: 'dados-desempenho-comercial', type: 'indicador', title: 'Dados de desempenho compilados para o discurso comercial', dod: 'Métricas do centro consolidadas e prontas para uso em apresentações.', seals: ['P'], cls: 'complementar', level: 4 },
      { key: 'revisao-estrategia-prospeccao', type: 'indicador', title: 'Revisão periódica da estratégia de prospecção', dod: 'Análise documentada (ao menos anual) dos indicadores gerando ajustes de áreas, alvos e material.', seals: ['G'], cls: 'essencial', level: 5 },
      { key: 'posicionamento-benchmark', type: 'ferramenta', title: 'Posicionamento e benchmark revisitados', dod: 'Análise de posicionamento (foco, segmento, concorrentes/complementares) atualizada no ciclo estratégico.', seals: ['P'], cls: 'complementar', level: 5 },
      { key: 'plano-anual-relacionamento', type: 'ferramenta', title: 'Plano anual de relacionamento', dod: 'Agenda de eventos, conferências e ações de rede definida para o ano.', seals: ['T'], cls: 'complementar', level: 5 },
    ],
  },
  {
    code: '6',
    name: 'Conduzir compras',
    group: 'suporte',
    oneLine: 'Como o centro compra produtos e contrata serviços, da cotação ao recebimento.',
    objective:
      'Prover os recursos necessários à execução das atividades do centro, otimizando o uso dos recursos e garantindo que as compras atendem à necessidade que as originou.',
    level1: 'Compras feitas caso a caso, sem fluxo definido nem registro; cada pessoa compra do seu jeito.',
    artifacts: [
      { key: 'fluxo-compra-centralizado', type: 'ferramenta', title: 'Fluxo de compra conhecido e centralizado', dod: 'A equipe sabe a quem pedir e como; um responsável concentra as compras.', seals: ['T'], cls: 'essencial', level: 2 },
      { key: 'registro-basico-compras', type: 'registro', title: 'Registro básico das compras', dod: 'Relação simples do que foi comprado, de quem e por quanto.', seals: ['D'], cls: 'complementar', level: 2 },
      { key: 'pop-compras', type: 'pop', title: 'POP de compras', dod: 'Procedimento aprovado, assinado, com versão e data, cobrindo solicitação → avaliação da necessidade → cotação → aprovação → compra → recebimento e conferência.', seals: ['T'], cls: 'essencial', level: 3 },
      { key: 'regras-alcada', type: 'ferramenta', title: 'Regras de alçada e orçamento documentadas', dod: 'Limites de aprovação por valor/cargo/área definidos por escrito.', seals: ['T'], cls: 'essencial', level: 3 },
      { key: 'cadastro-fornecedores', type: 'ferramenta', title: 'Cadastro de fornecedores', dod: 'Relação de fornecedores utilizados com dados de contato e avaliação básica.', seals: ['G'], cls: 'complementar', level: 3 },
      { key: 'rito-compras-publicas', type: 'pop', title: 'Aderência ao rito de compras públicas', dod: 'O POP referencia o rito aplicável (edital/licitação/empenho) e os responsáveis.', seals: ['T', 'A'], cls: 'essencial', level: 3, condition: 'centro_publico' },
      { key: 'ferramenta-gestao-compras', type: 'ferramenta', title: 'Ferramenta de gestão de compras', dod: 'Planilha ou sistema com cada compra, etapas, fornecedor, prazos e status, atualizado.', seals: ['T'], cls: 'essencial', level: 4 },
      { key: 'indicador-tempo-compra', type: 'indicador', title: 'Indicador medido: tempo da solicitação à finalização', dod: 'Medido por tipo de compra e revisado em rotina de gestão.', seals: ['T'], cls: 'essencial', level: 4 },
      { key: 'conferencia-recebimento', type: 'registro', title: 'Conferência de recebimento registrada', dod: 'Registro de que a qualidade entregue confere com a contratada e o problema original foi resolvido.', seals: ['T'], cls: 'complementar', level: 4 },
      { key: 'revisao-fornecedores-custos', type: 'indicador', title: 'Revisão periódica de fornecedores e custos', dod: 'Análise documentada gera renegociações, trocas de fornecedor ou contratos de manutenção.', seals: ['G'], cls: 'essencial', level: 5 },
      { key: 'integracao-financas-centro-custo', type: 'ferramenta', title: 'Integração com finanças por centro de custo', dod: 'Compras classificadas por protocolo/centro de custo, alimentando a gestão financeira.', seals: ['T'], cls: 'complementar', level: 5 },
    ],
  },
]

export async function seedContent(): Promise<{ published: string[] }> {
  // 1ª passada: garante todos os processos criados (placements cruzados precisam dos ids)
  const idByCode = new Map<string, number>()
  for (const p of PROCESSES) {
    const existente = await contentRepository.findProcessByCode(p.code)
    if (existente) {
      idByCode.set(p.code, existente.get('id') as number)
      continue
    }
    const { id } = await contentService.createProcess({
      code: p.code,
      name: p.name,
      processGroup: p.group,
      oneLineDescription: p.oneLine,
      objectiveText: p.objective,
    })
    idByCode.set(p.code, id)
  }

  // 2ª passada: rascunho → graph → publicar (idempotente: pula quem já tem publicada)
  const published: string[] = []
  for (const p of PROCESSES) {
    const processId = idByCode.get(p.code)!
    if (await contentRepository.findPublishedVersion(processId)) continue

    const draft =
      (await contentRepository.findDraftVersion(processId)) ??
      ((await contentService.createDraft(processId, null)),
      await contentRepository.findDraftVersion(processId))
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
        conditionCode: a.condition ?? null,
        ownLevel: a.level,
        ownClassification: a.cls,
        extraPlacements: (a.also ?? []).map((x) => ({
          processId: idByCode.get(x.code)!,
          level: x.level,
          classification: x.cls,
        })),
      })),
    }
    await contentService.saveDraft(draftId, graph)
    await contentService.publish(draftId, null)
    published.push(p.code)
  }
  return { published }
}

if (require.main === module) {
  seedContent()
    .then(({ published }) => {
      // eslint-disable-next-line no-console
      console.log(
        published.length
          ? `Conteúdo publicado: processos ${published.join(', ')}.`
          : 'Conteúdo já estava publicado — nada a fazer.',
      )
      process.exit(0)
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Falha no seed de conteúdo:', err)
      process.exit(1)
    })
}
