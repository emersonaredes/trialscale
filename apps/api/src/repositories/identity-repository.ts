import { Op, type Transaction } from 'sequelize'
import {
  User,
  Tenant,
  Membership,
  RefreshToken,
  PasswordResetToken,
  AuditLog,
  type UserCreation,
  type TenantCreation,
  type MembershipCreation,
  type RefreshTokenCreation,
  type PasswordResetTokenCreation,
  type AuditLogCreation,
} from '../models'

/**
 * Repository de IDENTIDADE (ADR 001): tabelas 'global' cujo escopo é o
 * USUÁRIO, não o tenant — aplicado explicitamente por parâmetro aqui
 * (login/refresh/reset rodam antes de existir contexto de tenant).
 */
export const identityRepository = {
  // ---- user -----------------------------------------------------------
  findUserByEmail(email: string, transaction?: Transaction) {
    return User.findOne({ where: { email }, ...(transaction ? { transaction } : {}) })
  },
  findUserById(id: number, transaction?: Transaction) {
    return User.findByPk(id, transaction ? { transaction } : undefined)
  },
  createUser(data: UserCreation, transaction?: Transaction) {
    return User.create(data as never, transaction ? { transaction } : undefined)
  },
  async updateUserPassword(userId: number, passwordHash: string, transaction?: Transaction) {
    await User.update(
      { password_hash: passwordHash },
      { where: { id: userId }, ...(transaction ? { transaction } : {}) },
    )
  },

  // ---- tenant (raiz — criada no registro, lida no /me) -----------------
  createTenant(data: TenantCreation, transaction?: Transaction) {
    return Tenant.create(data as never, transaction ? { transaction } : undefined)
  },
  findTenantById(id: number, transaction?: Transaction) {
    return Tenant.findByPk(id, transaction ? { transaction } : undefined)
  },

  // ---- membership (escopo: user) ---------------------------------------
  createMembership(data: MembershipCreation, transaction?: Transaction) {
    return Membership.create(data as never, transaction ? { transaction } : undefined)
  },
  findMembershipsByUser(userId: number, transaction?: Transaction) {
    return Membership.findAll({ where: { user_id: userId }, ...(transaction ? { transaction } : {}) })
  },
  findMembership(userId: number, tenantId: number, transaction?: Transaction) {
    return Membership.findOne({
      where: { user_id: userId, tenant_id: tenantId },
      ...(transaction ? { transaction } : {}),
    })
  },
  findMembershipsByTenant(tenantId: number, transaction?: Transaction) {
    return Membership.findAll({
      where: { tenant_id: tenantId },
      ...(transaction ? { transaction } : {}),
    })
  },
  findUsersByIds(ids: number[], transaction?: Transaction) {
    if (ids.length === 0) return Promise.resolve([])
    return User.findAll({ where: { id: { [Op.in]: ids } }, ...(transaction ? { transaction } : {}) })
  },

  // ---- refresh_token (escopo: user/família) -----------------------------
  createRefreshToken(data: RefreshTokenCreation, transaction?: Transaction) {
    return RefreshToken.create(data as never, transaction ? { transaction } : undefined)
  },
  findRefreshTokenByHash(tokenHash: string, transaction?: Transaction) {
    return RefreshToken.findOne({
      where: { token_hash: tokenHash },
      ...(transaction ? { transaction } : {}),
    })
  },
  async markRefreshTokenRotated(id: number, replacedById: number, transaction?: Transaction) {
    await RefreshToken.update(
      { revoked_at: new Date(), replaced_by_id: replacedById },
      { where: { id }, ...(transaction ? { transaction } : {}) },
    )
  },
  async revokeFamily(familyId: string, transaction?: Transaction) {
    await RefreshToken.update(
      { revoked_at: new Date() },
      {
        where: { family_id: familyId, revoked_at: { [Op.is]: null } },
        ...(transaction ? { transaction } : {}),
      },
    )
  },
  async revokeAllForUser(userId: number, transaction?: Transaction) {
    await RefreshToken.update(
      { revoked_at: new Date() },
      {
        where: { user_id: userId, revoked_at: { [Op.is]: null } },
        ...(transaction ? { transaction } : {}),
      },
    )
  },

  // ---- password_reset_token (escopo: user) ------------------------------
  createPasswordResetToken(data: PasswordResetTokenCreation, transaction?: Transaction) {
    return PasswordResetToken.create(data as never, transaction ? { transaction } : undefined)
  },
  findValidResetTokenByHash(tokenHash: string, transaction?: Transaction) {
    return PasswordResetToken.findOne({
      where: {
        token_hash: tokenHash,
        used_at: { [Op.is]: null },
        expires_at: { [Op.gt]: new Date() },
      },
      ...(transaction ? { transaction } : {}),
    })
  },
  async markResetTokenUsed(id: number, transaction?: Transaction) {
    await PasswordResetToken.update(
      { used_at: new Date() },
      { where: { id }, ...(transaction ? { transaction } : {}) },
    )
  },

  // ---- audit_log (append-only; metadata allow-list no audit.service) ----
  appendAudit(data: AuditLogCreation, transaction?: Transaction) {
    return AuditLog.create(data as never, transaction ? { transaction } : undefined)
  },
}
