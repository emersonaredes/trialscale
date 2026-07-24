/**
 * Seed da jornada gratuita (Fatia 2):
 *  1. Completa o catálogo com os 23 processos restantes da tese (nome +
 *     descrição de uma linha + objetivo, fiéis a docs/conteudo/*). SEM
 *     artefatos — detalhamento é curadoria via CMS; o termômetro só precisa
 *     do nome e da descrição (spec 003).
 *  2. Menu de objetivos estratégicos por tema (concepção §2).
 * Idempotente.
 */
import { contentRepository } from '../repositories/content-repository'
import { contentService } from '../services/content-service'
import { objectiveRepository } from '../repositories/journey-repository'
import type { ProcessGroup } from '../types/domain'

const PROCESSOS: Array<{ code: string; name: string; group: ProcessGroup; oneLine: string; objective: string }> = [
  // GRUPO 1 — Startup
  { code: '1.2', name: 'Participar de feasibility', group: 'central', oneLine: 'Como o centro avalia se tem viabilidade e capacidade de conduzir um novo protocolo.', objective: 'Avaliar a viabilidade de conduzir um novo protocolo, garantindo que o centro tem capacidade de executá-lo com a qualidade que o patrocinador demanda.' },
  { code: '1.3', name: 'Aprovar novo protocolo (contrato e orçamento)', group: 'central', oneLine: 'Como o centro negocia e formaliza contrato e orçamento do estudo.', objective: 'Garantir as aprovações necessárias para iniciar a condução, preservando os interesses do centro e do patrocinador.' },
  { code: '1.4', name: 'Aprovar novo protocolo (aprovação ética)', group: 'central', oneLine: 'Como o centro submete e obtém a aprovação ética (CEP/CONEP) do protocolo.', objective: 'Certificar que o protocolo atende aos requisitos éticos para garantir a segurança do participante.' },
  { code: '1.5', name: 'Alinhar procedimentos do protocolo (startup)', group: 'central', oneLine: 'Como o centro prepara equipe, sistemas e recursos para iniciar o estudo com qualidade.', objective: 'Prover à equipe o conhecimento e as condições para iniciar recrutamento e condução com qualidade.' },
  { code: '1.6', name: 'Definir lista de participantes potenciais (pré-triagem)', group: 'central', oneLine: 'Como o centro identifica candidatos elegíveis antes do recrutamento formal.', objective: 'Identificar potenciais participantes conforme critérios de elegibilidade, a partir de bases de dados existentes.' },
  // GRUPO 2 — Condução
  { code: '2.1', name: 'Recrutar participante', group: 'central', oneLine: 'Como o centro obtém consentimento e inclui participantes com segurança e conformidade.', objective: 'Recrutar o número acordado de participantes conforme critérios de elegibilidade, respeitando BPC e regulamentações — com atenção máxima ao consentimento livre e esclarecido.' },
  { code: '2.2', name: 'Desenvolver agenda de visitas', group: 'central', oneLine: 'Como o centro organiza equipe, salas e recursos para as visitas dentro das janelas do protocolo.', objective: 'Organizar equipe, recursos e parceiros para executar visitas conforme a janela e os requisitos do protocolo.' },
  { code: '2.3', name: 'Conduzir visita', group: 'central', oneLine: 'Como o centro executa as visitas e registra os dados com qualidade, mantendo a retenção do participante.', objective: 'Realizar as visitas e coletar/submeter dados no prazo e qualidade requeridos, mantendo satisfação, aderência e retenção do participante.' },
  { code: '2.4', name: 'Preencher ficha clínica (CRF)', group: 'central', oneLine: 'Como o centro insere os dados do estudo no CRF/eCRF com acurácia e no prazo.', objective: 'Garantir a entrada de dados conforme o estabelecido pelo patrocinador, com a maior acurácia possível — é a entrega de valor central ao patrocinador.' },
  { code: '2.6', name: 'Gerenciar materiais', group: 'central', oneLine: 'Como o centro controla o estoque de insumos e kits de suporte ao estudo.', objective: 'Manter os recursos de suporte (em geral kits de coleta) disponíveis no momento certo da visita, evitando desvios por falta.' },
  { code: '2.7', name: 'Gerenciar amostras biológicas', group: 'central', oneLine: 'Como o centro coleta, processa, armazena e envia amostras preservando sua integridade.', objective: 'Garantir as condições corretas para que amostras biológicas sejam analisadas com qualidade — integridade crítica da coleta ao transporte.' },
  { code: '2.8', name: 'Excluir participantes', group: 'central', oneLine: 'Como o centro registra saídas de participantes e assegura a conduta pós-estudo adequada.', objective: 'Registrar a exclusão do participante, garantindo a melhor conduta pós-estudo quando aplicável.' },
  // GRUPO 3 — Qualidade
  { code: '3.1', name: 'Gerenciar evento adverso e evento adverso grave', group: 'central', oneLine: 'Como o centro identifica, classifica, trata e reporta eventos adversos para proteger o participante.', objective: 'Registrar e reportar eventos adversos às entidades interessadas, buscando a segurança do participante.' },
  { code: '3.2', name: 'Gerenciar desvios na condução do estudo', group: 'central', oneLine: 'Como o centro previne, registra, corrige e reporta desvios de protocolo e BPC.', objective: 'Prevenir, identificar e corrigir falhas no cumprimento das regras do protocolo ou das boas práticas clínicas.' },
  { code: '3.3', name: 'Manter aprovação ética e regulatória', group: 'central', oneLine: 'Como o centro mantém o protocolo em conformidade ética ao longo de todo o ciclo (emendas, notificações, relatórios).', objective: 'Garantir que o protocolo esteja de acordo com as diretrizes éticas em todo o seu ciclo de vida.' },
  { code: '3.4', name: 'Gerenciar monitorias, auditorias e inspeções', group: 'central', oneLine: 'Como o centro se prepara para e conduz visitas de monitoria, auditoria e inspeção, resolvendo pendências.', objective: 'Preparar o centro para receber e acompanhar monitorias, auditorias e inspeções e solucionar pendências identificadas.' },
  // Encerramento
  { code: '4', name: 'Encerrar protocolo', group: 'central', oneLine: 'Como o centro encerra o estudo (close-out), reconcilia finanças e materiais, e organiza o arquivo.', objective: 'Encerrar as atividades do protocolo no centro e programar ações pós-projeto.' },
  // Suporte
  { code: '5', name: 'Gerenciar finanças', group: 'suporte', oneLine: 'Como o centro controla recebimentos, pagamentos e o fluxo de caixa de cada protocolo.', objective: 'Manter a saúde financeira do protocolo em todo o seu ciclo de vida, com controle centralizado e transparente do fluxo financeiro de cada projeto.' },
  { code: '9', name: 'Gerenciar comunicação', group: 'suporte', oneLine: 'Como o centro se comunica com equipe, participantes, patrocinadores e comunidade.', objective: 'Fazer o centro ser reconhecido pela comunidade com os atributos de interesse — definindo como quer ser reconhecido e por qual público.' },
  // Gestão
  { code: '10', name: 'Gerenciar orçamento', group: 'gestao', oneLine: 'Como o centro planeja e acompanha receitas e despesas do ano.', objective: 'Garantir a saúde financeira do centro (não do protocolo) por meio de planejamento e acompanhamento anual de gastos e receitas.' },
  { code: '11', name: 'Gerenciar planejamento estratégico', group: 'gestao', oneLine: 'Como o centro define aonde quer chegar e acompanha se está chegando.', objective: 'Definir e acompanhar metas estratégicas — missão, visão e valores traduzidos em metas de curto, médio e longo prazo.' },
  { code: '12', name: 'Gerenciar processos', group: 'gestao', oneLine: 'Como o centro documenta, mede e melhora continuamente seus próprios processos e POPs.', objective: 'Garantir que a execução dos processos entrega o valor desejado — com flexibilidade e melhoria constante.' },
  { code: '13', name: 'Gerenciar portfólio de protocolos', group: 'gestao', oneLine: 'Como o centro enxerga e equilibra o conjunto dos seus estudos — ativos, entrando e saindo.', objective: 'Garantir o bom andamento dos protocolos de forma integrada e o alinhamento entre os protocolos e os objetivos da organização.' },
]

/** Menu de objetivos estratégicos por tema (concepção §2). */
const OBJETIVOS: Array<{ theme: string; items: string[] }> = [
  { theme: 'Volume e captação de estudos', items: [
    'Aumentar o número de protocolos',
    'Aumentar recrutamento',
    'Atrair estudos de maior complexidade ou fase mais precoce',
    'Diversificar áreas terapêuticas',
    'Atrair estudos internacionais / patrocinadores globais',
    'Reduzir a dependência de poucos patrocinadores',
  ]},
  { theme: 'Qualidade e conformidade', items: [
    'Melhorar a qualidade dos processos',
    'Diminuir desvios',
    'Reduzir achados em monitorias, auditorias e inspeções',
    'Encurtar o tempo de resposta a queries',
    'Fortalecer a integridade e a rastreabilidade dos dados',
  ]},
  { theme: 'Desempenho operacional', items: [
    'Encurtar o tempo de startup (da seleção ao primeiro participante)',
    'Melhorar a taxa de retenção de participantes',
    'Aumentar a previsibilidade de metas de inclusão',
    'Reduzir o tempo entre visita e inserção de dados no CRF',
    'Aumentar a taxa de conversão de feasibility em contrato',
  ]},
  { theme: 'Financeiro e sustentabilidade', items: [
    'Aumentar o faturamento',
    'Melhorar a previsibilidade e o fluxo de caixa',
    'Reduzir inadimplência e atrasos de pagamento do patrocinador',
    'Melhorar a precificação de procedimentos e o overhead',
  ]},
  { theme: 'Pessoas e conhecimento', items: [
    'Reduzir a dependência de pessoas-chave (reter conhecimento em processos)',
    'Estruturar capacitação e educação continuada',
    'Melhorar a retenção da equipe',
  ]},
  { theme: 'Impacto e reputação', items: [
    'Melhorar o serviço de saúde local',
    'Fortalecer o relacionamento com a comunidade e a rede de referenciamento',
    'Construir reputação e ser reconhecido como referência em uma área',
  ]},
  { theme: 'Participante', items: [
    'Melhorar a experiência e a segurança do participante',
    'Reduzir o tempo de espera nas visitas',
  ]},
]

export async function seedJourney(): Promise<{ processosNovos: number; objetivos: number }> {
  let processosNovos = 0
  for (const p of PROCESSOS) {
    if (await contentRepository.findProcessByCode(p.code)) continue
    await contentService.createProcess({
      code: p.code,
      name: p.name,
      processGroup: p.group,
      oneLineDescription: p.oneLine,
      objectiveText: p.objective,
    })
    processosNovos++
  }

  let objetivos = 0
  for (const grupo of OBJETIVOS) {
    for (const name of grupo.items) {
      await objectiveRepository.findOrCreate(grupo.theme, name)
      objetivos++
    }
  }
  return { processosNovos, objetivos }
}

if (require.main === module) {
  seedJourney()
    .then(({ processosNovos, objetivos }) => {
      // eslint-disable-next-line no-console
      console.log(`Jornada: ${processosNovos} processos novos no catálogo; ${objetivos} objetivos garantidos.`)
      process.exit(0)
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Falha no seed da jornada:', err)
      process.exit(1)
    })
}
