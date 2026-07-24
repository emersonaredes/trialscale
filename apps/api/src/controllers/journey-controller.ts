import type { Request, Response, NextFunction } from 'express'
import { journeyService } from '../services/journey-service'

export const journeyController = {
  async listObjectives(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await journeyService.listObjectives())
    } catch (err) {
      next(err)
    }
  },

  async getMyObjectives(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await journeyService.getMyObjectives())
    } catch (err) {
      next(err)
    }
  },

  async saveMyObjectives(req: Request, res: Response, next: NextFunction) {
    try {
      const { objectiveIds } = req.body as { objectiveIds: number[] }
      await journeyService.saveMyObjectives(objectiveIds)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },

  async thermometer(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await journeyService.getThermometer())
    } catch (err) {
      next(err)
    }
  },

  async scorePain(req: Request, res: Response, next: NextFunction) {
    try {
      const { score } = req.body as { score: number }
      await journeyService.scorePain(Number(req.params.processId), score)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },

  async photo(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await journeyService.getPhoto())
    } catch (err) {
      next(err)
    }
  },
}
