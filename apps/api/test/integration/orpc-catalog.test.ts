/**
 * SUÍTE DE ISOLAMENTO DE CATÁLOGO (PT-0067) — o equivalente, para org_type,
 * da suíte de isolamento de tenant: um ORPC nunca vê processo/objetivo CPC
 * (e vice-versa); staff/CMS vê os dois; pesos não cruzam catálogos; as
 * condições de aplicabilidade ORPC funcionam (RN-3: NULL nunca exclui).
 */
import { runWithContext, type RequestContext } from '../../src/context/request-context'
import { contentService, type DraftGraphInput } from '../../src/services/content-service'
import { contentRepository } from '../../src/repositories/content-repository'
import { objectiveRepository } from '../../src/repositories/journey-repository'
import { maturityService, conditionApplies } from '../../src/services/maturity-service'
import { priorityWeightsService } from '../../src/services/priority-weights-service'
import { identityRepository } from '../../src/repositories/identity-repository'
import { ValidationFailedError } from '../../src/errors/domain-errors'
import { truncateAll, closeDb } from '../helpers/db'

let tenantCpc: number
let tenantOrpc: number
let processCpc: number
let processOrpc: number
let objectiveCpcId: number
let objectiveOrpcId: number

const ctx = (tenantId: number, orgType: 'cpc' | 'orpc'): RequestContext => ({
  requestId: 'orpc-test',
  userId: null,
  tenantId,
  role: 'administrador',
  isStaff: false,
  orgType,
})

/** Contexto do staff/CMS: sem tenant e sem orgType — vê os dois catálogos. */
const staffCtx: RequestContext = {
  requestId: 'orpc-test-staff',
  userId: null,
  tenantId: null,
  role: null,
  isStaff: true,
}

async function publicar(processId: number, graph: DraftGraphInput) {
  const draft = await contentService.createDraft(processId, null)
  await contentService.saveDraft(draft.versionId, graph)
  await contentService.publish(draft.versionId, null)
}

beforeAll(async () => {
  await truncateAll()

  const cpc = await contentService.createProcess({
    code: 'TC',
    name: 'Processo CPC',
    processGroup: 'central',
  })
  processCpc = cpc.id
  const orpc = await contentService.createProcess({
    code: 'TO',
    name: 'Processo ORPC',
    processGroup: 'central',
    orgType: 'orpc',
  })
  processOrpc = orpc.id

  await publicar(processCpc, {
    levels: [{ number: 1, description: null }],
    artifacts: [
      { logicalKey: 'cpc-a', typeCode: 'pop', title: 'Artefato CPC', dodText: 'dod', seals: ['T'], ownLevel: 2, ownClassification: 'essencial' },
    ],
  })
  await publicar(processOrpc, {
    levels: [{ number: 1, description: null }],
    artifacts: [
      { logicalKey: 'orpc-a', typeCode: 'documento_governanca', title: 'Governança ORPC', dodText: 'dod', seals: ['R', 'I'], ownLevel: 2, ownClassification: 'essencial' },
      { logicalKey: 'orpc-fomento', typeCode: 'ferramenta', title: 'Rotina de editais', dodText: 'dod', seals: ['R'], conditionCode: 'perfil_fomento', ownLevel: 3, ownClassification: 'complementar' },
    ],
  })

  const [objCpc] = await objectiveRepository.findOrCreate('Tema CPC', 'Objetivo CPC', 'cpc')
  const [objOrpc] = await objectiveRepository.findOrCreate('Tema ORPC', 'Objetivo ORPC', 'orpc')
  objectiveCpcId = objCpc.get('id') as number
  objectiveOrpcId = objOrpc.get('id') as number

  const tCpc = await identityRepository.createTenant({ name: 'Centro CPC' })
  tenantCpc = tCpc.get('id') as number
  const tOrpc = await identityRepository.createTenant({
    name: 'ORPC Teste',
    org_type: 'orpc',
    modelo_servico: 'full_service',
    perfil_fomento: false,
  })
  tenantOrpc = tOrpc.get('id') as number
})

afterAll(closeDb)

describe('isolamento de catálogo por org_type (mecanizado no hook)', () => {
  it('tenant CPC só vê processos do catálogo CPC', async () => {
    await runWithContext(ctx(tenantCpc, 'cpc'), async () => {
      const processos = await contentRepository.listProcesses()
      const nomes = processos.map((p) => p.get('name'))
      expect(nomes).toContain('Processo CPC')
      expect(nomes).not.toContain('Processo ORPC')
    })
  })

  it('tenant ORPC só vê processos do catálogo ORPC (overview inteiro)', async () => {
    await runWithContext(ctx(tenantOrpc, 'orpc'), async () => {
      const overview = await maturityService.computeOverview()
      const ids = overview.processes.map((p) => p.processId)
      expect(ids).toContain(processOrpc)
      expect(ids).not.toContain(processCpc)
    })
  })

  it('objetivos são segmentados por org_type (zona org-lookup)', async () => {
    await runWithContext(ctx(tenantOrpc, 'orpc'), async () => {
      const objetivos = await objectiveRepository.listAll()
      const nomes = objetivos.map((o) => o.get('name'))
      expect(nomes).toContain('Objetivo ORPC')
      expect(nomes).not.toContain('Objetivo CPC')
    })
    await runWithContext(ctx(tenantCpc, 'cpc'), async () => {
      const nomes = (await objectiveRepository.listAll()).map((o) => o.get('name'))
      expect(nomes).toContain('Objetivo CPC')
      expect(nomes).not.toContain('Objetivo ORPC')
    })
  })

  it('staff (sem orgType no contexto) vê os DOIS catálogos — CMS gerencia tudo', async () => {
    await runWithContext(staffCtx, async () => {
      const nomes = (await contentRepository.listProcesses()).map((p) => p.get('name'))
      expect(nomes).toEqual(expect.arrayContaining(['Processo CPC', 'Processo ORPC']))
    })
  })
})

describe('condições de aplicabilidade ORPC (RN-3)', () => {
  const base = {
    tipo_instituicao: null,
    possui_pi_refrigerado: null,
    possui_amostras: null,
    perfil_fomento: null,
    assume_atribuicoes_anvisa: null,
    assume_farmacovigilancia: null,
  }

  it('NULL nunca exclui; false exclui; true aplica', () => {
    for (const code of ['perfil_fomento', 'assume_atribuicoes_anvisa', 'assume_farmacovigilancia']) {
      expect(conditionApplies(code, base)).toBe(true) // NULL = aplicável
      expect(conditionApplies(code, { ...base, [code]: false })).toBe(false)
      expect(conditionApplies(code, { ...base, [code]: true })).toBe(true)
    }
  })

  it('artefato condicional sai do cálculo do ORPC sem o perfil e é reportado', async () => {
    await runWithContext(ctx(tenantOrpc, 'orpc'), async () => {
      const m = await maturityService.computeProcess(processOrpc)
      expect(m.artifacts.map((a) => a.logicalKey)).not.toContain('orpc-fomento')
      expect(m.excludedByCondition.map((e) => e.conditionCode)).toContain('perfil_fomento')
    })
  })
})

describe('pesos objetivo×processo não cruzam catálogos', () => {
  it('rejeita objetivo CPC × processo ORPC (e o inverso)', async () => {
    await expect(priorityWeightsService.setWeight(objectiveCpcId, processOrpc, 2)).rejects.toThrow(
      ValidationFailedError,
    )
    await expect(priorityWeightsService.setWeight(objectiveOrpcId, processCpc, 2)).rejects.toThrow(
      ValidationFailedError,
    )
  })

  it('aceita vínculo dentro do mesmo catálogo', async () => {
    await expect(priorityWeightsService.setWeight(objectiveOrpcId, processOrpc, 3)).resolves.toBeUndefined()
  })
})
