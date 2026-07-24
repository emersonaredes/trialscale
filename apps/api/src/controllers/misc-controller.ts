import type { Request, Response, NextFunction } from 'express'
import { sequelize } from '../db/sequelize'
import { specialtyRepository } from '../repositories/center-repositories'

export const miscController = {
  /** Liveness/readiness (staging healthcheck): pinga o banco. */
  async health(_req: Request, res: Response): Promise<void> {
    try {
      await sequelize.query('SELECT 1')
      res.json({ status: 'ok', db: 'ok' })
    } catch {
      res.status(503).json({ status: 'degraded', db: 'down' })
    }
  },

  /** Lookup público de especialidades (formulário de cadastro). */
  async specialties(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rows = await specialtyRepository.listAll()
      res.json(
        rows.map((r) => ({ id: r.get('id'), code: r.get('code'), name: r.get('name') })),
      )
    } catch (err) {
      next(err)
    }
  },
}
