import type { ModelDefined, Transaction } from 'sequelize'
import { TenantRepository } from './tenant-repository'
import {
  Objective,
  TenantObjective,
  PainScore,
  type TenantObjectiveAttrs,
  type TenantObjectiveCreation,
  type PainScoreAttrs,
  type PainScoreCreation,
} from '../models/journey'

/** Lookup global de objetivos estratégicos (menu por temas). */
export const objectiveRepository = {
  listAll() {
    return Objective.findAll({ order: [['id', 'ASC']] })
  },
  findByIds(ids: number[]) {
    return Objective.findAll({ where: { id: ids } })
  },
  findOrCreate(theme: string, name: string) {
    return Objective.findOrCreate({ where: { theme, name }, defaults: { theme, name } as never })
  },
}

/** Objetivos priorizados do centro (tenancy 'tenant' — escopo automático). */
class TenantObjectiveRepository extends TenantRepository<
  TenantObjectiveAttrs,
  TenantObjectiveCreation
> {
  protected model: ModelDefined<TenantObjectiveAttrs, TenantObjectiveCreation> = TenantObjective

  async replaceAll(objectiveIdsOrdenados: number[], transaction?: Transaction): Promise<void> {
    await TenantObjective.destroy({ where: {}, ...(transaction ? { transaction } : {}) })
    if (objectiveIdsOrdenados.length === 0) return
    await this.bulkCreate(
      objectiveIdsOrdenados.map((objective_id, i) => ({ objective_id, priority_rank: i + 1 })),
      transaction,
    )
  }

  listOrdered() {
    return TenantObjective.findAll({ order: [['priority_rank', 'ASC']] })
  }
}
export const tenantObjectiveRepository = new TenantObjectiveRepository()

/** Termômetro de dor (tenancy 'tenant' — escopo automático). */
class PainScoreRepository extends TenantRepository<PainScoreAttrs, PainScoreCreation> {
  protected model: ModelDefined<PainScoreAttrs, PainScoreCreation> = PainScore

  findByProcessId(processId: number) {
    return PainScore.findOne({ where: { process_id: processId } })
  }
}
export const painScoreRepository = new PainScoreRepository()
