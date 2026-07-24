/** Etapa 3: gating freemium, priorização e rodadas (spec 004). */
import { runWithContext } from '../../src/context/request-context'
import { priorityService } from '../../src/services/priority-service'
import { roundService } from '../../src/services/round-service'
import { journeyService } from '../../src/services/journey-service'
import { assessmentService } from '../../src/services/assessment-service'
import { maturityService } from '../../src/services/maturity-service'
import { contentService, type DraftGraphInput } from '../../src/services/content-service'
import { objectiveRepository } from '../../src/repositories/journey-repository'
import { priorityLookupRepository } from '../../src/repositories/paid-journey-repository'
import { identityRepository } from '../../src/repositories/identity-repository'
import { request, registerAndLogin } from '../helpers/http'
import { truncateAll, closeDb } from '../helpers/db'
import { ConflictError, ValidationFailedError } from '../../src/errors/domain-errors'

let tenantA: number
let userId: number
const ctx = (tenantId: number) => ({
  requestId: 'p',
  userId,
  tenantId,
  role: 'administrador' as const,
  isStaff: false,
})

/** Publica um processo simples com 1 essencial N2 e 1 essencial N3. */
async function publicarProcesso(code: string, name: string) {
  const p = await contentService.createProcess({ code, name, processGroup: 'central' })
  const draft = await contentService.createDraft(p.id, null)
  const graph: DraftGraphInput = {
    levels: [{ number: 1, description: 'inicial' }],
    artifacts: [
      { logicalKey: `${code}-e2`, typeCode: 'pop', title: `${name} essencial N2`, dodText: 'dod', seals: ['T'], ownLevel: 2, ownClassification: 'essencial' },
      { logicalKey: `${code}-e3`, typeCode: 'pop', title: `${name} essencial N3`, dodText: 'dod', seals: ['T'], ownLevel: 3, ownClassification: 'essencial' },
    ],
  }
  await contentService.saveDraft(draft.versionId, graph)
  await contentService.publish(draft.versionId, null)
  return p.id
}

async function subirNivel(tenantId: number, processId: number) {
  await runWithContext(ctx(tenantId), async () => {
    const m = await maturityService.computeProcess(processId)
    const alvo = m.artifacts.find((a) => a.level === 2 && a.state !== 'completo')
    if (alvo) await assessmentService.markState(alvo.artifactId, 'completo', null)
  })
}

beforeEach(async () => {
  await truncateAll()
  const ta = await identityRepository.createTenant({ name: 'Centro P' })
  tenantA = ta.get('id') as number
  const u = await identityRepository.createUser({ email: 'p@p.dev', password_hash: 'x', name: 'P' })
  userId = u.get('id') as number
})

afterAll(closeDb)

describe('gating freemium (HTTP)', () => {
  it('gratuito: termômetro/fotografia abertos; Raio-X/priorização/rodadas → 403 PLAN_REQUIRED; assinar destrava', async () => {
    const sessao = await registerAndLogin('gating')
    const h = { Authorization: `Bearer ${sessao.accessToken}` }

    // Gratuito continua com a jornada free
    expect((await request().get('/api/thermometer').set(h)).status).toBe(200)
    expect((await request().get('/api/photo').set(h)).status).toBe(200)

    // Pago bloqueado com código próprio
    const bloqueado = await request().get('/api/processes').set(h)
    expect(bloqueado.status).toBe(403)
    expect(bloqueado.body.code).toBe('PLAN_REQUIRED')
    expect((await request().get('/api/priorities').set(h)).status).toBe(403)
    expect((await request().get('/api/rounds/current').set(h)).status).toBe(403)

    // Assinatura simulada (admin) destrava e aparece na sessão
    const sub = await request().post('/api/billing/subscribe').set(h).send({ planCode: 'autosservico' })
    expect(sub.status).toBe(200)
    expect((await request().get('/api/processes').set(h)).status).toBe(200)
    const me = await request().get('/api/me').set(h)
    expect(me.body.tenant.planCode).toBe('autosservico')
  })
})

describe('priorização', () => {
  it('score cruza dor (60%) e relevância estratégica (40%); risco silencioso marcado', async () => {
    const p1 = await publicarProcesso('T1', 'Alta dor sem estrategia')
    const p2 = await publicarProcesso('T2', 'Dor media com estrategia')
    const p3 = await publicarProcesso('T3', 'Risco silencioso')
    const [obj] = await objectiveRepository.findOrCreate('Tema', 'Objetivo estratégico')
    const objId = obj.get('id') as number
    await priorityLookupRepository.createWeight(objId, p2, 3)

    await runWithContext(ctx(tenantA), async () => {
      await journeyService.saveMyObjectives([objId])
      await journeyService.scorePain(p1, 5) // dor máxima, sem relevância
      await journeyService.scorePain(p2, 3) // dor média, relevância máxima
      await journeyService.scorePain(p3, 1) // dor baixa + nível 1 → risco silencioso

      const { items } = await priorityService.computePriorities()
      const i1 = items.find((i) => i.processId === p1)!
      const i2 = items.find((i) => i.processId === p2)!
      const i3 = items.find((i) => i.processId === p3)!

      expect(i1.score).toBe(60) // painNorm 1 → 0.6
      expect(i2.score).toBe(70) // painNorm 0.5*0.6 + rel 1*0.4 = 0.70
      expect(i2.relevance).toBe(100)
      expect(i3.silentRisk).toBe(true)
      expect(i1.silentRisk).toBe(false)
      // ordenação: maior score primeiro
      expect(items.findIndex((i) => i.processId === p2)).toBeLessThan(
        items.findIndex((i) => i.processId === p1),
      )
    })
  })
})

describe('rodadas', () => {
  it('cria com baseline, exige 3-4 publicados, uma aberta por vez', async () => {
    const ids = [
      await publicarProcesso('R1', 'Rodada 1'),
      await publicarProcesso('R2', 'Rodada 2'),
      await publicarProcesso('R3', 'Rodada 3'),
    ]
    await runWithContext(ctx(tenantA), async () => {
      await expect(roundService.create(ids.slice(0, 2), null)).rejects.toThrow(ValidationFailedError)

      const { sequenceNo } = await roundService.create(ids, 6)
      expect(sequenceNo).toBe(1)
      const atual = await roundService.current()
      expect(atual!.processes).toHaveLength(3)
      expect(atual!.processes.every((p) => p.baselineLevel === 1)).toBe(true)
      expect(atual!.challengeDeadline).not.toBeNull()
      expect(atual!.canConclude).toBe(false)

      await expect(roundService.create(ids, null)).rejects.toThrow(ConflictError) // já há aberta
    })
  })

  it('conclui SÓ quando todos sobem 1 nível; celebração devolve de→para', async () => {
    const ids = [
      await publicarProcesso('C1', 'Conclui 1'),
      await publicarProcesso('C2', 'Conclui 2'),
      await publicarProcesso('C3', 'Conclui 3'),
    ]
    await runWithContext(ctx(tenantA), () => roundService.create(ids, null))

    await subirNivel(tenantA, ids[0]!)
    await subirNivel(tenantA, ids[1]!)
    await runWithContext(ctx(tenantA), async () => {
      await expect(roundService.conclude()).rejects.toThrow(ConflictError) // falta o 3º
    })

    await subirNivel(tenantA, ids[2]!)
    await runWithContext(ctx(tenantA), async () => {
      const celebracao = await roundService.conclude()
      expect(celebracao.processes).toHaveLength(3)
      expect(celebracao.processes.every((p) => p.to > p.from)).toBe(true)
      expect(await roundService.current()).toBeNull() // fechada

      // próxima rodada ganha sequence 2
      const { sequenceNo } = await roundService.create(ids, null)
      expect(sequenceNo).toBe(2)
    })
  })

  it('kanban agrupa artefatos até o próximo nível por estado', async () => {
    const ids = [
      await publicarProcesso('K1', 'Kanban 1'),
      await publicarProcesso('K2', 'Kanban 2'),
      await publicarProcesso('K3', 'Kanban 3'),
    ]
    await runWithContext(ctx(tenantA), async () => {
      await roundService.create(ids, null)
      const board = await roundService.kanban()
      // nível 1 → alvo 2: um essencial N2 por processo, todos não iniciados
      expect(board.columns.nao_iniciado).toHaveLength(3)
      expect(board.columns.completo).toHaveLength(0)
    })

    await subirNivel(tenantA, ids[0]!) // completa o N2 do K1
    await runWithContext(ctx(tenantA), async () => {
      const board = await roundService.kanban()
      expect(board.columns.completo).toHaveLength(1)
      // K1 subiu para nível 2 → alvo 3: o N3 do K1 entra no board
      expect(
        (board.columns.nao_iniciado as Array<{ processCode: string }>).filter((c) => c.processCode === 'K1'),
      ).toHaveLength(1)
    })
  })
})
