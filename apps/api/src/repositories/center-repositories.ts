import type { ModelDefined } from 'sequelize'
import { TenantRepository } from './tenant-repository'
import {
  Consent,
  TenantSpecialty,
  Specialty,
  type ConsentAttrs,
  type ConsentCreation,
  type TenantSpecialtyAttrs,
  type TenantSpecialtyCreation,
} from '../models'

/** Consentimentos do centro (tenancy 'tenant' — escopo automático). */
class ConsentRepository extends TenantRepository<ConsentAttrs, ConsentCreation> {
  protected model: ModelDefined<ConsentAttrs, ConsentCreation> = Consent
}
export const consentRepository = new ConsentRepository()

/** Especialidades do centro (tenancy 'tenant' — escopo automático). */
class TenantSpecialtyRepository extends TenantRepository<
  TenantSpecialtyAttrs,
  TenantSpecialtyCreation
> {
  protected model: ModelDefined<TenantSpecialtyAttrs, TenantSpecialtyCreation> = TenantSpecialty
}
export const tenantSpecialtyRepository = new TenantSpecialtyRepository()

/** Lookup global de especialidades (leitura pública). */
export const specialtyRepository = {
  listAll() {
    return Specialty.findAll({ order: [['name', 'ASC']] })
  },
  findByIds(ids: number[]) {
    return Specialty.findAll({ where: { id: ids } })
  },
}
