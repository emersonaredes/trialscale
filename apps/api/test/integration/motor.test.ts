/**
 * SUÍTE PERMANENTE 2 — bordas do MOTOR DE CÁLCULO (constituição §4; spec 002
 * CA-1..CA-7). Usa o fluxo real: CMS cria/publica conteúdo → centro marca →
 * motor calcula.
 */
import { runWithContext } from '../../src/context/request-context'
import { contentService, type DraftGraphInput } from '../../src/services/content-service'
import { maturityService } from '../../src/services/maturity-service'
import { assessmentService } from '../../src/services/assessment-service'
import { identityRepository } from '../../src/repositories/identity-repository'
import { contentRepository } from '../../src/repositories/content-repository'
import { ValidationFailedError } from '../../src/errors/domain-errors'
import { truncateAll, closeDb } from '../helpers/db'

let tenantPrivado: number
let tenantPublico: number
let userId: number

const ctx = (tenantId: number) => ({
  requestId: 'motor-test',
  userId,
  tenantId,
  role: 'administrador' as const,
  isStaff: false,
})

/** Conteúdo mínimo: 2 processos; artefato compartilhado (dono A → B);
 *  condicional centro_publico; essenciais e complementares. */
async function publicarConteudoBase() {
  const a = await contentService.createProcess({
    code: 'TA',
    name: 'Processo A (dono)',
    processGroup: 'suporte',
  })
  const b = await contentService.createProcess({
    code: 'TB',
    name: 'Processo B (referencia)',
    processGroup: 'central',
  })

  const graphA: DraftGraphInput = {
    levels: [{ number: 1, description: 'inicial' }],
    artifacts: [
      {
        logicalKey: 'a-ess-n2',
        typeCode: 'pop',
        title: 'A essencial N2',
        dodText: 'dod',
        seals: ['T'],
        ownLevel: 2,
        ownClassification: 'essencial',
      },
      {
        logicalKey: 'a-comp-n2',
        typeCode: 'registro',
        title: 'A complementar N2',
        dodText: 'dod',
        seals: ['D'],
        ownLevel: 2,
        ownClassification: 'complementar',
      },
      {
        logicalKey: 'compartilhado',
        typeCode: 'registro',
        title: 'Artefato compartilhado (dono A)',
        dodText: 'dod',
        seals: ['T'],
        ownLevel: 3,
        ownClassification: 'essencial',
        extraPlacements: [{ processId: b.id, level: 2, classification: 'essencial' }],
      },
      {
        logicalKey: 'a-condicional-publico',
        typeCode: 'pop',
        title: 'Só para centro público',
        dodText: 'dod',
        seals: ['A'],
        conditionCode: 'centro_publico',
        ownLevel: 2,
        ownClassification: 'essencial',
      },
    ],
  }
  const graphB: DraftGraphInput = {
    levels: [{ number: 1, description: 'inicial' }],
    artifacts: [
      {
        logicalKey: 'b-ess-n2',
        typeCode: 'pop',
        title: 'B essencial N2',
        dodText: 'dod',
        seals: ['T'],
        ownLevel: 2,
        ownClassification: 'essencial',
      },
    ],
  }

  const draftA = await contentService.createDraft(a.id, null)
  await contentService.saveDraft(draftA.versionId, graphA)
  await contentService.publish(draftA.versionId, null)
  const draftB = await contentService.createDraft(b.id, null)
  await contentService.saveDraft(draftB.versionId, graphB)
  await contentService.publish(draftB.versionId, null)
  return { processA: a.id, processB: b.id }
}

async function marcarCompleto(tenantId: number, logicalKey: string, processId: number) {
  await runWithContext(ctx(tenantId), async () => {
    const m = await maturityService.computeProcess(processId)
    const alvo = m.artifacts.find((x) => x.logicalKey === logicalKey)
    if (!alvo) throw new Error(`artefato ${logicalKey} não encontrado no processo ${processId}`)
    await assessmentService.markState(alvo.artifactId, 'completo', null)
  })
}

beforeEach(async () => {
  await truncateAll()
  const tp = await identityRepository.createTenant({
    name: 'Centro Privado',
    tipo_instituicao: 'privada',
  })
  const tpub = await identityRepository.createTenant({
    name: 'Centro Público',
    tipo_instituicao: 'publica',
  })
  tenantPrivado = tp.get('id') as number
  tenantPublico = tpub.get('id') as number
  const u = await identityRepository.createUser({ email: 'm@m.dev', password_hash: 'x', name: 'M' })
  userId = u.get('id') as number
})

afterAll(closeDb)

describe('motor de cálculo — bordas (suíte permanente 2)', () => {
  it('CA-1: nível sobe só com TODOS os essenciais; complementar não trava', async () => {
    const { processA } = await publicarConteudoBase()

    // Centro privado: condicional centro_publico NÃO conta (CA-3).
    // Essenciais N2 aplicáveis: a-ess-n2. Complementar a-comp-n2 fica de fora do gate.
    await runWithContext(ctx(tenantPrivado), async () => {
      expect((await maturityService.computeProcess(processA)).level).toBe(1)
    })

    await marcarCompleto(tenantPrivado, 'a-ess-n2', processA)
    await runWithContext(ctx(tenantPrivado), async () => {
      const m = await maturityService.computeProcess(processA)
      expect(m.level).toBe(2) // complementar pendente não travou
      expect(m.complementaryComplete).toBe(0)
    })

    // N3 exige o compartilhado (essencial N3)
    await marcarCompleto(tenantPrivado, 'compartilhado', processA)
    await runWithContext(ctx(tenantPrivado), async () => {
      expect((await maturityService.computeProcess(processA)).level).toBe(5) // sem essenciais N4/N5 → topo
    })
  })

  it('CA-2: compartilhado marcado UMA vez conta no dono e em quem referencia', async () => {
    const { processA, processB } = await publicarConteudoBase()
    await marcarCompleto(tenantPrivado, 'b-ess-n2', processB)

    // B ainda nível 1: o compartilhado (colocado em B no N2, essencial) está pendente
    await runWithContext(ctx(tenantPrivado), async () => {
      expect((await maturityService.computeProcess(processB)).level).toBe(1)
    })

    // Marca o compartilhado UMA vez (via processo A, o dono)
    await marcarCompleto(tenantPrivado, 'compartilhado', processA)

    await runWithContext(ctx(tenantPrivado), async () => {
      const b = await maturityService.computeProcess(processB)
      expect(b.level).toBe(5) // contou em B sem marcar de novo
      const compartilhadoEmB = b.artifacts.find((a) => a.logicalKey === 'compartilhado')
      expect(compartilhadoEmB?.shared).toBe(true)
      expect(compartilhadoEmB?.state).toBe('completo')
    })
  })

  it('CA-3: condicional entra para centro público e sai (visível) para privado', async () => {
    const { processA } = await publicarConteudoBase()

    await runWithContext(ctx(tenantPrivado), async () => {
      const m = await maturityService.computeProcess(processA)
      expect(m.artifacts.some((a) => a.logicalKey === 'a-condicional-publico')).toBe(false)
      expect(m.excludedByCondition).toEqual([
        { title: 'Só para centro público', conditionCode: 'centro_publico' },
      ])
    })

    await runWithContext(ctx(tenantPublico), async () => {
      const m = await maturityService.computeProcess(processA)
      expect(m.artifacts.some((a) => a.logicalKey === 'a-condicional-publico')).toBe(true)
      expect(m.excludedByCondition).toHaveLength(0)
    })

    // Para o público, o condicional é essencial N2: sem ele não sobe
    await marcarCompleto(tenantPublico, 'a-ess-n2', processA)
    await runWithContext(ctx(tenantPublico), async () => {
      expect((await maturityService.computeProcess(processA)).level).toBe(1)
    })
    await marcarCompleto(tenantPublico, 'a-condicional-publico', processA)
    await runWithContext(ctx(tenantPublico), async () => {
      expect((await maturityService.computeProcess(processA)).level).toBe(2)
    })
  })

  it('CA-4: processo N/A sai do nível geral, com justificativa obrigatória', async () => {
    const { processA, processB } = await publicarConteudoBase()
    await marcarCompleto(tenantPrivado, 'a-ess-n2', processA)
    await marcarCompleto(tenantPrivado, 'compartilhado', processA) // A nível 5

    await runWithContext(ctx(tenantPrivado), async () => {
      // justificativa obrigatória
      await expect(
        assessmentService.setProcessApplicability(processB, false, ''),
      ).rejects.toThrow(ValidationFailedError)

      await assessmentService.setProcessApplicability(processB, false, 'Centro não conduz este processo.')
      const overview = await maturityService.computeOverview()
      expect(overview.processes.find((p) => p.processId === processB)?.applies).toBe(false)
      expect(overview.overallLevel).toBe(5) // média só do processo A
    })
  })

  it('CA-5 (ADR 002): publicar v2 migra marcações por logical_key e recalcula', async () => {
    const { processA } = await publicarConteudoBase()
    await marcarCompleto(tenantPrivado, 'a-ess-n2', processA)
    await marcarCompleto(tenantPrivado, 'compartilhado', processA)
    await runWithContext(ctx(tenantPrivado), async () => {
      expect((await maturityService.computeProcess(processA)).level).toBe(5)
    })

    // v2: mantém a-ess-n2 e compartilhado; ADICIONA novo essencial N2
    const draft = await contentService.createDraft(processA, null)
    const graph = await contentService.getVersionGraph(draft.versionId)
    await contentService.saveDraft(draft.versionId, {
      levels: graph.levels.map((l) => ({ number: l.number, description: l.description })),
      artifacts: [
        ...graph.artifacts.map((a) => ({
          logicalKey: a.logicalKey,
          typeCode: a.typeCode,
          title: a.title,
          dodText: a.dodText,
          seals: a.seals as string[],
          conditionCode: a.conditionCode,
          ownLevel: a.ownLevel,
          ownClassification: a.ownClassification,
          extraPlacements: a.extraPlacements,
        })),
        {
          logicalKey: 'novo-essencial-v2',
          typeCode: 'pop',
          title: 'Novo essencial da v2',
          dodText: 'dod',
          seals: ['G'],
          ownLevel: 2,
          ownClassification: 'essencial',
        },
      ],
    })
    const { migratedAssessments } = await contentService.publish(draft.versionId, null)
    expect(migratedAssessments).toBeGreaterThanOrEqual(2) // as duas marcações migraram

    await runWithContext(ctx(tenantPrivado), async () => {
      const m = await maturityService.computeProcess(processA)
      // marcações antigas MIGRARAM (continuam completas)...
      expect(m.artifacts.find((a) => a.logicalKey === 'a-ess-n2')?.state).toBe('completo')
      // ...o novo aparece não iniciado e o nível CAIU (recalcular automático)
      expect(m.artifacts.find((a) => a.logicalKey === 'novo-essencial-v2')?.state).toBe('nao_iniciado')
      expect(m.level).toBe(1)
    })
  })

  it('CA-6 (ADR 002): rascunho é invisível; só a publicação muda o que conta', async () => {
    const { processA } = await publicarConteudoBase()
    const draft = await contentService.createDraft(processA, null)
    const graph = await contentService.getVersionGraph(draft.versionId)
    await contentService.saveDraft(draft.versionId, {
      levels: graph.levels.map((l) => ({ number: l.number, description: l.description })),
      artifacts: [
        {
          logicalKey: 'so-no-rascunho',
          typeCode: 'pop',
          title: 'Só no rascunho',
          dodText: 'dod',
          seals: ['T'],
          ownLevel: 2,
          ownClassification: 'essencial',
        },
      ],
    })

    // Antes de publicar: centro continua vendo a v1 (4 artefatos p/ público)
    await runWithContext(ctx(tenantPublico), async () => {
      const m = await maturityService.computeProcess(processA)
      expect(m.artifacts.some((a) => a.logicalKey === 'so-no-rascunho')).toBe(false)
      expect(m.artifacts).toHaveLength(4)
    })

    await contentService.publish(draft.versionId, null)
    await runWithContext(ctx(tenantPublico), async () => {
      const m = await maturityService.computeProcess(processA)
      expect(m.artifacts.map((a) => a.logicalKey)).toEqual(['so-no-rascunho'])
    })
  })

  it('CA-7: data-limite só no estado "em elaboração"', async () => {
    const { processA } = await publicarConteudoBase()
    await runWithContext(ctx(tenantPrivado), async () => {
      const m = await maturityService.computeProcess(processA)
      const alvo = m.artifacts[0]!
      await expect(
        assessmentService.markState(alvo.artifactId, 'completo', '2026-08-01'),
      ).rejects.toThrow(ValidationFailedError)
      await assessmentService.markState(alvo.artifactId, 'em_elaboracao', '2026-08-01')
      const depois = await maturityService.computeProcess(processA)
      expect(depois.artifacts.find((a) => a.artifactId === alvo.artifactId)?.expectedDueDate).toBe(
        '2026-08-01',
      )
    })
  })

  it('publicação exige rascunho com artefatos; rascunho duplicado é bloqueado', async () => {
    const p = await contentService.createProcess({ code: 'TX', name: 'X', processGroup: 'gestao' })
    const draft = await contentService.createDraft(p.id, null)
    await expect(contentService.publish(draft.versionId, null)).rejects.toThrow(ValidationFailedError)
    await expect(contentService.createDraft(p.id, null)).rejects.toThrow()
    // só uma publicada por processo (AC-11) — garantido pelo fluxo + índice único
    const published = await contentRepository.findPublishedVersion(p.id)
    expect(published).toBeNull()
  })
})
