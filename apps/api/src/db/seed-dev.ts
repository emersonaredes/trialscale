import { sequelize } from './sequelize'
import { runWithContext } from '../context/request-context'
import { identityRepository } from '../repositories/identity-repository'
import { consentRepository, tenantSpecialtyRepository } from '../repositories/center-repositories'
import { passwordHasher } from '../adapters/password-hasher'
import type { Role } from '../context/request-context'

/**
 * Seeds de desenvolvimento (idempotentes): 2 centros × (admin, coordenador,
 * membro) + 1 staff TrialScale. Base da suíte de isolamento e do smoke manual.
 * Senha de TODOS os usuários de teste: 'TrialScale#2026' (SÓ dev/teste).
 */
export const SEED_PASSWORD = 'TrialScale#2026'

interface SeedTenant {
  name: string
  cidade: string
  estado: string
  users: Array<{ email: string; name: string; role: Role }>
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

    await sequelize.transaction(async (trx) => {
      const tenant = await identityRepository.createTenant(
        {
          name: t.name,
          tipo_instituicao: 'privada',
          cidade: t.cidade,
          estado: t.estado,
          protocolos_ativos_faixa: '11_30',
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
        `Seeds ok (tenants ${tenantIds.join(', ')}). Usuários *@alfa.dev / *@beta.dev / staff@trialscale.dev — senha: ${SEED_PASSWORD}`,
      )
      process.exit(0)
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Falha nos seeds:', err)
      process.exit(1)
    })
}
