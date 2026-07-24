import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { UnauthorizedError } from '../errors/domain-errors'
import type { Role } from '../context/request-context'

export interface AccessTokenClaims {
  sub: number // userId
  tenantId: number | null
  role: Role | null
  isStaff: boolean
}

export const tokenService = {
  signAccessToken(claims: AccessTokenClaims): string {
    return jwt.sign(
      { tenantId: claims.tenantId, role: claims.role, isStaff: claims.isStaff },
      env.JWT_SECRET,
      { subject: String(claims.sub), expiresIn: env.ACCESS_TOKEN_TTL_SECONDS, algorithm: 'HS256' },
    )
  },

  verifyAccessToken(token: string): AccessTokenClaims {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload
      return {
        sub: Number(payload.sub),
        tenantId: payload.tenantId ?? null,
        role: payload.role ?? null,
        isStaff: Boolean(payload.isStaff),
      }
    } catch {
      throw new UnauthorizedError('Sessão inválida ou expirada.')
    }
  },

  /** Refresh/reset tokens são OPACOS; o banco guarda só o SHA-256 (constituição §2). */
  generateOpaqueToken(): { token: string; hash: string } {
    const token = crypto.randomBytes(32).toString('base64url')
    return { token, hash: this.hashToken(token) }
  },

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  },

  refreshExpiry(): Date {
    return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
  },

  resetExpiry(): Date {
    return new Date(Date.now() + env.RESET_TOKEN_TTL_MINUTES * 60 * 1000)
  },
}
