import {
  objectiveRepository,
  tenantObjectiveRepository,
  painScoreRepository,
} from '../repositories/journey-repository'
import { contentRepository } from '../repositories/content-repository'
import { NotFoundError, ValidationFailedError } from '../errors/domain-errors'

/** Ordena códigos de processo naturalmente: 1.1 < 1.2 < 2.5 < 3.4 < 4 < 5 < 13. */
export function compareProcessCode(a: string | null, b: string | null): number {
  const parse = (c: string | null) => (c ?? '999').split('.').map((s) => Number(s) || 0)
  const [a1 = 0, a2 = 0] = parse(a)
  const [b1 = 0, b2 = 0] = parse(b)
  return a1 - b1 || a2 - b2
}

const GRUPO_ORDEM: Record<string, number> = { central: 1, suporte: 2, gestao: 3 }

export const journeyService = {
  // ---------------------------------------------------------- objetivos
  async listObjectives() {
    const rows = await objectiveRepository.listAll()
    const porTema = new Map<string, Array<{ id: number; name: string }>>()
    for (const r of rows) {
      const theme = r.get('theme') as string
      if (!porTema.has(theme)) porTema.set(theme, [])
      porTema.get(theme)!.push({ id: r.get('id') as number, name: r.get('name') as string })
    }
    return [...porTema.entries()].map(([theme, objectives]) => ({ theme, objectives }))
  },

  async getMyObjectives() {
    const meus = await tenantObjectiveRepository.listOrdered()
    const todos = await objectiveRepository.listAll()
    const nomePorId = new Map(
      todos.map((o) => [o.get('id') as number, { name: o.get('name') as string, theme: o.get('theme') as string }]),
    )
    return meus.map((m) => {
      const info = nomePorId.get(m.get('objective_id') as number)
      return {
        objectiveId: m.get('objective_id') as number,
        rank: m.get('priority_rank') as number,
        name: info?.name ?? '',
        theme: info?.theme ?? '',
      }
    })
  },

  /** Substitui a seleção inteira; a ORDEM do array é a prioridade relativa.
   *  Máximo de 8 (foco — decisão 2026-07-24; validado também no DTO). */
  async saveMyObjectives(objectiveIds: number[]) {
    if (objectiveIds.length > 8) {
      throw new ValidationFailedError({ objectiveIds: 'escolha no máximo 8 objetivos' })
    }
    const unicos = [...new Set(objectiveIds)]
    if (unicos.length !== objectiveIds.length) {
      throw new ValidationFailedError({ objectiveIds: 'objetivos repetidos na lista' })
    }
    const existentes = await objectiveRepository.findByIds(objectiveIds)
    if (existentes.length !== objectiveIds.length) {
      throw new ValidationFailedError({ objectiveIds: 'objetivo inexistente na lista' })
    }
    await tenantObjectiveRepository.replaceAll(objectiveIds)
  },

  // ---------------------------------------------------------- termômetro
  /** TODOS os processos do catálogo (decisão 2026-07-24) — o Raio-X continua
   *  restrito a publicados; o termômetro só precisa de nome + uma linha. */
  async getThermometer() {
    const processes = await contentRepository.listProcesses()
    const scores = await painScoreRepository.findAll()
    const scorePorProcesso = new Map(
      scores.map((s) => [s.get('process_id') as number, s.get('score') as number]),
    )
    const publicados = new Set<number>()
    for (const p of processes) {
      const id = p.get('id') as number
      if (await contentRepository.findPublishedVersion(id)) publicados.add(id)
    }

    const itens = processes
      .map((p) => ({
        processId: p.get('id') as number,
        code: p.get('code') as string | null,
        name: p.get('name') as string,
        processGroup: p.get('process_group') as string,
        oneLineDescription: p.get('one_line_description') as string | null,
        score: scorePorProcesso.get(p.get('id') as number) ?? null,
        published: publicados.has(p.get('id') as number),
      }))
      .sort(
        (a, b) =>
          (GRUPO_ORDEM[a.processGroup] ?? 9) - (GRUPO_ORDEM[b.processGroup] ?? 9) ||
          compareProcessCode(a.code, b.code),
      )

    return {
      processes: itens,
      answered: itens.filter((i) => i.score != null).length,
      total: itens.length,
    }
  },

  /** Upsert da nota de dor (salvar/retomar = gravar por processo). */
  async scorePain(processId: number, score: number) {
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new ValidationFailedError({ score: 'nota de dor deve ser um inteiro de 1 a 5' })
    }
    const process = await contentRepository.findProcessById(processId)
    if (!process) throw new NotFoundError('Processo não encontrado.')

    const existente = await painScoreRepository.findByProcessId(processId)
    if (existente) {
      existente.set('score' as never, score as never)
      await existente.save()
    } else {
      await painScoreRepository.create({ process_id: processId, score })
    }
  },

  // ---------------------------------------------------------- fotografia
  async getPhoto() {
    const { processes, answered, total } = await this.getThermometer()
    const respondidos = processes.filter((p) => p.score != null)

    const grupos = ['central', 'suporte', 'gestao'].map((grupo) => {
      const doGrupo = processes.filter((p) => p.processGroup === grupo)
      const comNota = doGrupo.filter((p) => p.score != null)
      return {
        group: grupo,
        processes: doGrupo,
        answered: comNota.length,
        total: doGrupo.length,
        averagePain: comNota.length
          ? Math.round((comNota.reduce((s, p) => s + (p.score ?? 0), 0) / comNota.length) * 10) / 10
          : null,
      }
    })

    const topPains = [...respondidos]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || compareProcessCode(a.code, b.code))
      .slice(0, 5)

    return { groups: grupos, topPains, answered, total }
  },
}
