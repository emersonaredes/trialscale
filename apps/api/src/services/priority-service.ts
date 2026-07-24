import { journeyService } from './journey-service'
import { maturityService } from './maturity-service'
import { priorityLookupRepository } from '../repositories/paid-journey-repository'
import { tenantObjectiveRepository } from '../repositories/journey-repository'

/**
 * PRIORIZAÇÃO (concepção §4): cruza dor percebida (termômetro), relevância
 * estratégica (objetivos priorizados × mapa objetivo→processo) e dependências
 * (sinalização de ordem — nunca trava a escolha).
 *
 * Score = 60% dor + 40% relevância, em 0–100. Pesos iniciais de design [D],
 * ajustáveis com dados do beta. Dependências entram como "destrava N
 * processos" (desempate e dica visual, conforme a tese: as setas descrevem
 * fluxo operacional, não ordem obrigatória).
 *
 * RISCO SILENCIOSO (concepção §4): dor baixa (<=2) + maturidade baixa (<=2)
 * — o que o centro não vê chegando (típico achado de inspeção).
 */
export interface PriorityItem {
  processId: number
  code: string | null
  name: string
  processGroup: string
  published: boolean
  applies: boolean
  pain: number | null
  relevance: number // 0-100
  score: number // 0-100
  unlocks: number
  level: number | null
  essentialsTotal: number | null // null = sem conteúdo publicado
  essentialsComplete: number | null
  nextLevelMissing: number | null
  silentRisk: boolean
  suggested: boolean
}

export const priorityService = {
  async computePriorities(): Promise<{ items: PriorityItem[]; answeredPain: number; hasObjectives: boolean }> {
    const { processes: termometro, answered } = await journeyService.getThermometer()
    const overview = await maturityService.computeOverview()
    const overviewByProcess = new Map(overview.processes.map((p) => [p.processId, p]))

    // Relevância estratégica: peso(obj→proc) × fator do rank do objetivo
    const meusObjetivos = await tenantObjectiveRepository.listOrdered()
    const n = meusObjetivos.length
    const rankFactor = new Map(
      meusObjetivos.map((o) => [
        o.get('objective_id') as number,
        (n - (o.get('priority_rank') as number) + 1) / Math.max(n, 1),
      ]),
    )
    const weights = await priorityLookupRepository.listWeights()
    const relevanceRaw = new Map<number, number>()
    for (const w of weights) {
      const fator = rankFactor.get(w.get('objective_id') as number)
      if (!fator) continue
      const pid = w.get('process_id') as number
      relevanceRaw.set(pid, (relevanceRaw.get(pid) ?? 0) + Number(w.get('weight')) * fator)
    }
    const maxRelevance = Math.max(...relevanceRaw.values(), 0)

    // Dependências: quantos processos este destrava (from → to)
    const deps = await priorityLookupRepository.listDependencies()
    const unlocksByProcess = new Map<number, number>()
    for (const d of deps) {
      const from = d.get('from_process_id') as number
      unlocksByProcess.set(from, (unlocksByProcess.get(from) ?? 0) + 1)
    }

    const items: PriorityItem[] = termometro.map((p) => {
      const pain = p.score
      const painNorm = pain != null ? (pain - 1) / 4 : 0
      const relNorm = maxRelevance > 0 ? (relevanceRaw.get(p.processId) ?? 0) / maxRelevance : 0
      const ov = overviewByProcess.get(p.processId)
      const level = ov?.level ?? null
      const applies = ov?.applies ?? true
      return {
        processId: p.processId,
        code: p.code,
        name: p.name,
        processGroup: p.processGroup,
        published: p.published,
        applies,
        pain,
        relevance: Math.round(relNorm * 100),
        score: Math.round((0.6 * painNorm + 0.4 * relNorm) * 100),
        unlocks: unlocksByProcess.get(p.processId) ?? 0,
        level,
        essentialsTotal: ov?.essentialsTotal ?? null,
        essentialsComplete: ov?.essentialsComplete ?? null,
        nextLevelMissing: ov?.nextLevelMissing ?? null,
        silentRisk:
          p.published && applies && pain != null && pain <= 2 && level != null && level <= 2,
        suggested: false,
      }
    })

    items.sort((a, b) => b.score - a.score || b.unlocks - a.unlocks || (a.code ?? '').localeCompare(b.code ?? ''))

    // Sugestão de rodada: top 4 elegíveis (publicado, aplicável, abaixo do topo)
    let marcados = 0
    for (const item of items) {
      if (marcados >= 4) break
      if (item.published && item.applies && (item.level ?? 1) < 5) {
        item.suggested = true
        marcados++
      }
    }

    return { items, answeredPain: answered, hasObjectives: n > 0 }
  },
}
