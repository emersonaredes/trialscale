import { priorityLookupRepository } from '../repositories/paid-journey-repository'
import { objectiveRepository } from '../repositories/journey-repository'
import { contentRepository } from '../repositories/content-repository'
import { auditService } from './audit-service'
import { NotFoundError } from '../errors/domain-errors'

/**
 * Curadoria do mapa objetivo→processo (editor do CMS — tarefa da fila
 * 2026-07-24). Os pesos (1–3) alimentam a relevância estratégica: 40% do
 * score da priorização, multiplicados pelo rank do objetivo de cada centro.
 * Peso 0 = remover o vínculo. Toda mudança é auditada.
 */
export const priorityWeightsService = {
  async getMatrix() {
    const [objectives, processes, weights] = await Promise.all([
      objectiveRepository.listAll(),
      contentRepository.listProcesses(),
      priorityLookupRepository.listWeights(),
    ])
    return {
      objectives: objectives.map((o) => ({
        id: o.get('id') as number,
        theme: o.get('theme') as string,
        name: o.get('name') as string,
      })),
      processes: processes.map((p) => ({
        id: p.get('id') as number,
        code: p.get('code') as string | null,
        name: p.get('name') as string,
      })),
      weights: weights.map((w) => ({
        objectiveId: w.get('objective_id') as number,
        processId: w.get('process_id') as number,
        weight: Number(w.get('weight')),
      })),
    }
  },

  /** Define o peso de um vínculo (0 remove). */
  async setWeight(objectiveId: number, processId: number, weight: number): Promise<void> {
    const objective = (await objectiveRepository.findByIds([objectiveId]))[0]
    if (!objective) throw new NotFoundError('Objetivo não encontrado.')
    const process = await contentRepository.findProcessById(processId)
    if (!process) throw new NotFoundError('Processo não encontrado.')

    if (weight === 0) {
      await priorityLookupRepository.removeWeight(objectiveId, processId)
    } else {
      await priorityLookupRepository.setWeight(objectiveId, processId, weight)
    }
    await auditService.record(
      'priority.weight_changed',
      'objective_process_weight',
      `${objectiveId}:${processId}`,
      { reason: `peso=${weight}` },
      { tenantId: null },
    )
  },
}
