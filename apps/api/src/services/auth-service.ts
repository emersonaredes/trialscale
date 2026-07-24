import crypto from 'node:crypto'
import { sequelize } from '../db/sequelize'
import { runWithContext, getContext, type RequestContext, type Role } from '../context/request-context'
import { identityRepository } from '../repositories/identity-repository'
import {
  consentRepository,
  tenantSpecialtyRepository,
  specialtyRepository,
} from '../repositories/center-repositories'
import { passwordHasher } from '../adapters/password-hasher'
import type { MailAdapter } from '../adapters/mail-adapter'
import { tokenService } from './token-service'
import { auditService } from './audit-service'
import { ConflictError, UnauthorizedError, ValidationFailedError } from '../errors/domain-errors'
import { env } from '../config/env'
import { planRepository } from '../repositories/paid-journey-repository'
import type { TipoInstituicao, ProtocolosFaixa } from '../types/domain'

export interface RegisterInput {
  name: string
  email: string
  password: string
  tenant: {
    name: string
    tipoInstituicao: TipoInstituicao
    cidade: string
    estado: string
    protocolosAtivosFaixa: ProtocolosFaixa
    specialtyIds: number[]
  }
  consent: { version: string; accepted: true }
}

export interface TenantSessionInfo {
  id: number
  name: string
  planCode: string | null // null = gratuito (gating — Etapa 3)
}

export interface SessionResult {
  accessToken: string
  refreshToken: string // opaco — vai para cookie httpOnly no controller
  user: { id: number; name: string; email: string }
  tenant: TenantSessionInfo | null
  role: Role | null
  isStaff: boolean
}

const CONSENT_TEXT_REF = 'consent/lgpd' // versionado pelo campo consent_version

/** Info do centro para a sessão, incluindo o plano (gating do freemium). */
async function tenantSessionInfo(tenantId: number): Promise<TenantSessionInfo | null> {
  const tenant = await identityRepository.findTenantById(tenantId)
  if (!tenant) return null
  const planId = tenant.get('plan_id') as number | null
  let planCode: string | null = null
  if (planId != null) {
    const plans = await planRepository.listAll()
    const plan = plans.find((p) => (p.get('id') as number) === planId)
    planCode = plan ? (plan.get('code') as string) : null
  }
  return { id: tenantId, name: tenant.get('name') as string, planCode }
}

async function issueSession(
  userId: number,
  tenantId: number | null,
  role: Role | null,
  isStaff: boolean,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { token, hash } = tokenService.generateOpaqueToken()
  await identityRepository.createRefreshToken({
    user_id: userId,
    tenant_id: tenantId,
    token_hash: hash,
    family_id: crypto.randomUUID(),
    expires_at: tokenService.refreshExpiry(),
  })
  const accessToken = tokenService.signAccessToken({ sub: userId, tenantId, role, isStaff })
  return { accessToken, refreshToken: token }
}

export const authService = {
  /** Cadastro do centro: user + tenant + membership(administrador) + consent +
   *  especialidades + audit em UMA transação. 201 sem autologin (plano). */
  async register(input: RegisterInput): Promise<{ userId: number; tenantId: number }> {
    const existing = await identityRepository.findUserByEmail(input.email)
    if (existing) throw new ConflictError('Já existe uma conta com este e-mail.')

    const specialties = await specialtyRepository.findByIds(input.tenant.specialtyIds)
    if (specialties.length !== input.tenant.specialtyIds.length || specialties.length === 0) {
      throw new ValidationFailedError({ specialtyIds: 'especialidade inválida' })
    }

    const passwordHash = await passwordHasher.hash(input.password)

    return sequelize.transaction(async (t) => {
      const user = await identityRepository.createUser(
        { email: input.email, password_hash: passwordHash, name: input.name },
        t,
      )
      const tenant = await identityRepository.createTenant(
        {
          name: input.tenant.name,
          tipo_instituicao: input.tenant.tipoInstituicao,
          cidade: input.tenant.cidade,
          estado: input.tenant.estado.toUpperCase(),
          protocolos_ativos_faixa: input.tenant.protocolosAtivosFaixa,
        },
        t,
      )
      const userId = user.get('id') as number
      const tenantId = tenant.get('id') as number

      await identityRepository.createMembership(
        { tenant_id: tenantId, user_id: userId, role: 'administrador' },
        t,
      )

      // A partir daqui existe tenant: o restante roda DENTRO do contexto,
      // exercitando o mecanismo central desde o primeiro fluxo (ADR 001).
      const ctx: RequestContext = {
        requestId: getContext()?.requestId ?? 'registro',
        userId,
        tenantId,
        role: 'administrador',
        isStaff: false,
      }
      await runWithContext(ctx, async () => {
        await consentRepository.create(
          {
            user_id: userId,
            consent_version: input.consent.version,
            consented_at: new Date(),
            text_ref: CONSENT_TEXT_REF,
          },
          t,
        )
        await tenantSpecialtyRepository.bulkCreate(
          input.tenant.specialtyIds.map((sid) => ({ specialty_id: sid })),
          t,
        )
        await auditService.record(
          'auth.register',
          'tenant',
          tenantId,
          { consentVersion: input.consent.version, specialtyCount: input.tenant.specialtyIds.length },
          undefined,
          t,
        )
      })

      return { userId, tenantId }
    })
  },

  /** Login: 401 genérico (sem enumeração). Assume o único membership (multi adiado). */
  async login(email: string, password: string): Promise<SessionResult> {
    const user = await identityRepository.findUserByEmail(email)
    if (!user) throw new UnauthorizedError()

    const ok = await passwordHasher.verify(user.get('password_hash') as string, password)
    if (!ok) throw new UnauthorizedError()

    const userId = user.get('id') as number
    const isStaff = Boolean(user.get('is_staff'))

    let tenantId: number | null = null
    let role: Role | null = null
    let tenantInfo: TenantSessionInfo | null = null

    if (!isStaff) {
      const memberships = await identityRepository.findMembershipsByUser(userId)
      const first = memberships[0]
      if (!first) throw new UnauthorizedError()
      tenantId = first.get('tenant_id') as number
      role = first.get('role') as Role
      tenantInfo = await tenantSessionInfo(tenantId)
    }

    const session = await issueSession(userId, tenantId, role, isStaff)
    return {
      ...session,
      user: { id: userId, name: user.get('name') as string, email: user.get('email') as string },
      tenant: tenantInfo,
      role,
      isStaff,
    }
  },

  /** Refresh com ROTAÇÃO; reuso de token rotacionado/revogado revoga a família. */
  async refresh(refreshTokenPlain: string): Promise<SessionResult> {
    const hash = tokenService.hashToken(refreshTokenPlain)
    const stored = await identityRepository.findRefreshTokenByHash(hash)
    if (!stored) throw new UnauthorizedError('Sessão inválida.')

    const familyId = stored.get('family_id') as string
    const userId = stored.get('user_id') as number

    if (stored.get('revoked_at') != null) {
      // Reuso detectado (roubo provável): derruba a família inteira + audita.
      await identityRepository.revokeFamily(familyId)
      await auditService.record(
        'auth.refresh_reuse_detected',
        'refresh_token',
        stored.get('id') as number,
        { familyId },
        { userId, tenantId: (stored.get('tenant_id') as number | null) ?? null },
      )
      throw new UnauthorizedError('Sessão inválida.')
    }
    if ((stored.get('expires_at') as Date) < new Date()) {
      throw new UnauthorizedError('Sessão expirada.')
    }

    const user = await identityRepository.findUserById(userId)
    if (!user) throw new UnauthorizedError('Sessão inválida.')
    const isStaff = Boolean(user.get('is_staff'))
    const tenantId = (stored.get('tenant_id') as number | null) ?? null

    // Banco vence token: revalida membership/role a cada rotação.
    let role: Role | null = null
    let tenantInfo: TenantSessionInfo | null = null
    if (!isStaff) {
      if (tenantId == null) throw new UnauthorizedError('Sessão inválida.')
      const membership = await identityRepository.findMembership(userId, tenantId)
      if (!membership) {
        await identityRepository.revokeFamily(familyId)
        throw new UnauthorizedError('Sessão inválida.')
      }
      role = membership.get('role') as Role
      tenantInfo = await tenantSessionInfo(tenantId)
    }

    // Rotação: novo token na MESMA família; o antigo é revogado e aponta o elo.
    const { token, hash: newHash } = tokenService.generateOpaqueToken()
    const novo = await identityRepository.createRefreshToken({
      user_id: userId,
      tenant_id: tenantId,
      token_hash: newHash,
      family_id: familyId,
      expires_at: tokenService.refreshExpiry(),
    })
    await identityRepository.markRefreshTokenRotated(
      stored.get('id') as number,
      novo.get('id') as number,
    )

    const accessToken = tokenService.signAccessToken({ sub: userId, tenantId, role, isStaff })
    return {
      accessToken,
      refreshToken: token,
      user: { id: userId, name: user.get('name') as string, email: user.get('email') as string },
      tenant: tenantInfo,
      role,
      isStaff,
    }
  },

  /** Logout: revoga a família da sessão (idempotente). */
  async logout(refreshTokenPlain: string | undefined): Promise<void> {
    if (!refreshTokenPlain) return
    const stored = await identityRepository.findRefreshTokenByHash(
      tokenService.hashToken(refreshTokenPlain),
    )
    if (!stored) return
    const familyId = stored.get('family_id') as string
    await identityRepository.revokeFamily(familyId)
    await auditService.record('auth.logout', 'refresh_token', stored.get('id') as number, { familyId }, {
      userId: stored.get('user_id') as number,
      tenantId: (stored.get('tenant_id') as number | null) ?? null,
    })
  },

  /** Forgot: 202 sempre (anti-enumeração); link via MailAdapter. */
  async forgotPassword(email: string, mail: MailAdapter): Promise<void> {
    const user = await identityRepository.findUserByEmail(email)
    if (!user) return
    const { token, hash } = tokenService.generateOpaqueToken()
    await identityRepository.createPasswordResetToken({
      user_id: user.get('id') as number,
      token_hash: hash,
      expires_at: tokenService.resetExpiry(),
    })
    const resetUrl = `${env.APP_URL}/redefinir-senha?token=${token}`
    await mail.sendPasswordReset(email, resetUrl)
  },

  /** Reset single-use: troca a senha e revoga TODAS as sessões do usuário. */
  async resetPassword(tokenPlain: string, newPassword: string): Promise<void> {
    const stored = await identityRepository.findValidResetTokenByHash(
      tokenService.hashToken(tokenPlain),
    )
    if (!stored) throw new UnauthorizedError('Link inválido ou expirado.')

    const userId = stored.get('user_id') as number
    const passwordHash = await passwordHasher.hash(newPassword)

    await sequelize.transaction(async (t) => {
      await identityRepository.markResetTokenUsed(stored.get('id') as number, t)
      await identityRepository.updateUserPassword(userId, passwordHash, t)
      await identityRepository.revokeAllForUser(userId, t)
      await auditService.record('auth.password_reset', 'user', userId, undefined, { userId, tenantId: null }, t)
    })
  },

  /** Dados da sessão corrente (contexto já validado pelo authenticate). */
  async me(): Promise<Omit<SessionResult, 'accessToken' | 'refreshToken'>> {
    const ctx = getContext()
    if (!ctx || ctx.userId == null) throw new UnauthorizedError()
    const user = await identityRepository.findUserById(ctx.userId)
    if (!user) throw new UnauthorizedError()
    let tenantInfo: TenantSessionInfo | null = null
    if (ctx.tenantId != null) {
      tenantInfo = await tenantSessionInfo(ctx.tenantId)
    }
    return {
      user: {
        id: ctx.userId,
        name: user.get('name') as string,
        email: user.get('email') as string,
      },
      tenant: tenantInfo,
      role: ctx.role,
      isStaff: ctx.isStaff,
    }
  },
}
