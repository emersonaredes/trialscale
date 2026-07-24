import type { Request, Response, NextFunction } from 'express'
import { getContext, type Role } from '../context/request-context'
import { ForbiddenError, UnauthorizedError } from '../errors/domain-errors'

/** Autorização por papel. Staff da TrialScale passa sempre. */
export function requireRole(...roles: Role[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const ctx = getContext()
    if (!ctx || ctx.userId == null) {
      next(new UnauthorizedError())
      return
    }
    if (ctx.isStaff || (ctx.role && roles.includes(ctx.role))) {
      next()
      return
    }
    next(new ForbiddenError())
  }
}
