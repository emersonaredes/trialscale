/**
 * Models Sequelize da Fatia 0 — MAPEIAM o schema.sql (fonte da verdade).
 * `sync` nunca é chamado. Tenancy registrada por model (ADR 001):
 *   tenant  → consent, tenant_specialty
 *   global  → identidade (user, membership, refresh_token, audit_log,
 *             password_reset_token) + tenant (raiz) + lookups (specialty)
 */
import { DataTypes, type ModelDefined, type Optional } from 'sequelize'
import { sequelize } from '../db/sequelize'
import { registerTenancy } from '../db/tenancy'
import type { Role } from '../context/request-context'

// ---------------------------------------------------------------- user
export interface UserAttrs {
  id: number
  email: string
  password_hash: string
  name: string
  is_staff: boolean
  created_at?: Date
}
export type UserCreation = Optional<UserAttrs, 'id' | 'is_staff' | 'created_at'>
export const User: ModelDefined<UserAttrs, UserCreation> = sequelize.define('user', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(255), allowNull: false },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  is_staff: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  created_at: { type: DataTypes.DATE, allowNull: true },
})

// ---------------------------------------------------------------- tenant
import type { TipoInstituicao, ProtocolosFaixa, OrgType, ModeloServico, OrpcFaixa } from '../types/domain'
export type { TipoInstituicao, ProtocolosFaixa, OrgType, ModeloServico, OrpcFaixa }
export interface TenantAttrs {
  id: number
  name: string
  org_type: OrgType // imutável após o cadastro (regra de aplicação)
  tipo_instituicao: TipoInstituicao | null
  cidade: string | null
  estado: string | null
  protocolos_ativos_faixa: ProtocolosFaixa | null
  tamanho: string | null
  fase_estudos: string | null
  tempo_existencia: string | null
  plan_id: number | null
  possui_pi_refrigerado: boolean | null
  possui_amostras: boolean | null
  // Perfil ORPC (NULL para CPC). Só os 3 primeiros têm condição de
  // aplicabilidade artefato-nível hoje (codes = nomes das colunas):
  modelo_servico: ModeloServico | null
  assume_atribuicoes_anvisa: boolean | null
  assume_farmacovigilancia: boolean | null
  perfil_fomento: boolean | null
  presta_monitoria: boolean | null
  seleciona_centros: boolean | null
  presta_gestao_dados: boolean | null
  ativa_centros: boolean | null
  centros_geridos_faixa: OrpcFaixa | null
  estudos_ativos_faixa: OrpcFaixa | null
}
export type TenantCreation = Optional<
  TenantAttrs,
  | 'id'
  | 'org_type'
  | 'tipo_instituicao'
  | 'cidade'
  | 'estado'
  | 'protocolos_ativos_faixa'
  | 'tamanho'
  | 'fase_estudos'
  | 'tempo_existencia'
  | 'plan_id'
  | 'possui_pi_refrigerado'
  | 'possui_amostras'
  | 'modelo_servico'
  | 'assume_atribuicoes_anvisa'
  | 'assume_farmacovigilancia'
  | 'perfil_fomento'
  | 'presta_monitoria'
  | 'seleciona_centros'
  | 'presta_gestao_dados'
  | 'ativa_centros'
  | 'centros_geridos_faixa'
  | 'estudos_ativos_faixa'
>
const ORPC_FAIXAS = ['0_5', '6_15', '16_40', '41_100', '100_mais'] as const
export const Tenant: ModelDefined<TenantAttrs, TenantCreation> = sequelize.define('tenant', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  org_type: { type: DataTypes.ENUM('cpc', 'orpc'), allowNull: false, defaultValue: 'cpc' },
  tipo_instituicao: { type: DataTypes.ENUM('publica', 'privada', 'terceiro_setor'), allowNull: true },
  cidade: { type: DataTypes.STRING(120), allowNull: true },
  estado: { type: DataTypes.CHAR(2), allowNull: true },
  protocolos_ativos_faixa: {
    type: DataTypes.ENUM('0_10', '11_30', '31_50', '51_100', '101_200', '200_mais'),
    allowNull: true,
  },
  tamanho: { type: DataTypes.STRING(40), allowNull: true },
  fase_estudos: { type: DataTypes.STRING(40), allowNull: true },
  tempo_existencia: { type: DataTypes.STRING(40), allowNull: true },
  plan_id: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
  possui_pi_refrigerado: { type: DataTypes.BOOLEAN, allowNull: true },
  possui_amostras: { type: DataTypes.BOOLEAN, allowNull: true },
  modelo_servico: {
    type: DataTypes.ENUM('full_service', 'servicos_funcionais', 'aro', 'outro'),
    allowNull: true,
  },
  assume_atribuicoes_anvisa: { type: DataTypes.BOOLEAN, allowNull: true },
  assume_farmacovigilancia: { type: DataTypes.BOOLEAN, allowNull: true },
  perfil_fomento: { type: DataTypes.BOOLEAN, allowNull: true },
  presta_monitoria: { type: DataTypes.BOOLEAN, allowNull: true },
  seleciona_centros: { type: DataTypes.BOOLEAN, allowNull: true },
  presta_gestao_dados: { type: DataTypes.BOOLEAN, allowNull: true },
  ativa_centros: { type: DataTypes.BOOLEAN, allowNull: true },
  centros_geridos_faixa: { type: DataTypes.ENUM(...ORPC_FAIXAS), allowNull: true },
  estudos_ativos_faixa: { type: DataTypes.ENUM(...ORPC_FAIXAS), allowNull: true },
})

// ---------------------------------------------------------------- membership (identidade)
export interface MembershipAttrs {
  id: number
  tenant_id: number
  user_id: number
  role: Role
  created_at?: Date
}
export type MembershipCreation = Optional<MembershipAttrs, 'id' | 'created_at'>
export const Membership: ModelDefined<MembershipAttrs, MembershipCreation> = sequelize.define(
  'membership',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    role: { type: DataTypes.ENUM('administrador', 'coordenador', 'membro'), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: true },
  },
)

// ---------------------------------------------------------------- consent (dado de centro)
export interface ConsentAttrs {
  id: number
  tenant_id: number
  user_id: number
  consent_version: string
  consented_at: Date
  text_ref: string
}
export type ConsentCreation = Optional<ConsentAttrs, 'id' | 'tenant_id'>
export const Consent: ModelDefined<ConsentAttrs, ConsentCreation> = sequelize.define('consent', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  consent_version: { type: DataTypes.STRING(40), allowNull: false },
  consented_at: { type: DataTypes.DATE, allowNull: false },
  text_ref: { type: DataTypes.STRING(255), allowNull: false },
})

// ---------------------------------------------------------------- audit_log (identidade)
export interface AuditLogAttrs {
  id: number
  tenant_id: number | null
  user_id: number | null
  event_type: string
  entity: string
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at?: Date
}
export type AuditLogCreation = Optional<AuditLogAttrs, 'id' | 'created_at'>
export const AuditLog: ModelDefined<AuditLogAttrs, AuditLogCreation> = sequelize.define('audit_log', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  event_type: { type: DataTypes.STRING(80), allowNull: false },
  entity: { type: DataTypes.STRING(80), allowNull: false },
  entity_id: { type: DataTypes.STRING(80), allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: true },
})

// ---------------------------------------------------------------- refresh_token (identidade)
export interface RefreshTokenAttrs {
  id: number
  user_id: number
  tenant_id: number | null
  token_hash: string
  family_id: string
  expires_at: Date
  revoked_at: Date | null
  replaced_by_id: number | null
  created_at?: Date
}
export type RefreshTokenCreation = Optional<
  RefreshTokenAttrs,
  'id' | 'revoked_at' | 'replaced_by_id' | 'created_at'
>
export const RefreshToken: ModelDefined<RefreshTokenAttrs, RefreshTokenCreation> = sequelize.define(
  'refresh_token',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    token_hash: { type: DataTypes.CHAR(64), allowNull: false },
    family_id: { type: DataTypes.CHAR(36), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    revoked_at: { type: DataTypes.DATE, allowNull: true },
    replaced_by_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
  },
)

// ---------------------------------------------------------------- password_reset_token (identidade)
export interface PasswordResetTokenAttrs {
  id: number
  user_id: number
  token_hash: string
  expires_at: Date
  used_at: Date | null
  created_at?: Date
}
export type PasswordResetTokenCreation = Optional<
  PasswordResetTokenAttrs,
  'id' | 'used_at' | 'created_at'
>
export const PasswordResetToken: ModelDefined<PasswordResetTokenAttrs, PasswordResetTokenCreation> =
  sequelize.define('password_reset_token', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    token_hash: { type: DataTypes.CHAR(64), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    used_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
  })

// ---------------------------------------------------------------- specialty (lookup global)
export interface SpecialtyAttrs {
  id: number
  code: string
  name: string
}
export const Specialty: ModelDefined<SpecialtyAttrs, Optional<SpecialtyAttrs, 'id'>> =
  sequelize.define('specialty', {
    id: { type: DataTypes.SMALLINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(60), allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
  })

// ---------------------------------------------------------------- tenant_specialty (dado de centro)
export interface TenantSpecialtyAttrs {
  id: number
  tenant_id: number
  specialty_id: number
}
export type TenantSpecialtyCreation = Optional<TenantSpecialtyAttrs, 'id' | 'tenant_id'>
export const TenantSpecialty: ModelDefined<TenantSpecialtyAttrs, TenantSpecialtyCreation> =
  sequelize.define('tenant_specialty', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    specialty_id: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
  })

// ---------------------------------------------------------------- tenancy (ADR 001)
// Dados de centro — escopo automático por hooks:
registerTenancy(TenantSpecialty, 'tenant')
registerTenancy(Consent, 'tenant')
// Identidade e raiz — escopo por user_id nos repositories de identidade:
registerTenancy(User, 'global')
registerTenancy(Tenant, 'global')
registerTenancy(Membership, 'global')
registerTenancy(RefreshToken, 'global')
registerTenancy(PasswordResetToken, 'global')
registerTenancy(AuditLog, 'global')
// Lookups:
registerTenancy(Specialty, 'global')
