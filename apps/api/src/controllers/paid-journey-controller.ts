import type { Request, Response, NextFunction } from 'express'
import { billingService } from '../services/billing-service'
import { priorityService } from '../services/priority-service'
import { roundService } from '../services/round-service'
import { assessmentService } from '../services/assessment-service'
import { identityRepository } from '../repositories/identity-repository'
import { getContext } from '../context/request-context'
import { UnauthorizedError } from '../errors/domain-errors'

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
      const { processIds, challengeWeeks, startedAt } = req.body as {
        processIds: number[]
        challengeWeeks?: number | null
        startedAt?: string | null
      }
      res
        .status(201)
        .json(await roundService.create(processIds, challengeWeeks ?? null, startedAt ?? null))
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

  // ---- artefatos da rodada (PT-0068) ----
  async artifactDetail(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await roundService.artifactDetail(Number(req.params.id)))
    } catch (err) {
      next(err)
    }
  },
  async createCustomArtifact(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as { processId: number; title: string; dodText: string; level: number }
      res.status(201).json(await roundService.createCustomArtifact(body))
    } catch (err) {
      next(err)
    }
  },
  async setAssignees(req: Request, res: Response, next: NextFunction) {
    try {
      const { userIds } = req.body as { userIds: number[] }
      await assessmentService.setAssignees(Number(req.params.artifactId), userIds)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },
  /** Usuários do MESMO tenant (lista de responsáveis possíveis). */
  async tenantUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = getContext()
      if (!ctx || ctx.tenantId == null) throw new UnauthorizedError()
      const memberships = await identityRepository.findMembershipsByTenant(ctx.tenantId)
      const users = await identityRepository.findUsersByIds(
        memberships.map((m) => m.get('user_id') as number),
      )
      const rolePorUser = new Map(
        memberships.map((m) => [m.get('user_id') as number, m.get('role') as string]),
      )
      res.json({
        users: users.map((u) => ({
          id: u.get('id') as number,
          name: u.get('name') as string,
          role: rolePorUser.get(u.get('id') as number) ?? null,
        })),
      })
    } catch (err) {
      next(err)
    }
  },
}
