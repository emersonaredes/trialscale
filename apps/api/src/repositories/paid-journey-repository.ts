import type { ModelDefined, Transaction } from 'sequelize'
import { TenantRepository } from './tenant-repository'
import {
  Plan,
  Round,
  RoundProcess,
  ObjectiveProcessWeight,
  ProcessDependency,
  type RoundAttrs,
  type RoundCreation,
  type RoundProcessAttrs,
  type RoundProcessCreation,
} from '../models/paid-journey'
import { Tenant } from '../models'

/** Planos (lookup global) + plano do tenant (identidade — escopo pelo id). */
export const planRepository = {
  listAll() {
    return Plan.findAll({ order: [['amount', 'ASC']] })
  },
  findByCode(code: string) {
    return Plan.findOne({ where: { code } })
  },
  async setTenantPlan(tenantId: number, planId: number | null, t?: Transaction) {
    await Tenant.update({ plan_id: planId }, { where: { id: tenantId }, ...(t ? { transaction: t } : {}) })
  },
}

/** Rodadas (tenancy 'tenant' — escopo automático). */
class RoundRepository extends TenantRepository<RoundAttrs, RoundCreation> {
  protected model: ModelDefined<RoundAttrs, RoundCreation> = Round

  findOpen() {
    return Round.findOne({ where: { status: 'aberta' } })
  }
  findLast() {
    return Round.findOne({ order: [['sequence_no', 'DESC']] })
  }
  listConcluded() {
    return Round.findAll({ where: { status: 'concluida' }, order: [['sequence_no', 'ASC']] })
  }
}
export const roundRepository = new RoundRepository()

class RoundProcessRepository extends TenantRepository<RoundProcessAttrs, RoundProcessCreation> {
  protected model: ModelDefined<RoundProcessAttrs, RoundProcessCreation> = RoundProcess

  findByRoundId(roundId: number) {
    return RoundProcess.findAll({ where: { round_id: roundId } })
  }
}
export const roundProcessRepository = new RoundProcessRepository()

/** Curadoria global da priorização. */
export const priorityLookupRepository = {
  listWeights() {
    return ObjectiveProcessWeight.findAll()
  },
  createWeight(objectiveId: number, processId: number, weight: number) {
    return ObjectiveProcessWeight.findOrCreate({
      where: { objective_id: objectiveId, process_id: processId },
      defaults: { objective_id: objectiveId, process_id: processId, weight: String(weight) } as never,
    })
  },
  listDependencies() {
    return ProcessDependency.findAll()
  },
  createDependency(fromId: number, toId: number, type: string) {
    return ProcessDependency.findOrCreate({
      where: { from_process_id: fromId, to_process_id: toId, type },
      defaults: { from_process_id: fromId, to_process_id: toId, type } as never,
    })
  },
}
