import { sequelize } from './sequelize'
import { runWithContext } from '../context/request-context'
import { identityRepository } from '../repositories/identity-repository'
import { consentRepository, tenantSpecialtyRepository } from '../repositories/center-repositories'
import { planRepository } from '../repositories/paid-journey-repository'
import { passwordHasher } from '../adapters/password-hasher'
import type { Role } from '../context/request-context'
import type { TenantCreation } from '../models'

/**
 * Seeds de desenvolvimento (idempotentes): 2 centros (CPC) + 2 ORPCs ×
 * usuários + 1 staff TrialScale. Base da suíte de isolamento e do smoke.
 * Senha de TODOS os usuários de teste: 'TrialScale#2026' (SÓ dev/teste).
 */
export const SEED_PASSWORD = 'TrialScale#2026'

interface SeedTenant {
  name: string
  cidade: string
  estado: string
  users: Array<{ email: string; name: string; role: Role }>
  /** Campos extras do tenant (perfil ORPC etc.). */
  extra?: Partial<TenantCreation>
  /** Código do plano para assinatura simulada já ativa no seed. */
  planCode?: string
}

const TENANTS: SeedTenant[] = [
  {
    name: 'Centro Alfa de Pesquisa Clínica',
    cidade: 'Ribeirão Preto',
    estado: 'SP',
    users: [
      { email: 'admin@alfa.dev', name: 'Ana Admin (Alfa)', role: 'administrador' },
      { email: 'coord@alfa.dev', name: 'Carlos Coordenador (Alfa)', role: 'coordenador' },
      { email: 'membro@alfa.dev', name: 'Marina Membro (Alfa)', role: 'membro' },
    ],
  },
  {
    name: 'Instituto Beta de Estudos Clínicos',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    users: [
      { email: 'admin@beta.dev', name: 'Bruno Admin (Beta)', role: 'administrador' },
      { email: 'coord@beta.dev', name: 'Célia Coordenadora (Beta)', role: 'coordenador' },
      { email: 'membro@beta.dev', name: 'Mateus Membro (Beta)', role: 'membro' },
    ],
  },
  // ---- ORPCs (PT-0067): perfis distintos para exercitar condições ----
  {
    name: 'Gama Pesquisa Clínica (ORPC full service)',
    cidade: 'São Paulo',
    estado: 'SP',
    users: [{ email: 'admin@gama.dev', name: 'Gabriela Admin (Gama)', role: 'administrador' }],
    planCode: 'premium', // já assinante: navega a jornada paga direto
    extra: {
      org_type: 'orpc',
      modelo_servico: 'full_service',
      assume_atribuicoes_anvisa: true,
      assume_farmacovigilancia: true,
      perfil_fomento: false, // exercita a exclusão do artefato condicional
      presta_monitoria: true,
      seleciona_centros: true,
      presta_gestao_dados: true,
      ativa_centros: true,
      centros_geridos_faixa: '16_40',
      estudos_ativos_faixa: '6_15',
    },
  },
  {
    name: 'Delta Serviços de Pesquisa (ORPC funcional)',
    cidade: 'Campinas',
    estado: 'SP',
    users: [{ email: 'admin@delta.dev', name: 'Diego Admin (Delta)', role: 'administrador' }],
    // Delta fica no plano gratuito: demonstra paywall + assinatura simulada
    extra: {
      org_type: 'orpc',
      modelo_servico: 'servicos_funcionais',
      assume_atribuicoes_anvisa: false,
      assume_farmacovigilancia: false,
      perfil_fomento: true, // vê o artefato condicional de editais
      presta_monitoria: true,
      seleciona_centros: false,
      presta_gestao_dados: true,
      ativa_centros: false,
      centros_geridos_faixa: '0_5',
      estudos_ativos_faixa: '0_5',
    },
  },
]

export async function seedDev(): Promise<{ tenantIds: number[] }> {
  const passwordHash = await passwordHasher.hash(SEED_PASSWORD)
  const tenantIds: number[] = []

  for (const t of TENANTS) {
    // Idempotência: se o admin já existe, o tenant já foi seedado.
    const existente = await identityRepository.findUserByEmail(t.users[0]!.email)
    if (existente) {
      const memberships = await identityRepository.findMembershipsByUser(
        existente.get('id') as number,
      )
      if (memberships[0]) tenantIds.push(memberships[0].get('tenant_id') as number)
      continue
    }

    const planId = t.planCode
      ? ((await planRepository.listAll())
          .find((p) => p.get('code') === t.planCode)
          ?.get('id') as number | undefined)
      : undefined

    await sequelize.transaction(async (trx) => {
      const tenant = await identityRepository.createTenant(
        {
          name: t.name,
          cidade: t.cidade,
          estado: t.estado,
          ...(t.extra?.org_type === 'orpc'
            ? {}
            : { tipo_instituicao: 'privada' as const, protocolos_ativos_faixa: '11_30' as const }),
          ...(planId != null ? { plan_id: planId } : {}),
          ...(t.extra ?? {}),
        },
        trx,
      )
      const tenantId = tenant.get('id') as number
      tenantIds.push(tenantId)

      for (const u of t.users) {
        const user = await identityRepository.createUser(
          { email: u.email, password_hash: passwordHash, name: u.name },
          trx,
        )
        const userId = user.get('id') as number
        await identityRepository.createMembership(
          { tenant_id: tenantId, user_id: userId, role: u.role },
          trx,
        )
        await runWithContext(
          { requestId: 'seed', userId, tenantId, role: u.role, isStaff: false },
          async () => {
            await consentRepository.create(
              {
                user_id: userId,
                consent_version: 'v1-dev',
                consented_at: new Date(),
                text_ref: 'consent/lgpd',
              },
              trx,
            )
          },
        )
      }

      // Especialidades de exemplo (ids 1-3 do seed global)
      await runWithContext(
        { requestId: 'seed', userId: null, tenantId, role: null, isStaff: false },
        async () => {
          await tenantSpecialtyRepository.bulkCreate(
            [{ specialty_id: 1 }, { specialty_id: 2 }, { specialty_id: 3 }],
            trx,
          )
        },
      )
    })
  }

  // Staff TrialScale (sem tenant)
  const staffEmail = 'staff@trialscale.dev'
  if (!(await identityRepository.findUserByEmail(staffEmail))) {
    await identityRepository.createUser({
      email: staffEmail,
      password_hash: passwordHash,
      name: 'Equipe TrialScale',
      is_staff: true,
    })
  }

  return { tenantIds }
}

if (require.main === module) {
  seedDev()
    .then(({ tenantIds }) => {
      // eslint-disable-next-line no-console
      console.log(
        `Seeds ok (tenants ${tenantIds.join(', ')}). Usuários *@alfa.dev / *@beta.dev (CPC), admin@gama.dev / admin@delta.dev (ORPC) / staff@trialscale.dev — senha: ${SEED_PASSWORD}`,
      )
      process.exit(0)
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Falha nos seeds:', err)
      process.exit(1)
    })
}
