import type { Request, Response, NextFunction } from 'express'
import { DomainError, ValidationFailedError } from '../errors/domain-errors'
import { logger } from '../config/logger'

/** Error-handler ÚNICO (app-architect): converte erro de domínio em HTTP.
 *  Nada de try/catch com res.status espalhado por controller. */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof DomainError) {
    const body: Record<string, unknown> = { code: err.code, message: err.message }
    if (err instanceof ValidationFailedError) body.details = err.details
    // Erros 5xx de domínio (ex.: MissingTenantContextError) são bugs — loga sem vazar detalhes.
    if (err.httpStatus >= 500) {
      logger.error({ code: err.code, path: req.path }, err.message)
      res.status(err.httpStatus).json({ code: err.code, message: 'Erro interno.' })
      return
    }
    res.status(err.httpStatus).json(body)
    return
  }
  logger.error({ path: req.path, err }, 'erro não tratado')
  res.status(500).json({ code: 'INTERNAL', message: 'Erro interno.' })
}
