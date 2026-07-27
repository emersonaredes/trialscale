import crypto from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { runWithContext, type RequestContext } from '../context/request-context'
import { tokenService } from '../services/token-service'
import { identityRepository } from '../repositories/identity-repository'
import { UnauthorizedError } from '../errors/domain-errors'
import type { Role } from '../context/request-context'

/**
 * authenticate: Bearer JWT → RequestContext no AsyncLocalStorage (ADR 001).
 * O tenantId vem SEMPRE do token (nunca de body/query). A membership é
 * revalidada por request e o papel do BANCO vence o do token.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Autenticação necessária.'))
    return
  }
  const claims = (() => {
    try {
      return tokenService.verifyAccessToken(header.slice('Bearer '.length))
    } catch (err) {
      next(err)
      return null
    }
  })()
  if (!claims) return

  const ctx: RequestContext = {
    requestId: (req.headers['x-request-id'] as string | undefined) ?? crypto.randomUUID(),
    userId: claims.sub,
    tenantId: claims.tenantId,
    role: claims.role,
    isStaff: claims.isStaff,
  }

  // next() roda DENTRO do als.run: todo o pipeline daquele request herda o contexto.
  void runWithContext(ctx, async () => {
    try {
      if (!ctx.isStaff) {
        if (ctx.tenantId == null || ctx.userId == null) {
          throw new UnauthorizedError('Sessão inválida.')
        }
        const membership = await identityRepository.findMembership(ctx.userId, ctx.tenantId)
        if (!membership) throw new UnauthorizedError('Sessão inválida.')
        ctx.role = membership.get('role') as Role // banco vence token
        // Catálogo por tipo de organização (PT-0067): sempre do banco — o hook
        // da zona catalog usa este valor; sem ele, um ORPC veria o catálogo CPC.
        const tenant = await identityRepository.findTenantById(ctx.tenantId)
        if (!tenant) throw new UnauthorizedError('Sessão inválida.')
        ctx.orgType = (tenant.get('org_type') as 'cpc' | 'orpc' | null) ?? 'cpc'
      }
      next()
    } catch (err) {
      next(err)
    }
  })
}
