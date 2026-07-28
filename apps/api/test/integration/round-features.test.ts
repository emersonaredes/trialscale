/**
 * Melhorias da RODADA (PT-0068): data de início/prazo, evolução previsto ×
 * realizado, responsáveis por artefato (mesmo tenant), artefato personalizado
 * (complementar, invisível a outros tenants, sobrevive à publicação).
 */
import { runWithContext, type RequestContext } from '../../src/context/request-context'
import { contentService, type DraftGraphInput } from '../../src/services/content-service'
import { roundService } from '../../src/services/round-service'
import { assessmentService } from '../../src/services/assessment-service'
import { maturityService } from '../../src/services/maturity-service'
import { identityRepository } from '../../src/repositories/identity-repository'
import { ValidationFailedError } from '../../src/errors/domain-errors'
import { truncateAll, closeDb } from '../helpers/db'

let tenantA: number
let tenantB: number
let userA1: number
let userA2: number
let userB1: number
let processos: number[] = []

const ctx = (tenantId: number, userId: number | null = null): RequestContext => ({
  requestId: 'round-test',
  userId,
  tenantId,
  role: 'administrador',
  isStaff: false,
  orgType: 'cpc',
})

function graphSimples(prefixo: string): DraftGraphInput {
  return {
    levels: [{ number: 1, description: null }],
    artifacts: [
      {
        logicalKey: `${prefixo}-ess`,
        typeCode: 'pop',
        title: `${prefixo} essencial`,
        dodText: 'dod',
        seals: ['T'],
        ownLevel: 2,
        ownClassification: 'essencial',
      },
    ],
  }
}

beforeEach(async () => {
  await truncateAll()
  processos = []
  for (const codigo of ['R1', 'R2', 'R3']) {
    const p = await contentService.createProcess({
      code: codigo,
      name: `Processo ${codigo}`,
      processGroup: 'central',
    })
    const draft = await contentService.createDraft(p.id, null)
    await contentService.saveDraft(draft.versionId, graphSimples(codigo.toLowerCase()))
    await contentService.publish(draft.versionId, null)
    processos.push(p.id)
  }

  const tA = await identityRepository.createTenant({ name: 'Centro A' })
  tenantA = tA.get('id') as number
  const tB = await identityRepository.createTenant({ name: 'Centro B' })
  tenantB = tB.get('id') as number
  const uA1 = await identityRepository.createUser({ email: 'a1@t.dev', password_hash: 'x', name: 'Ana A' })
  const uA2 = await identityRepository.createUser({ email: 'a2@t.dev', password_hash: 'x', name: 'Beto A' })
  const uB1 = await identityRepository.createUser({ email: 'b1@t.dev', password_hash: 'x', name: 'Caio B' })
  userA1 = uA1.get('id') as number
  userA2 = uA2.get('id') as number
  userB1 = uB1.get('id') as number
  await identityRepository.createMembership({ tenant_id: tenantA, user_id: userA1, role: 'administrador' })
  await identityRepository.createMembership({ tenant_id: tenantA, user_id: userA2, role: 'membro' })
  await identityRepository.createMembership({ tenant_id: tenantB, user_id: userB1, role: 'administrador' })
})

afterAll(closeDb)

describe('criação da rodada com início e prazo', () => {
  it('grava a data de início escolhida e calcula previsto × realizado', async () => {
    await runWithContext(ctx(tenantA), async () => {
      const ontem = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
      await roundService.create(processos, 4, ontem)
      const atual = (await roundService.current())!
      expect(new Date(atual.startedAt!).toISOString().slice(0, 10)).toBe(ontem)
      expect(atual.challengeWeeks).toBe(4)
      expect(atual.artifactsTotal).toBeGreaterThan(0)
      expect(atual.realizedPct).toBe(0)
      // 1 dia decorrido de 28 → ~4%
      expect(atual.expectedPct).toBeGreaterThanOrEqual(3)
      expect(atual.expectedPct).toBeLessThanOrEqual(5)
    })
  })

  it('rejeita início fora da janela razoável', async () => {
    await runWithContext(ctx(tenantA), async () => {
      await expect(roundService.create(processos, null, '2020-01-01')).rejects.toThrow(
        ValidationFailedError,
      )
    })
  })
})

describe('responsáveis por artefato (assessment)', () => {
  it('atribui múltiplos responsáveis do MESMO tenant e expõe no kanban', async () => {
    await runWithContext(ctx(tenantA, userA1), async () => {
      await roundService.create(processos, null, null)
      const m = await maturityService.computeProcess(processos[0]!)
      const artefato = m.artifacts[0]!

      await assessmentService.setAssignees(artefato.artifactId, [userA1, userA2])
      const { columns } = await roundService.kanban()
      const card = Object.values(columns)
        .flat()
        .find((c) => c.artifactId === artefato.artifactId) as { assignees: Array<{ name: string }> }
      expect(card.assignees.map((a) => a.name).sort()).toEqual(['Ana A', 'Beto A'])

      // Substituição: reduz para um
      await assessmentService.setAssignees(artefato.artifactId, [userA2])
      const detalhe = await roundService.artifactDetail(artefato.artifactId)
      expect(detalhe.assignees.map((a) => a.name)).toEqual(['Beto A'])
    })
  })

  it('rejeita responsável de OUTRO tenant', async () => {
    await runWithContext(ctx(tenantA, userA1), async () => {
      const m = await maturityService.computeProcess(processos[0]!)
      await expect(
        assessmentService.setAssignees(m.artifacts[0]!.artifactId, [userB1]),
      ).rejects.toThrow(ValidationFailedError)
    })
  })
})

describe('artefato personalizado na rodada', () => {
  it('entra como complementar, aparece no kanban e não vaza para outro tenant', async () => {
    let customId = 0
    await runWithContext(ctx(tenantA, userA1), async () => {
      await roundService.create(processos, null, null)
      const antes = await maturityService.computeProcess(processos[0]!)

      const { artifactId } = await roundService.createCustomArtifact({
        processId: processos[0]!,
        title: 'Planilha própria do centro',
        dodText: 'Planilha criada e em uso pela equipe.',
        level: 2,
      })
      customId = artifactId

      const depois = await maturityService.computeProcess(processos[0]!)
      expect(depois.complementaryTotal).toBe(antes.complementaryTotal + 1)
      expect(depois.level).toBe(antes.level) // complementar não trava nem derruba
      const status = depois.artifacts.find((a) => a.artifactId === artifactId)!
      expect(status.custom).toBe(true)
      expect(status.classification).toBe('complementar')

      const { columns } = await roundService.kanban()
      const ids = Object.values(columns).flat().map((c) => c.artifactId)
      expect(ids).toContain(artifactId)
    })

    // Outro tenant não vê o personalizado
    await runWithContext(ctx(tenantB, userB1), async () => {
      const m = await maturityService.computeProcess(processos[0]!)
      expect(m.artifacts.map((a) => a.artifactId)).not.toContain(customId)
    })
  })

  it('rejeita processo fora da rodada aberta', async () => {
    await runWithContext(ctx(tenantA, userA1), async () => {
      await roundService.create(processos.slice(0, 3), null, null)
      const outro = await contentService.createProcess({
        code: 'R9',
        name: 'Fora da rodada',
        processGroup: 'central',
      })
      const draft = await contentService.createDraft(outro.id, null)
      await contentService.saveDraft(draft.versionId, graphSimples('r9'))
      await contentService.publish(draft.versionId, null)
      await expect(
        roundService.createCustomArtifact({
          processId: outro.id,
          title: 'Não deveria entrar',
          dodText: 'dod qualquer',
          level: 2,
        }),
      ).rejects.toThrow(ValidationFailedError)
    })
  })

  it('sobrevive à publicação de nova versão do processo (re-aponte)', async () => {
    let customId = 0
    await runWithContext(ctx(tenantA, userA1), async () => {
      await roundService.create(processos, null, null)
      const r = await roundService.createCustomArtifact({
        processId: processos[0]!,
        title: 'Sobrevivente',
        dodText: 'segue vivo após publicar.',
        level: 3,
      })
      customId = r.artifactId
    })

    // Staff publica nova versão do processo (fora de contexto de tenant)
    const draft = await contentService.createDraft(processos[0]!, null)
    await contentService.saveDraft(draft.versionId, graphSimples('r1'))
    await contentService.publish(draft.versionId, null)

    await runWithContext(ctx(tenantA, userA1), async () => {
      const m = await maturityService.computeProcess(processos[0]!)
      const custom = m.artifacts.find((a) => a.artifactId === customId)
      expect(custom).toBeDefined()
      expect(custom!.custom).toBe(true)
    })
  })
})
