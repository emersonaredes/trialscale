/** Jornada gratuita (spec 003, CA-1..CA-7): objetivos, termômetro, fotografia. */
import { runWithContext } from '../../src/context/request-context'
import { journeyService } from '../../src/services/journey-service'
import { contentService } from '../../src/services/content-service'
import { objectiveRepository } from '../../src/repositories/journey-repository'
import { identityRepository } from '../../src/repositories/identity-repository'
import { seedJourney } from '../../src/db/seed-journey'
import { ValidationFailedError } from '../../src/errors/domain-errors'
import { truncateAll, closeDb } from '../helpers/db'

let tenantA: number
let tenantB: number
let userId: number
const ctx = (tenantId: number) => ({
  requestId: 'j',
  userId,
  tenantId,
  role: 'administrador' as const,
  isStaff: false,
})

beforeEach(async () => {
  await truncateAll()
  const ta = await identityRepository.createTenant({ name: 'A' })
  const tb = await identityRepository.createTenant({ name: 'B' })
  tenantA = ta.get('id') as number
  tenantB = tb.get('id') as number
  const u = await identityRepository.createUser({ email: 'j@j.dev', password_hash: 'x', name: 'J' })
  userId = u.get('id') as number
})

afterAll(closeDb)

describe('objetivos estratégicos', () => {
  it('CA-4: salva com ordem, regrava substituindo, rejeita inexistente e repetido', async () => {
    const [o1] = await objectiveRepository.findOrCreate('Tema X', 'Objetivo 1')
    const [o2] = await objectiveRepository.findOrCreate('Tema X', 'Objetivo 2')
    const [o3] = await objectiveRepository.findOrCreate('Tema Y', 'Objetivo 3')
    const id1 = o1.get('id') as number
    const id2 = o2.get('id') as number
    const id3 = o3.get('id') as number

    await runWithContext(ctx(tenantA), async () => {
      await journeyService.saveMyObjectives([id2, id1])
      let meus = await journeyService.getMyObjectives()
      expect(meus.map((m) => m.objectiveId)).toEqual([id2, id1]) // ordem = prioridade
      expect(meus[0]!.rank).toBe(1)

      // Regravar substitui a seleção inteira
      await journeyService.saveMyObjectives([id3])
      meus = await journeyService.getMyObjectives()
      expect(meus.map((m) => m.objectiveId)).toEqual([id3])

      await expect(journeyService.saveMyObjectives([99999])).rejects.toThrow(ValidationFailedError)
      await expect(journeyService.saveMyObjectives([id1, id1])).rejects.toThrow(ValidationFailedError)
    })
  })

  it('CA-6: objetivos de A não aparecem para B', async () => {
    const [o1] = await objectiveRepository.findOrCreate('Tema X', 'Objetivo 1')
    await runWithContext(ctx(tenantA), () =>
      journeyService.saveMyObjectives([o1.get('id') as number]),
    )
    await runWithContext(ctx(tenantB), async () => {
      expect(await journeyService.getMyObjectives()).toHaveLength(0)
    })
  })
})

describe('termômetro e fotografia', () => {
  async function criarCatalogo() {
    // 2 publicáveis não é necessário: termômetro lê o CATÁLOGO (CA-1)
    const p1 = await contentService.createProcess({ code: '1.1', name: 'P1', processGroup: 'central', oneLineDescription: 'd1' })
    const p2 = await contentService.createProcess({ code: '2.5', name: 'P2', processGroup: 'central', oneLineDescription: 'd2' })
    const p3 = await contentService.createProcess({ code: '5', name: 'P3', processGroup: 'suporte', oneLineDescription: 'd3' })
    return { p1: p1.id, p2: p2.id, p3: p3.id }
  }

  it('CA-1/CA-3: lista o catálogo inteiro com salvar/retomar e progresso', async () => {
    const { p1, p2 } = await criarCatalogo()
    await runWithContext(ctx(tenantA), async () => {
      let t = await journeyService.getThermometer()
      expect(t.total).toBe(3)
      expect(t.answered).toBe(0)
      expect(t.processes.every((p) => p.published === false)).toBe(true)

      await journeyService.scorePain(p1, 4)
      await journeyService.scorePain(p2, 2)
      t = await journeyService.getThermometer()
      expect(t.answered).toBe(2) // parcial persistido (retomar)
      expect(t.processes.find((p) => p.processId === p1)?.score).toBe(4)
    })
  })

  it('CA-2: nota é upsert; fora de 1..5 → erro', async () => {
    const { p1 } = await criarCatalogo()
    await runWithContext(ctx(tenantA), async () => {
      await journeyService.scorePain(p1, 5)
      await journeyService.scorePain(p1, 1) // regrava
      const t = await journeyService.getThermometer()
      expect(t.processes.find((p) => p.processId === p1)?.score).toBe(1)
      expect(t.answered).toBe(1)

      await expect(journeyService.scorePain(p1, 0)).rejects.toThrow(ValidationFailedError)
      await expect(journeyService.scorePain(p1, 6)).rejects.toThrow(ValidationFailedError)
    })
  })

  it('CA-5: fotografia agrega médias por grupo e top dores com desempate por código', async () => {
    const { p1, p2, p3 } = await criarCatalogo()
    await runWithContext(ctx(tenantA), async () => {
      await journeyService.scorePain(p1, 5)
      await journeyService.scorePain(p2, 5)
      await journeyService.scorePain(p3, 2)

      const foto = await journeyService.getPhoto()
      expect(foto.answered).toBe(3)
      const central = foto.groups.find((g) => g.group === 'central')!
      expect(central.averagePain).toBe(5)
      const suporte = foto.groups.find((g) => g.group === 'suporte')!
      expect(suporte.averagePain).toBe(2)
      // top: dois com nota 5 — desempate pelo código (1.1 antes de 2.5)
      expect(foto.topPains.map((p) => p.code)).toEqual(['1.1', '2.5', '5'])
    })
  })

  it('CA-6: notas de A invisíveis para B', async () => {
    const { p1 } = await criarCatalogo()
    await runWithContext(ctx(tenantA), () => journeyService.scorePain(p1, 5))
    await runWithContext(ctx(tenantB), async () => {
      const t = await journeyService.getThermometer()
      expect(t.answered).toBe(0)
    })
  })
})

describe('seed da jornada (CA-7)', () => {
  it('completa o catálogo para 28 processos e é idempotente', async () => {
    // seed dos 5 do MVP primeiro não é necessário: seedJourney cria os 23 restantes
    const r1 = await seedJourney()
    expect(r1.processosNovos).toBe(23)
    const r2 = await seedJourney()
    expect(r2.processosNovos).toBe(0) // idempotente

    await runWithContext(ctx(tenantA), async () => {
      const t = await journeyService.getThermometer()
      expect(t.total).toBe(23) // + os 5 do MVP no dev = 28
      expect(t.processes.every((p) => (p.oneLineDescription ?? '').length > 10)).toBe(true)
    })
  })
})
