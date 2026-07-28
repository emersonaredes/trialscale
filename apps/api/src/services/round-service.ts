import { sequelize } from '../db/sequelize'
import { maturityService } from './maturity-service'
import { priorityService } from './priority-service'
import { assessmentService } from './assessment-service'
import { auditService } from './audit-service'
import { roundRepository, roundProcessRepository } from '../repositories/paid-journey-repository'
import { contentRepository } from '../repositories/content-repository'
import { getContext } from '../context/request-context'
import { slugify } from './content-service'
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationFailedError,
} from '../errors/domain-errors'

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

  async create(processIds: number[], challengeWeeks: number | null, startedAt?: string | null) {
    if (processIds.length < 3 || processIds.length > 4) {
      throw new ValidationFailedError({ processIds: 'a rodada tem 3 ou 4 processos' })
    }
    // Data de início selecionável (PT-0068): hoje por padrão; nunca no passado
    // além de 30 dias (rodada retroativa não faz sentido) nem futuro > 90 dias.
    let inicio = new Date()
    if (startedAt) {
      inicio = new Date(`${startedAt}T00:00:00`)
      const dias = (inicio.getTime() - Date.now()) / 86_400_000
      if (Number.isNaN(inicio.getTime()) || dias < -30 || dias > 90) {
        throw new ValidationFailedError({ startedAt: 'início entre 30 dias atrás e 90 dias à frente' })
      }
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
          started_at: inicio,
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
    const challengeDeadline =
      startedAt && challengeWeeks
        ? new Date(startedAt.getTime() + challengeWeeks * 7 * 24 * 60 * 60 * 1000)
        : null

    // Evolução da rodada (PT-0068): realizado = % de artefatos completos;
    // previsto = % do prazo decorrido (só com desafio definido).
    const artifactsTotal = processes.reduce((s, p) => s + p.artifactsTotal, 0)
    const artifactsComplete = processes.reduce((s, p) => s + p.artifactsComplete, 0)
    const realizedPct = artifactsTotal > 0 ? Math.round((100 * artifactsComplete) / artifactsTotal) : 0
    let expectedPct: number | null = null
    if (startedAt && challengeDeadline) {
      const total = challengeDeadline.getTime() - startedAt.getTime()
      const decorrido = Date.now() - startedAt.getTime()
      expectedPct = Math.min(100, Math.max(0, Math.round((100 * decorrido) / total)))
    }

    return {
      roundId,
      sequenceNo: round.get('sequence_no') as number,
      startedAt,
      challengeWeeks,
      challengeDeadline,
      artifactsTotal,
      artifactsComplete,
      realizedPct,
      expectedPct,
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
    const cards: Array<Record<string, unknown> & { artifactId: number; state: string }> = []
    for (const p of atual.processes) {
      const m = await maturityService.computeProcess(p.processId)
      const alvo = Math.min(m.level + 1, 5)
      for (const a of m.artifacts.filter((x) => x.level <= alvo)) {
        cards.push({
          artifactId: a.artifactId,
          state: a.state,
          title: a.title,
          dodText: a.dodText,
          processId: p.processId,
          processCode: p.code,
          processName: p.name,
          level: a.level,
          classification: a.classification,
          expectedDueDate: a.expectedDueDate,
          shared: a.shared,
          custom: a.custom,
        })
      }
    }
    // Responsáveis (PT-0068) resolvidos em lote
    const assignees = await assessmentService.assigneesByArtifactIds(cards.map((c) => c.artifactId))
    for (const card of cards) {
      const { state, ...resto } = card
      colunas[state]!.push({ ...resto, assignees: assignees.get(card.artifactId) ?? [] })
    }
    return { round: atual, columns: colunas }
  },

  /** Detalhe de um artefato da rodada (PT-0068): conteúdo, templates, estado,
   *  data-limite e responsáveis — a página do card do kanban. */
  async artifactDetail(artifactId: number) {
    const artifact = await contentRepository.findArtifactById(artifactId)
    if (!artifact) throw new NotFoundError('Artefato não encontrado.')
    const ownerProcessId = artifact.get('owner_process_id') as number
    const process = await contentRepository.findProcessById(ownerProcessId)
    const m = await maturityService.computeProcess(ownerProcessId)
    const status = m.artifacts.find((a) => a.artifactId === artifactId)
    if (!status) throw new NotFoundError('Artefato fora do seu cálculo atual.')
    const assignees = await assessmentService.assigneesByArtifactIds([artifactId])
    return {
      artifact: status,
      process: {
        id: ownerProcessId,
        code: process?.get('code') as string | null,
        name: process?.get('name') as string,
      },
      assignees: assignees.get(artifactId) ?? [],
    }
  },

  /** Cria artefato PERSONALIZADO do tenant num processo da rodada aberta
   *  (PT-0068; decisão de produto 2026-07-27): entra como COMPLEMENTAR —
   *  soma ao progresso, não trava nem derruba nível; fora do benchmark por
   *  construção (tenant_id preenchido). */
  async createCustomArtifact(input: {
    processId: number
    title: string
    dodText: string
    level: number
  }) {
    const ctx = getContext()
    if (!ctx || ctx.tenantId == null) throw new UnauthorizedError()

    const round = await roundRepository.findOpen()
    if (!round) throw new NotFoundError('Nenhuma rodada aberta.')
    const roundProcesses = await roundProcessRepository.findByRoundId(round.get('id') as number)
    if (!roundProcesses.some((rp) => (rp.get('process_id') as number) === input.processId)) {
      throw new ValidationFailedError({ processId: 'o processo não faz parte da rodada aberta' })
    }

    const published = await contentRepository.findPublishedVersion(input.processId)
    if (!published) throw new ValidationFailedError({ processId: 'processo sem conteúdo publicado' })

    const types = await contentRepository.listArtifactTypes()
    const registroId = types.find((t) => t.get('code') === 'registro')?.get('id') as number

    return sequelize.transaction(async (t) => {
      const novo = await contentRepository.createArtifact(
        {
          content_version_id: published.get('id') as number,
          tenant_id: ctx.tenantId, // personalizado: visível SÓ para este tenant
          logical_key: `custom-${ctx.tenantId}-${slugify(input.title)}`.slice(0, 80),
          artifact_type_id: registroId,
          title: input.title,
          dod_text: input.dodText,
          owner_process_id: input.processId,
          applicability_condition_id: null,
        },
        t,
      )
      const artifactId = novo.get('id') as number
      await contentRepository.createPlacement(
        {
          artifact_id: artifactId,
          process_id: input.processId,
          tenant_id: ctx.tenantId,
          level_number: input.level,
          classification: 'complementar',
        },
        t,
      )
      await auditService.record('artifact.custom_created', 'artifact', artifactId, {
        reason: `processo ${input.processId}, nível ${input.level}`,
      }, undefined, t)
      return { artifactId }
    })
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
