/** Etapa 4: conquistas (avaliação idempotente) + Mapa de Maturidade (PDF). */
import { runWithContext } from '../../src/context/request-context'
import { achievementService } from '../../src/services/achievement-service'
import { journeyService } from '../../src/services/journey-service'
import { assessmentService } from '../../src/services/assessment-service'
import { maturityService } from '../../src/services/maturity-service'
import { roundService } from '../../src/services/round-service'
import { contentService, type DraftGraphInput } from '../../src/services/content-service'
import { objectiveRepository } from '../../src/repositories/journey-repository'
import { identityRepository } from '../../src/repositories/identity-repository'
import { request, registerAndLogin } from '../helpers/http'
import { truncateAll, closeDb } from '../helpers/db'

let tenantA: number
let userId: number
const ctx = (tenantId: number) => ({
  requestId: 'g',
  userId,
  tenantId,
  role: 'administrador' as const,
  isStaff: false,
})

async function publicarProcessoSimples(code: string) {
  const p = await contentService.createProcess({ code, name: `Processo ${code}`, processGroup: 'suporte' })
  const draft = await contentService.createDraft(p.id, null)
  const graph: DraftGraphInput = {
    levels: [{ number: 1, description: 'inicial' }],
    artifacts: [
      { logicalKey: `${code}-e2`, typeCode: 'pop', title: `E2 ${code}`, dodText: 'dod', seals: ['T'], ownLevel: 2, ownClassification: 'essencial' },
      { logicalKey: `${code}-e3`, typeCode: 'pop', title: `E3 ${code}`, dodText: 'dod', seals: ['T'], ownLevel: 3, ownClassification: 'essencial' },
    ],
  }
  await contentService.saveDraft(draft.versionId, graph)
  await contentService.publish(draft.versionId, null)
  return p.id
}

async function completarAte(processId: number, nivel: number) {
  await runWithContext(ctx(tenantA), async () => {
    const m = await maturityService.computeProcess(processId)
    for (const a of m.artifacts.filter((x) => x.level <= nivel && x.state !== 'completo')) {
      await assessmentService.markState(a.artifactId, 'completo', null)
    }
  })
}

beforeEach(async () => {
  await truncateAll()
  const ta = await identityRepository.createTenant({ name: 'Centro G' })
  tenantA = ta.get('id') as number
  const u = await identityRepository.createUser({ email: 'g@g.dev', password_hash: 'x', name: 'G' })
  userId = u.get('id') as number
})

afterAll(closeDb)

describe('conquistas', () => {
  it('concede pelos marcos reais, é idempotente e nunca revoga', async () => {
    const p1 = await publicarProcessoSimples('G1')

    await runWithContext(ctx(tenantA), async () => {
      // Estado zero: nada conquistado
      let r = await achievementService.evaluate()
      expect(r.newlyEarned).toHaveLength(0)
      expect(r.achievements.every((a) => a.earnedAt === null)).toBe(true)

      // Objetivos → primeiro-passo
      const [obj] = await objectiveRepository.findOrCreate('Tema', 'Objetivo G')
      await journeyService.saveMyObjectives([obj.get('id') as number])
      r = await achievementService.evaluate()
      expect(r.newlyEarned).toEqual(['primeiro-passo'])

      // Reavaliar não duplica (idempotente)
      r = await achievementService.evaluate()
      expect(r.newlyEarned).toHaveLength(0)
      expect(r.achievements.find((a) => a.code === 'primeiro-passo')?.earnedAt).not.toBeNull()
    })

    // Completar artefato + nível 3 → primeira-trilha e primeiro-definido
    await completarAte(p1, 3)
    await runWithContext(ctx(tenantA), async () => {
      const r = await achievementService.evaluate()
      expect(r.newlyEarned).toEqual(expect.arrayContaining(['primeira-trilha', 'primeiro-definido']))
      // suporte-definido: todos os processos de suporte publicados (só G1) em nível 3+
      expect(r.newlyEarned).toContain('suporte-definido')
    })
  })

  it('primeira rodada concluída vira medalha', async () => {
    const ids = [
      await publicarProcessoSimples('R1'),
      await publicarProcessoSimples('R2'),
      await publicarProcessoSimples('R3'),
    ]
    await runWithContext(ctx(tenantA), () => roundService.create(ids, null))
    for (const id of ids) await completarAte(id, 2)
    await runWithContext(ctx(tenantA), async () => {
      await roundService.conclude()
      const r = await achievementService.evaluate()
      expect(r.newlyEarned).toContain('primeira-rodada')
    })
  })

  it('termômetro completo vira fotografia-completa', async () => {
    const p1 = await publicarProcessoSimples('F1')
    await runWithContext(ctx(tenantA), async () => {
      await journeyService.scorePain(p1, 4) // único processo do catálogo neste teste
      const r = await achievementService.evaluate()
      expect(r.newlyEarned).toContain('fotografia-completa')
    })
  })
})

describe('Mapa de Maturidade (PDF) — HTTP', () => {
  it('gated para gratuito; pagante baixa um PDF válido; conquistas exigem plano', async () => {
    const sessao = await registerAndLogin('mapa')
    const h = { Authorization: `Bearer ${sessao.accessToken}` }

    expect((await request().get('/api/report/pdf').set(h)).status).toBe(403)
    expect((await request().get('/api/achievements').set(h)).status).toBe(403)

    await request().post('/api/billing/subscribe').set(h).send({ planCode: 'autosservico' })

    const conquistas = await request().get('/api/achievements').set(h)
    expect(conquistas.status).toBe(200)
    expect(conquistas.body.achievements).toHaveLength(10)

    const pdf = await request().get('/api/report/pdf').set(h).buffer(true)
    expect(pdf.status).toBe(200)
    expect(pdf.headers['content-type']).toContain('application/pdf')
    expect(pdf.headers['content-disposition']).toContain('mapa-maturidade-trialscale')
    // PDF começa com %PDF
    expect(Buffer.from(pdf.body as Buffer).subarray(0, 4).toString()).toBe('%PDF')
  })
})
