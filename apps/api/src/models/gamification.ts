/** Models da GAMIFICAÇÃO (Etapa 4): catálogo de conquistas + conquistas do centro. */
import { DataTypes, type ModelDefined, type Optional } from 'sequelize'
import { sequelize } from '../db/sequelize'
import { registerTenancy } from '../db/tenancy'
import type { AchievementType } from '../types/domain'
export type { AchievementType }

export interface AchievementAttrs {
  id: number
  code: string
  name: string
  type: AchievementType
}
export const Achievement: ModelDefined<AchievementAttrs, Optional<AchievementAttrs, 'id'>> =
  sequelize.define('achievement', {
    id: { type: DataTypes.SMALLINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(60), allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    type: { type: DataTypes.ENUM('selo', 'medalha'), allowNull: false },
  })

export interface TenantAchievementAttrs {
  id: number
  tenant_id: number
  achievement_id: number
  earned_at?: Date
}
export type TenantAchievementCreation = Optional<TenantAchievementAttrs, 'id' | 'tenant_id' | 'earned_at'>
export const TenantAchievement: ModelDefined<TenantAchievementAttrs, TenantAchievementCreation> =
  sequelize.define('tenant_achievement', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    achievement_id: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
    earned_at: { type: DataTypes.DATE, allowNull: true },
  })

registerTenancy(Achievement, 'global')
registerTenancy(TenantAchievement, 'tenant')
