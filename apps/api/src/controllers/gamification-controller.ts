import type { Request, Response, NextFunction } from 'express'
import { achievementService } from '../services/achievement-service'
import { reportService } from '../services/report-service'
import { getContext } from '../context/request-context'

export const gamificationController = {
  /** Avaliação lazy + idempotente: chamar já concede o que faltar. */
  async achievements(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await achievementService.evaluate())
    } catch (err) {
      next(err)
    }
  },

  /** Mapa de Maturidade TrialScale (PDF, autodeclarado). */
  async reportPdf(_req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = getContext()
      const doc = await reportService.buildPdf()
      const data = new Date().toISOString().slice(0, 10)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="mapa-maturidade-trialscale-${ctx?.tenantId ?? ''}-${data}.pdf"`,
      )
      doc.pipe(res)
    } catch (err) {
      next(err)
    }
  },
}
