import type { Request, Response, NextFunction } from 'express'
import { getContext } from '../context/request-context'
import { identityRepository } from '../repositories/identity-repository'
import { DomainError, UnauthorizedError } from '../errors/domain-errors'

/** 403 com código próprio: o cliente mostra o paywall (não é "sem permissão"). */
export class PlanRequiredError extends DomainError {
  readonly httpStatus = 403
  readonly code = 'PLAN_REQUIRED'
  constructor() {
    super('Este recurso faz parte da jornada paga. Ative um plano para continuar.')
  }
}

/** Gating freemium (plano §3: feature flag desde o início da Etapa 3).
 *  Gratuito: cadastro, objetivos, termômetro, fotografia.
 *  Pago: Raio-X/níveis, priorização, rodadas/kanban. Staff passa sempre. */
export function requirePaidPlan(_req: Request, _res: Response, next: NextFunction): void {
  const ctx = getContext()
  if (!ctx || ctx.userId == null) {
    next(new UnauthorizedError())
    return
  }
  if (ctx.isStaff) {
    next()
    return
  }
  if (ctx.tenantId == null) {
    next(new PlanRequiredError())
    return
  }
  identityRepository
    .findTenantById(ctx.tenantId)
    .then((tenant) => {
      if (tenant?.get('plan_id') != null) next()
      else next(new PlanRequiredError())
    })
    .catch(next)
}
