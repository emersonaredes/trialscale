/**
 * PT-0069 — edição de código/nome do processo no CMS + ordenação natural
 * do catálogo (O2 antes de O10; sem código vai para o fim).
 */
import { contentService } from '../../src/services/content-service'
import { contentRepository } from '../../src/repositories/content-repository'
import { ConflictError } from '../../src/errors/domain-errors'
import { truncateAll, closeDb } from '../helpers/db'

let idO1 = 0
let idO2 = 0

beforeEach(async () => {
  await truncateAll()
  idO1 = (await contentService.createProcess({ code: 'O1', name: 'Primeiro', processGroup: 'central', orgType: 'orpc' })).id
  idO2 = (await contentService.createProcess({ code: 'O2', name: 'Segundo', processGroup: 'central', orgType: 'orpc' })).id
  await contentService.createProcess({ code: 'O10', name: 'Décimo', processGroup: 'central', orgType: 'orpc' })
  await contentService.createProcess({ code: null, name: 'Sem código', processGroup: 'suporte' })
})

afterAll(closeDb)

describe('ordenação natural do catálogo', () => {
  it('ordena O1 < O2 < O10 e deixa processos sem código no fim', async () => {
    const codes = (await contentRepository.listProcesses()).map((p) => p.get('code'))
    expect(codes).toEqual(['O1', 'O2', 'O10', null])
  })
})

describe('edição de código e nome no CMS', () => {
  it('atualiza código e nome; a ordenação reflete o novo código', async () => {
    await contentService.updateProcess(idO2, { code: 'O0', name: 'Renomeado' })
    const processos = await contentRepository.listProcesses()
    expect(processos[0]!.get('code')).toBe('O0')
    expect(processos[0]!.get('name')).toBe('Renomeado')
  })

  it('rejeita código já usado por OUTRO processo', async () => {
    await expect(contentService.updateProcess(idO2, { code: 'O1' })).rejects.toThrow(ConflictError)
  })

  it('aceita salvar mantendo o próprio código (sem falso conflito)', async () => {
    await expect(contentService.updateProcess(idO1, { code: 'O1', name: 'Primeiro v2' })).resolves.toBeUndefined()
  })

  it('remove o código com null', async () => {
    await contentService.updateProcess(idO1, { code: null })
    const p = await contentRepository.findProcessById(idO1)
    expect(p!.get('code')).toBeNull()
  })
})
