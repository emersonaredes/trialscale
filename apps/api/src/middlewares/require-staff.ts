import type { Request, Response, NextFunction } from 'express'
import { getContext } from '../context/request-context'
import { ForbiddenError, UnauthorizedError } from '../errors/domain-errors'

/** Backoffice (CMS): exclusivo da equipe TrialScale (CA-8/CA-9). */
export function requireStaff(_req: Request, _res: Response, next: NextFunction): void {
  const ctx = getContext()
  if (!ctx || ctx.userId == null) {
    next(new UnauthorizedError())
    return
  }
  if (!ctx.isStaff) {
    next(new ForbiddenError('Área exclusiva da equipe TrialScale.'))
    return
  }
  next()
}
