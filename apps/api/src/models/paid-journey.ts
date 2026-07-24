/** Models da JORNADA PAGA (Etapa 3): planos, rodadas, priorização. */
import { DataTypes, type ModelDefined, type Optional } from 'sequelize'
import { sequelize } from '../db/sequelize'
import { registerTenancy } from '../db/tenancy'

// ---------------------------------------------------------------- plan (lookup global)
export interface PlanAttrs {
  id: number
  code: string
  name: string
  amount: string // DECIMAL chega como string (dinheiro nunca em float — constituição §3)
}
export const Plan: ModelDefined<PlanAttrs, Optional<PlanAttrs, 'id'>> = sequelize.define('plan', {
  id: { type: DataTypes.SMALLINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(40), allowNull: false },
  name: { type: DataTypes.STRING(120), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
})

// ---------------------------------------------------------------- round
export type RoundStatus = 'aberta' | 'concluida'
export interface RoundAttrs {
  id: number
  tenant_id: number
  sequence_no: number
  status: RoundStatus
  started_at: Date | null
  completed_at: Date | null
  challenge_weeks: number | null
}
export type RoundCreation = Optional<
  RoundAttrs,
  'id' | 'tenant_id' | 'status' | 'started_at' | 'completed_at' | 'challenge_weeks'
>
export const Round: ModelDefined<RoundAttrs, RoundCreation> = sequelize.define('round', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  sequence_no: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  status: { type: DataTypes.ENUM('aberta', 'concluida'), allowNull: false, defaultValue: 'aberta' },
  started_at: { type: DataTypes.DATE, allowNull: true },
  completed_at: { type: DataTypes.DATE, allowNull: true },
  challenge_weeks: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
})

// ---------------------------------------------------------------- round_process
export interface RoundProcessAttrs {
  id: number
  round_id: number
  tenant_id: number
  process_id: number
  baseline_level: number | null
}
export type RoundProcessCreation = Optional<RoundProcessAttrs, 'id' | 'tenant_id' | 'baseline_level'>
export const RoundProcess: ModelDefined<RoundProcessAttrs, RoundProcessCreation> =
  sequelize.define('round_process', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    round_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    process_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    baseline_level: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
  })

// ---------------------------------------------------------------- objective_process_weight (global, curadoria)
export interface OPWAttrs {
  id: number
  objective_id: number
  process_id: number
  weight: string // DECIMAL
}
export const ObjectiveProcessWeight: ModelDefined<OPWAttrs, Optional<OPWAttrs, 'id'>> =
  sequelize.define('objective_process_weight', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    objective_id: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    process_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    weight: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  })

// ---------------------------------------------------------------- process_dependency (global)
export interface ProcessDependencyAttrs {
  id: number
  from_process_id: number
  to_process_id: number
  type: string
}
export const ProcessDependency: ModelDefined<
  ProcessDependencyAttrs,
  Optional<ProcessDependencyAttrs, 'id'>
> = sequelize.define('process_dependency', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  from_process_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  to_process_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  type: { type: DataTypes.STRING(40), allowNull: false },
})

// ---------------------------------------------------------------- tenancy (ADR 001)
registerTenancy(Plan, 'global')
registerTenancy(Round, 'tenant')
registerTenancy(RoundProcess, 'tenant')
registerTenancy(ObjectiveProcessWeight, 'global')
registerTenancy(ProcessDependency, 'global')
