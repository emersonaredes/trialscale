import type { Request, Response, NextFunction } from 'express'
import type { ZodType } from 'zod'
import { ValidationFailedError } from '../errors/domain-errors'

/** Valida req.body com Zod (fronteira da API — CLAUDE.md) e substitui pelo
 *  resultado parseado (sem campos extras). */
export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      next(
        new ValidationFailedError(
          result.error.issues.map((i) => ({ campo: i.path.join('.'), erro: i.message })),
        ),
      )
      return
    }
    req.body = result.data
    next()
  }
}
