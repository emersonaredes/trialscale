/** Models da JORNADA GRATUITA (Fatia 2): objetivos estratégicos e termômetro. */
import { DataTypes, type ModelDefined, type Optional } from 'sequelize'
import { sequelize } from '../db/sequelize'
import { registerTenancy } from '../db/tenancy'
import type { OrgType } from '../types/domain'

// ---------------------------------------------------------------- objective (lookup global)
export interface ObjectiveAttrs {
  id: number
  theme: string
  name: string
  org_type: OrgType // menu por tipo de organização (PT-0066)
}
export const Objective: ModelDefined<ObjectiveAttrs, Optional<ObjectiveAttrs, 'id' | 'org_type'>> =
  sequelize.define('objective', {
    id: { type: DataTypes.SMALLINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    theme: { type: DataTypes.STRING(80), allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    org_type: { type: DataTypes.ENUM('cpc', 'orpc'), allowNull: false, defaultValue: 'cpc' },
  })

// ---------------------------------------------------------------- tenant_objective
export interface TenantObjectiveAttrs {
  id: number
  tenant_id: number
  objective_id: number
  priority_rank: number
}
export type TenantObjectiveCreation = Optional<TenantObjectiveAttrs, 'id' | 'tenant_id'>
export const TenantObjective: ModelDefined<TenantObjectiveAttrs, TenantObjectiveCreation> =
  sequelize.define('tenant_objective', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    objective_id: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    priority_rank: { type: DataTypes.INTEGER, allowNull: false },
  })

// ---------------------------------------------------------------- pain_score
export interface PainScoreAttrs {
  id: number
  tenant_id: number
  process_id: number
  score: number
}
export type PainScoreCreation = Optional<PainScoreAttrs, 'id' | 'tenant_id'>
export const PainScore: ModelDefined<PainScoreAttrs, PainScoreCreation> = sequelize.define(
  'pain_score',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    process_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    score: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
  },
)

// ---------------------------------------------------------------- tenancy (ADR 001)
registerTenancy(Objective, 'global')
registerTenancy(TenantObjective, 'tenant')
registerTenancy(PainScore, 'tenant')
