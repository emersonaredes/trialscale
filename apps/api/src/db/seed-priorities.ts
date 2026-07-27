/**
 * Seed da PRIORIZAÇÃO (Etapa 3) — RASCUNHO DE CURADORIA [D]:
 *  1. Mapa objetivo→processo com pesos 1–3 (derivado da lógica da tese;
 *     VALIDAÇÃO HUMANA pendente — editável via CMS futuramente).
 *  2. Dependências entre processos (setas da arquitetura: fluxo operacional,
 *     sinalização de ordem — nunca travam navegação).
 * Idempotente (findOrCreate).
 */
import { objectiveRepository } from '../repositories/journey-repository'
import { priorityLookupRepository } from '../repositories/paid-journey-repository'
import { contentRepository } from '../repositories/content-repository'

/** objetivo (nome exato do seed-journey) → [processo, peso 1-3] */
const MAPA: Array<{ objetivo: string; processos: Array<[string, number]> }> = [
  { objetivo: 'Aumentar o número de protocolos', processos: [['1.1', 3], ['1.2', 2], ['9', 1]] },
  { objetivo: 'Aumentar recrutamento', processos: [['2.1', 3], ['1.6', 2], ['2.2', 1]] },
  { objetivo: 'Atrair estudos de maior complexidade ou fase mais precoce', processos: [['1.1', 2], ['7', 2], ['8', 2]] },
  { objetivo: 'Diversificar áreas terapêuticas', processos: [['1.1', 3], ['1.2', 1]] },
  { objetivo: 'Atrair estudos internacionais / patrocinadores globais', processos: [['1.1', 2], ['9', 2], ['3.4', 1]] },
  { objetivo: 'Reduzir a dependência de poucos patrocinadores', processos: [['1.1', 3], ['13', 2]] },
  { objetivo: 'Melhorar a qualidade dos processos', processos: [['12', 3], ['3.2', 2], ['7', 1]] },
  { objetivo: 'Diminuir desvios', processos: [['3.2', 3], ['2.3', 2], ['7', 2]] },
  { objetivo: 'Reduzir achados em monitorias, auditorias e inspeções', processos: [['3.4', 3], ['3.2', 2], ['12', 1]] },
  { objetivo: 'Encurtar o tempo de resposta a queries', processos: [['2.4', 3], ['2.3', 1]] },
  { objetivo: 'Fortalecer a integridade e a rastreabilidade dos dados', processos: [['2.4', 3], ['8', 2], ['2.5', 1]] },
  { objetivo: 'Encurtar o tempo de startup (da seleção ao primeiro participante)', processos: [['1.5', 3], ['1.3', 2], ['1.4', 2]] },
  { objetivo: 'Melhorar a taxa de retenção de participantes', processos: [['2.3', 3], ['2.2', 2]] },
  { objetivo: 'Aumentar a previsibilidade de metas de inclusão', processos: [['2.1', 3], ['1.6', 2]] },
  { objetivo: 'Reduzir o tempo entre visita e inserção de dados no CRF', processos: [['2.4', 3]] },
  { objetivo: 'Aumentar a taxa de conversão de feasibility em contrato', processos: [['1.2', 3], ['1.3', 2]] },
  { objetivo: 'Aumentar o faturamento', processos: [['5', 2], ['1.1', 2], ['10', 2]] },
  { objetivo: 'Melhorar a previsibilidade e o fluxo de caixa', processos: [['5', 3], ['10', 2]] },
  { objetivo: 'Reduzir inadimplência e atrasos de pagamento do patrocinador', processos: [['5', 3], ['1.3', 2]] },
  { objetivo: 'Melhorar a precificação de procedimentos e o overhead', processos: [['1.3', 3], ['10', 2]] },
  { objetivo: 'Reduzir a dependência de pessoas-chave (reter conhecimento em processos)', processos: [['12', 3], ['7', 3]] },
  { objetivo: 'Estruturar capacitação e educação continuada', processos: [['7', 3]] },
  { objetivo: 'Melhorar a retenção da equipe', processos: [['7', 3]] },
  { objetivo: 'Melhorar o serviço de saúde local', processos: [['9', 2], ['1.1', 1]] },
  { objetivo: 'Fortalecer o relacionamento com a comunidade e a rede de referenciamento', processos: [['9', 3], ['1.6', 1]] },
  { objetivo: 'Construir reputação e ser reconhecido como referência em uma área', processos: [['9', 2], ['1.1', 2], ['3.4', 1]] },
  { objetivo: 'Melhorar a experiência e a segurança do participante', processos: [['2.3', 3], ['3.1', 3], ['2.5', 2]] },
  { objetivo: 'Reduzir o tempo de espera nas visitas', processos: [['2.2', 3], ['2.3', 2]] },
]

/** Setas da arquitetura (de → para; tipo 'alimenta'). */
const DEPENDENCIAS: Array<[string, string]> = [
  ['1.1', '1.2'], ['1.2', '1.3'], ['1.2', '1.4'], ['1.3', '1.5'], ['1.4', '1.5'],
  ['1.5', '1.6'], ['1.6', '2.1'], ['2.1', '2.2'], ['2.2', '2.3'], ['2.3', '2.4'],
  ['8', '2.5'], ['8', '2.7'], ['7', '2.3'], ['7', '2.5'], ['6', '8'],
  ['5', '10'], ['11', '13'], ['12', '3.2'],
]

export async function seedPriorities(): Promise<{ pesos: number; dependencias: number }> {
  const objetivos = await objectiveRepository.listAll()
  const idPorNome = new Map(objetivos.map((o) => [o.get('name') as string, o.get('id') as number]))
  const processos = await contentRepository.listProcesses()
  const idPorCodigo = new Map(processos.map((p) => [p.get('code') as string, p.get('id') as number]))

  let pesos = 0
  for (const linha of MAPA) {
    const objetivoId = idPorNome.get(linha.objetivo)
    if (!objetivoId) continue // objetivo ainda não seedado — rode seed:journey antes
    for (const [codigo, peso] of linha.processos) {
      const processId = idPorCodigo.get(codigo)
      if (!processId) continue
      // UPSERT: rodar o seed de novo atualiza pesos editados no MAPA.
      await priorityLookupRepository.setWeight(objetivoId, processId, peso)
      pesos++
    }
  }

  let dependencias = 0
  for (const [de, para] of DEPENDENCIAS) {
    const fromId = idPorCodigo.get(de)
    const toId = idPorCodigo.get(para)
    if (!fromId || !toId) continue
    await priorityLookupRepository.createDependency(fromId, toId, 'alimenta')
    dependencias++
  }
  return { pesos, dependencias }
}

if (require.main === module) {
  seedPriorities()
    .then(({ pesos, dependencias }) => {
      // eslint-disable-next-line no-console
      console.log(`Priorização: ${pesos} pesos objetivo→processo (RASCUNHO [D]) e ${dependencias} dependências.`)
      process.exit(0)
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Falha no seed de priorização:', err)
      process.exit(1)
    })
}
