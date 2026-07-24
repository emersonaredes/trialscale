import { maturityService } from './maturity-service'
import { journeyService } from './journey-service'
import {
  achievementCatalogRepository,
  tenantAchievementRepository,
} from '../repositories/gamification-repository'
import { tenantObjectiveRepository } from '../repositories/journey-repository'
import { roundRepository } from '../repositories/paid-journey-repository'
import { assessmentRepository } from '../repositories/assessment-repository'
import { auditService } from './audit-service'
import type { AchievementType } from '../types/domain'

/**
 * GAMIFICAÇÃO (concepção §5): conquistas simbólicas — selos (primeiros
 * passos) e medalhas (marcos de camada/jornada). Catálogo inicial [D].
 * Avaliação LAZY e IDEMPOTENTE: qualquer chamada verifica o estado real e
 * concede o que faltar (o único de (tenant, achievement) impede duplicata).
 * Celebra de verdade: cor e movimento só nos momentos de vitória (DS v2).
 */
const CATALOGO: Array<{ code: string; name: string; type: AchievementType; hint: string }> = [
  { code: 'primeiro-passo', name: 'Primeiro passo', type: 'selo', hint: 'Priorize seus objetivos estratégicos.' },
  { code: 'fotografia-completa', name: 'Fotografia completa', type: 'selo', hint: 'Responda o termômetro dos 28 processos.' },
  { code: 'primeira-trilha', name: 'Primeira trilha', type: 'selo', hint: 'Complete o primeiro artefato no Raio-X.' },
  { code: 'primeiro-definido', name: 'Processo Definido', type: 'selo', hint: 'Leve um processo ao nível 3.' },
  { code: 'primeiro-gerenciado', name: 'Processo Gerenciado', type: 'selo', hint: 'Leve um processo ao nível 4.' },
  { code: 'primeiro-otimizado', name: 'Topo da rota', type: 'medalha', hint: 'Leve um processo ao nível 5.' },
  { code: 'cinco-definidos', name: 'Cinco no Definido', type: 'medalha', hint: 'Cinco processos no nível 3 ou mais.' },
  { code: 'suporte-definido', name: 'Base sólida', type: 'medalha', hint: 'Todos os processos de suporte publicados no nível 3+.' },
  { code: 'primeira-rodada', name: 'Primeira rodada', type: 'medalha', hint: 'Conclua a sua primeira rodada de melhoria.' },
  { code: 'tres-rodadas', name: 'Ritmo de melhoria', type: 'medalha', hint: 'Conclua três rodadas.' },
]

export interface AchievementStatus {
  code: string
  name: string
  type: AchievementType
  hint: string
  earnedAt: Date | null
}

export const achievementService = {
  async ensureCatalog(): Promise<Map<string, number>> {
    const ids = new Map<string, number>()
    for (const item of CATALOGO) {
      const [row] = await achievementCatalogRepository.findOrCreate(item.code, item.name, item.type)
      ids.set(item.code, row.get('id') as number)
    }
    return ids
  },

  /** Avalia o estado real do centro e concede o que faltar. */
  async evaluate(): Promise<{ achievements: AchievementStatus[]; newlyEarned: string[] }> {
    const idsPorCode = await this.ensureCatalog()

    // Estado real
    const objetivos = await tenantObjectiveRepository.listOrdered()
    const termometro = await journeyService.getThermometer()
    const overview = await maturityService.computeOverview()
    const niveis = overview.processes.filter((p) => p.applies).map((p) => p.level)
    const suportePublicados = overview.processes.filter(
      (p) => p.processGroup === 'suporte' && p.applies,
    )
    const rodadasConcluidas = (await roundRepository.listConcluded()).length
    const algumCompleto =
      (await assessmentRepository.findAll({ state: 'completo' } as never)).length > 0

    const merecidas = new Set<string>()
    if (objetivos.length > 0) merecidas.add('primeiro-passo')
    if (termometro.total > 0 && termometro.answered === termometro.total) merecidas.add('fotografia-completa')
    if (algumCompleto) merecidas.add('primeira-trilha')
    if (niveis.some((n) => n >= 3)) merecidas.add('primeiro-definido')
    if (niveis.some((n) => n >= 4)) merecidas.add('primeiro-gerenciado')
    if (niveis.some((n) => n >= 5)) merecidas.add('primeiro-otimizado')
    if (niveis.filter((n) => n >= 3).length >= 5) merecidas.add('cinco-definidos')
    if (suportePublicados.length > 0 && suportePublicados.every((p) => p.level >= 3)) {
      merecidas.add('suporte-definido')
    }
    if (rodadasConcluidas >= 1) merecidas.add('primeira-rodada')
    if (rodadasConcluidas >= 3) merecidas.add('tres-rodadas')

    // Concede o que falta (idempotente — único por tenant×achievement)
    const minhas = await tenantAchievementRepository.findAll()
    const jaTenho = new Set(minhas.map((m) => m.get('achievement_id') as number))
    const newlyEarned: string[] = []
    for (const code of merecidas) {
      const achievementId = idsPorCode.get(code)!
      if (jaTenho.has(achievementId)) continue
      await tenantAchievementRepository.create({
        achievement_id: achievementId,
        earned_at: new Date(),
      } as never)
      newlyEarned.push(code)
      await auditService.record('achievement.earned', 'achievement', achievementId, {
        reason: code,
      })
    }

    const atualizadas = await tenantAchievementRepository.findAll()
    const earnedAtPorId = new Map(
      atualizadas.map((m) => [m.get('achievement_id') as number, m.get('earned_at') as Date]),
    )
    return {
      achievements: CATALOGO.map((item) => ({
        ...item,
        earnedAt: earnedAtPorId.get(idsPorCode.get(item.code)!) ?? null,
      })),
      newlyEarned,
    }
  },
}
