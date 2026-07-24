/**
 * SUÍTE DE ISOLAMENTO — nível model (constituição §1: falha aqui = bloqueio
 * de merge). Prova o mecanismo central (ADR 001) direto nos models.
 */
import { runWithContext, runWithoutTenantScope } from '../../src/context/request-context'
import { Consent, TenantSpecialty } from '../../src/models'
import { identityRepository } from '../../src/repositories/identity-repository'
import {
  MissingTenantContextError,
  CrossTenantWriteError,
  BlockedModelOperationError,
} from '../../src/errors/domain-errors'
import { truncateAll, closeDb } from '../helpers/db'

let tenantA: number
let tenantB: number
let userA: number
let userB: number

const ctxA = () => ({ requestId: 't', userId: userA, tenantId: tenantA, role: 'administrador' as const, isStaff: false })
const ctxB = () => ({ requestId: 't', userId: userB, tenantId: tenantB, role: 'administrador' as const, isStaff: false })

async function criarConsent(userId: number) {
  return Consent.create({
    user_id: userId,
    consent_version: 'v1',
    consented_at: new Date(),
    text_ref: 'consent/lgpd',
  } as never)
}

beforeEach(async () => {
  await truncateAll()
  const ta = await identityRepository.createTenant({ name: 'Tenant A' })
  const tb = await identityRepository.createTenant({ name: 'Tenant B' })
  tenantA = ta.get('id') as number
  tenantB = tb.get('id') as number
  const ua = await identityRepository.createUser({ email: 'a@a.dev', password_hash: 'x', name: 'A' })
  const ub = await identityRepository.createUser({ email: 'b@b.dev', password_hash: 'x', name: 'B' })
  userA = ua.get('id') as number
  userB = ub.get('id') as number
})

afterAll(closeDb)

describe('mecanismo de escopo (ADR 001)', () => {
  it('SEM contexto: find em model tenant lança MissingTenantContextError', async () => {
    await expect(Consent.findAll()).rejects.toThrow(MissingTenantContextError)
    await expect(Consent.count()).rejects.toThrow(MissingTenantContextError)
  })

  it('SEM contexto: create em model tenant lança MissingTenantContextError', async () => {
    await expect(criarConsent(userA)).rejects.toThrow(MissingTenantContextError)
  })

  it('create injeta tenant_id do contexto, SOBRESCREVENDO valor vindo de fora', async () => {
    await runWithContext(ctxA(), async () => {
      const row = await Consent.create({
        tenant_id: tenantB, // tentativa maliciosa — deve ser ignorada
        user_id: userA,
        consent_version: 'v1',
        consented_at: new Date(),
        text_ref: 'consent/lgpd',
      } as never)
      expect(row.get('tenant_id')).toBe(tenantA)
    })
  })

  it('find/count filtram por tenant: A nunca vê linhas de B', async () => {
    await runWithContext(ctxA(), () => criarConsent(userA))
    await runWithContext(ctxB(), () => criarConsent(userB))

    await runWithContext(ctxA(), async () => {
      const rows = await Consent.findAll()
      expect(rows).toHaveLength(1)
      expect(rows[0]!.get('tenant_id')).toBe(tenantA)
      expect(await Consent.count()).toBe(1)
    })
  })

  it('bulkUpdate/bulkDestroy escopados: A não altera nem apaga dados de B', async () => {
    await runWithContext(ctxA(), () => criarConsent(userA))
    await runWithContext(ctxB(), () => criarConsent(userB))

    await runWithContext(ctxA(), async () => {
      await Consent.update({ consent_version: 'v2' } as never, { where: {} })
      await Consent.destroy({ where: {} })
    })

    await runWithContext(ctxB(), async () => {
      const rows = await Consent.findAll()
      expect(rows).toHaveLength(1) // B intacto
      expect(rows[0]!.get('consent_version')).toBe('v1') // não foi atualizado por A
    })
  })

  it('save cross-tenant falha com CrossTenantWriteError', async () => {
    const row = await runWithContext(ctxA(), () => criarConsent(userA))
    await runWithContext(ctxB(), async () => {
      row.set('consent_version', 'hack')
      await expect(row.save()).rejects.toThrow(CrossTenantWriteError)
    })
  })

  it('agregações e increment direto no model são BLOQUEADOS', async () => {
    await runWithContext(ctxA(), async () => {
      expect(() => (TenantSpecialty as never as { sum: () => void }).sum()).toThrow(
        BlockedModelOperationError,
      )
      expect(() => (TenantSpecialty as never as { max: () => void }).max()).toThrow(
        BlockedModelOperationError,
      )
      expect(() => (TenantSpecialty as never as { increment: () => void }).increment()).toThrow(
        BlockedModelOperationError,
      )
    })
  })

  it('upsert em model tenant é bloqueado', async () => {
    await runWithContext(ctxA(), async () => {
      await expect(
        Consent.upsert({
          user_id: userA,
          consent_version: 'v1',
          consented_at: new Date(),
          text_ref: 'x',
        } as never),
      ).rejects.toThrow(BlockedModelOperationError)
    })
  })

  it('runWithoutTenantScope é o único caminho sem escopo (uso interno auditável)', async () => {
    await runWithContext(ctxA(), () => criarConsent(userA))
    await runWithContext(ctxB(), () => criarConsent(userB))
    const total = await runWithoutTenantScope('teste-mecanismo', () => Consent.count())
    expect(total).toBe(2)
  })
})
