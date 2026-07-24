import { sequelize } from '../db/sequelize'
import { maturityService } from './maturity-service'
import { priorityService } from './priority-service'
import { auditService } from './audit-service'
import { roundRepository, roundProcessRepository } from '../repositories/paid-journey-repository'
import { contentRepository } from '../repositories/content-repository'
import { ConflictError, NotFoundError, ValidationFailedError } from '../errors/domain-errors'

/**
 * RODADAS (concepção §4): 3–4 processos por vez — esforço concentrado,
 * sensação periódica de conclusão. Conclusão = subiu ao menos 1 nível em
 * CADA processo da rodada (decisão 2026-07-24), com celebração.
 * Desafio opcional de N semanas acopla-se à rodada.
 */
export const roundService = {
  async suggest() {
    const { items } = await priorityService.computePriorities()
    return items.filter((i) => i.suggested)
  },

  async create(processIds: number[], challengeWeeks: number | null) {
    if (processIds.length < 3 || processIds.length > 4) {
      throw new ValidationFailedError({ processIds: 'a rodada tem 3 ou 4 processos' })
    }
    if (new Set(processIds).size !== processIds.length) {
      throw new ValidationFailedError({ processIds: 'processos repetidos' })
    }
    if (await roundRepository.findOpen()) {
      throw new ConflictError('Já existe uma rodada aberta. Conclua-a antes de abrir outra.')
    }

    // Elegibilidade + baseline (nível de partida) por processo
    const baselines: Array<{ processId: number; baseline: number }> = []
    for (const processId of processIds) {
      const published = await contentRepository.findPublishedVersion(processId)
      if (!published) {
        throw new ValidationFailedError({ processIds: `processo ${processId} sem conteúdo publicado` })
      }
      const m = await maturityService.computeProcess(processId)
      if (!m.applies) {
        throw new ValidationFailedError({ processIds: `processo ${processId} está marcado "não se aplica"` })
      }
      if (m.level >= 5) {
        throw new ValidationFailedError({ processIds: `processo ${processId} já está no topo da escala` })
      }
      baselines.push({ processId, baseline: m.level })
    }

    const last = await roundRepository.findLast()
    const sequenceNo = last ? (last.get('sequence_no') as number) + 1 : 1

    return sequelize.transaction(async (t) => {
      const round = await roundRepository.create(
        {
          sequence_no: sequenceNo,
          started_at: new Date(),
          challenge_weeks: challengeWeeks,
        } as never,
        t,
      )
      const roundId = round.get('id') as number
      for (const b of baselines) {
        await roundProcessRepository.create(
          { round_id: roundId, process_id: b.processId, baseline_level: b.baseline } as never,
          t,
        )
      }
      await auditService.record('round.created', 'round', roundId, undefined, undefined, t)
      return { roundId, sequenceNo }
    })
  },

  /** Rodada aberta com progresso por processo (baseline → atual). */
  async current() {
    const round = await roundRepository.findOpen()
    if (!round) return null
    const roundId = round.get('id') as number
    const roundProcesses = await roundProcessRepository.findByRoundId(roundId)

    const processes = []
    for (const rp of roundProcesses) {
      const processId = rp.get('process_id') as number
      const process = await contentRepository.findProcessById(processId)
      const m = await maturityService.computeProcess(processId)
      const baseline = (rp.get('baseline_level') as number | null) ?? 1
      // Tarefas do kanban deste processo: artefatos até o PRÓXIMO nível
      const alvo = Math.min(m.level + 1, 5)
      const tarefas = m.artifacts.filter((a) => a.level <= alvo)
      processes.push({
        processId,
        code: process?.get('code') as string | null,
        name: process?.get('name') as string,
        baselineLevel: baseline,
        currentLevel: m.level,
        leveledUp: m.level > baseline,
        nextLevelMissing: m.nextLevelMissing,
        essentialsTotal: m.essentialsTotal,
        essentialsComplete: m.essentialsComplete,
        artifactsTotal: tarefas.length,
        artifactsComplete: tarefas.filter((a) => a.state === 'completo').length,
      })
    }

    const startedAt = round.get('started_at') as Date | null
    const challengeWeeks = round.get('challenge_weeks') as number | null
    return {
      roundId,
      sequenceNo: round.get('sequence_no') as number,
      startedAt,
      challengeWeeks,
      challengeDeadline:
        startedAt && challengeWeeks
          ? new Date(startedAt.getTime() + challengeWeeks * 7 * 24 * 60 * 60 * 1000)
          : null,
      processes,
      canConclude: processes.length > 0 && processes.every((p) => p.leveledUp),
    }
  },

  /** Kanban da rodada: artefatos até o PRÓXIMO nível de cada processo, como tarefas. */
  async kanban() {
    const atual = await this.current()
    if (!atual) throw new NotFoundError('Nenhuma rodada aberta.')

    const colunas: Record<string, Array<Record<string, unknown>>> = {
      nao_iniciado: [],
      em_elaboracao: [],
      completo: [],
    }
    for (const p of atual.processes) {
      const m = await maturityService.computeProcess(p.processId)
      const alvo = Math.min(m.level + 1, 5)
      for (const a of m.artifacts.filter((x) => x.level <= alvo)) {
        colunas[a.state]!.push({
          artifactId: a.artifactId,
          title: a.title,
          dodText: a.dodText,
          processCode: p.code,
          processName: p.name,
          level: a.level,
          classification: a.classification,
          expectedDueDate: a.expectedDueDate,
          shared: a.shared,
        })
      }
    }
    return { round: atual, columns: colunas }
  },

  /** Conclui com celebração — só quando TODOS os processos subiram 1 nível. */
  async conclude() {
    const round = await roundRepository.findOpen()
    if (!round) throw new NotFoundError('Nenhuma rodada aberta.')
    const atual = await this.current()
    if (!atual!.canConclude) {
      const pendentes = atual!.processes.filter((p) => !p.leveledUp).map((p) => p.name)
      throw new ConflictError(
        `Ainda falta subir de nível em: ${pendentes.join(', ')}. Você está pertinho!`,
      )
    }
    const roundId = round.get('id') as number
    round.set('status' as never, 'concluida' as never)
    round.set('completed_at' as never, new Date() as never)
    await round.save()
    await auditService.record('round.concluded', 'round', roundId)
    return {
      sequenceNo: atual!.sequenceNo,
      processes: atual!.processes.map((p) => ({
        name: p.name,
        code: p.code,
        from: p.baselineLevel,
        to: p.currentLevel,
      })),
    }
  },
}
