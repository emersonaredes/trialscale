import type { Request, Response, NextFunction } from 'express'
import { billingService } from '../services/billing-service'
import { priorityService } from '../services/priority-service'
import { roundService } from '../services/round-service'

export const paidJourneyController = {
  // ---- billing (assinatura SIMULADA até a Etapa 5) ----
  async listPlans(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ plans: await billingService.listPlans(), myPlan: await billingService.getMyPlan() })
    } catch (err) {
      next(err)
    }
  },
  async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const { planCode } = req.body as { planCode: string }
      res.json(await billingService.subscribe(planCode))
    } catch (err) {
      next(err)
    }
  },
  async cancel(_req: Request, res: Response, next: NextFunction) {
    try {
      await billingService.cancel()
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },

  // ---- priorização ----
  async priorities(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await priorityService.computePriorities())
    } catch (err) {
      next(err)
    }
  },

  // ---- rodadas ----
  async currentRound(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ round: await roundService.current() })
    } catch (err) {
      next(err)
    }
  },
  async suggestRound(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ suggestion: await roundService.suggest() })
    } catch (err) {
      next(err)
    }
  },
  async createRound(req: Request, res: Response, next: NextFunction) {
    try {
      const { processIds, challengeWeeks } = req.body as {
        processIds: number[]
        challengeWeeks?: number | null
      }
      res.status(201).json(await roundService.create(processIds, challengeWeeks ?? null))
    } catch (err) {
      next(err)
    }
  },
  async kanban(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await roundService.kanban())
    } catch (err) {
      next(err)
    }
  },
  async concludeRound(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await roundService.conclude())
    } catch (err) {
      next(err)
    }
  },
}
