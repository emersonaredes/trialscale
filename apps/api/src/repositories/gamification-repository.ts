import type { ModelDefined } from 'sequelize'
import { TenantRepository } from './tenant-repository'
import {
  Achievement,
  TenantAchievement,
  type AchievementType,
  type TenantAchievementAttrs,
  type TenantAchievementCreation,
} from '../models/gamification'

export const achievementCatalogRepository = {
  listAll() {
    return Achievement.findAll({ order: [['id', 'ASC']] })
  },
  findOrCreate(code: string, name: string, type: AchievementType) {
    return Achievement.findOrCreate({ where: { code }, defaults: { code, name, type } as never })
  },
}

/** Conquistas do centro (tenancy 'tenant'). */
class TenantAchievementRepository extends TenantRepository<
  TenantAchievementAttrs,
  TenantAchievementCreation
> {
  protected model: ModelDefined<TenantAchievementAttrs, TenantAchievementCreation> =
    TenantAchievement

  findByAchievementId(achievementId: number) {
    return TenantAchievement.findOne({ where: { achievement_id: achievementId } })
  }
}
export const tenantAchievementRepository = new TenantAchievementRepository()
