/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Mecanismo central de escopo de tenant (ADR 001; constituição §1).
 *
 * Cada model declara sua tenancy ao ser registrado:
 *  - 'tenant'  → tenant_id NOT NULL; hooks injetam/verificam o escopo a partir
 *                do RequestContext. SEM contexto → MissingTenantContextError
 *                (falha por padrão: perda de contexto vira erro, nunca vazamento).
 *  - 'global'  → sem escopo de tenant (identidade: user, membership,
 *                refresh_token, audit_log, password_reset_token; lookups).
 *                O escopo de identidade é por user_id, aplicado nos repositories.
 *  - 'catalog' → tenant_id anulável (conteúdo global + personalizado; Fatia 1).
 *
 * Agregações (sum/min/max/aggregate), increment/decrement e upsert direto no
 * model são BLOQUEADOS: não passam pelos hooks de find e vazariam cross-tenant
 * em silêncio. Repositories oferecem alternativas escopadas quando necessário.
 */
import { Op, type ModelStatic, type Model } from 'sequelize'
import { getContext } from '../context/request-context'
import {
  MissingTenantContextError,
  CrossTenantWriteError,
  BlockedModelOperationError,
} from '../errors/domain-errors'

export type Tenancy = 'tenant' | 'global' | 'catalog' | 'org-lookup'

const registry = new Map<ModelStatic<any>, Tenancy>()

export function getTenancy(model: ModelStatic<any>): Tenancy | undefined {
  return registry.get(model)
}

/** Resolve o escopo vigente; lança se um model 'tenant' for acessado sem contexto. */
function resolveScope(modelName: string): { bypass: true } | { bypass: false; tenantId: number } {
  const ctx = getContext()
  if (ctx?.bypassTenantScope) return { bypass: true }
  if (!ctx || ctx.tenantId == null) throw new MissingTenantContextError(modelName)
  return { bypass: false, tenantId: ctx.tenantId }
}

function injectWhere(options: any, tenantId: number): void {
  const original = options.where
  options.where = original ? { [Op.and]: [original, { tenant_id: tenantId }] } : { tenant_id: tenantId }
}

const BLOCKED_STATICS = ['aggregate', 'sum', 'min', 'max', 'increment', 'decrement'] as const

export function registerTenancy(model: ModelStatic<any>, tenancy: Tenancy): void {
  registry.set(model, tenancy)
  if (tenancy === 'global') return

  const name = model.name

  if (tenancy === 'tenant') {
    const scopedWhere = (options: any) => {
      const scope = resolveScope(name)
      if (!scope.bypass) injectWhere(options, scope.tenantId)
    }

    model.addHook('beforeFind', (options: any) => scopedWhere(options))
    model.addHook('beforeCount', (options: any) => scopedWhere(options))
    model.addHook('beforeBulkUpdate', (options: any) => scopedWhere(options))
    model.addHook('beforeBulkDestroy', (options: any) => scopedWhere(options))

    const forceTenant = (instance: Model) => {
      const scope = resolveScope(name)
      if (scope.bypass) return
      // Injeta SEMPRE, sobrescrevendo qualquer tenant_id vindo de fora.
      instance.set('tenant_id' as any, scope.tenantId)
    }
    // beforeValidate: a validação notNull roda ANTES do beforeCreate — o
    // escopo precisa estar aplicado já na validação. Em update, verifica.
    model.addHook('beforeValidate', (instance: Model) => {
      if (instance.isNewRecord) forceTenant(instance)
      else {
        const scope = resolveScope(name)
        if (!scope.bypass && instance.get('tenant_id') !== scope.tenantId) {
          throw new CrossTenantWriteError(name)
        }
      }
    })
    model.addHook('beforeCreate', (instance: Model) => forceTenant(instance))
    model.addHook('beforeBulkCreate', (instances: Model[]) => instances.forEach(forceTenant))

    const verifyTenant = (instance: Model) => {
      const scope = resolveScope(name)
      if (scope.bypass) return
      if (instance.get('tenant_id') !== scope.tenantId) throw new CrossTenantWriteError(name)
    }
    model.addHook('beforeUpdate', (instance: Model) => verifyTenant(instance))
    model.addHook('beforeDestroy', (instance: Model) => verifyTenant(instance))
    model.addHook('beforeUpsert', () => {
      throw new BlockedModelOperationError('upsert', name)
    })

    // Agregações e increment/decrement não disparam beforeFind: bloqueio duro.
    // Exceção: COUNT — o próprio Model.count chama aggregate('COUNT') DEPOIS
    // do hook beforeCount já ter injetado o escopo.
    const aggregateOriginal = (model as any).aggregate.bind(model)
    ;(model as any).aggregate = (attr: unknown, fn: unknown, options?: unknown) => {
      if (typeof fn === 'string' && fn.toUpperCase() === 'COUNT') {
        return aggregateOriginal(attr, fn, options)
      }
      throw new BlockedModelOperationError(String(fn ?? 'aggregate'), name)
    }
    for (const op of BLOCKED_STATICS) {
      if (op === 'aggregate') continue
      ;(model as any)[op] = () => {
        throw new BlockedModelOperationError(op, name)
      }
    }
    return
  }

  // 'org-lookup' (PT-0067): lookup global segmentado por tipo de organização
  // (ex.: objective). Filtra org_type quando o contexto o define; staff e
  // seeds (sem orgType no contexto) veem tudo.
  if (tenancy === 'org-lookup') {
    const orgWhere = (options: any) => {
      const ctx = getContext()
      if (ctx?.bypassTenantScope || ctx?.orgType == null) return
      const filtro = { org_type: ctx.orgType }
      const original = options.where
      options.where = original ? { [Op.and]: [original, filtro] } : filtro
    }
    model.addHook('beforeFind', (options: any) => orgWhere(options))
    model.addHook('beforeCount', (options: any) => orgWhere(options))
    return
  }

  // 'catalog' (Fatia 1): leitura = catálogo global + personalizados do tenant.
  // PT-0067: se o model tem org_type e o contexto define orgType, o catálogo
  // é adicionalmente segmentado por tipo de organização — mecanizado aqui,
  // NUNCA por filtro manual em repository (mesma razão do ADR 001: uma
  // omissão faria um ORPC ser diagnosticado contra artefatos de CPC).
  const temOrgType = 'org_type' in model.getAttributes()
  const catalogWhere = (options: any) => {
    const ctx = getContext()
    if (ctx?.bypassTenantScope) return
    const filtro =
      ctx && ctx.tenantId != null
        ? { [Op.or]: [{ tenant_id: null }, { tenant_id: ctx.tenantId }] }
        : { tenant_id: null }
    const partes: any[] = [filtro]
    if (temOrgType && ctx?.orgType != null) partes.push({ org_type: ctx.orgType })
    const combinado = partes.length === 1 ? filtro : { [Op.and]: partes }
    const original = options.where
    options.where = original ? { [Op.and]: [original, combinado] } : combinado
  }
  model.addHook('beforeFind', (options: any) => catalogWhere(options))
  model.addHook('beforeCount', (options: any) => catalogWhere(options))
}
