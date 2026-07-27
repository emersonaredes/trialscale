/**
 * Regressão PT-0065 — templates anexados a artefatos do CMS devem sobreviver
 * ao ciclo editorial completo: salvar rascunho de novo (rebuild do graph),
 * publicar e abrir novo rascunho (clone). Bug original: saveDraft apagava e
 * recriava os artefatos sem tratar artifact_template (FK RESTRICT) → 500.
 */
import { contentService, type DraftGraphInput } from '../../src/services/content-service'
import { contentRepository } from '../../src/repositories/content-repository'
import { truncateAll, closeDb } from '../helpers/db'

const GRAPH: DraftGraphInput = {
  levels: [{ number: 1, description: 'inicial' }],
  artifacts: [
    {
      logicalKey: 'com-template',
      typeCode: 'pop',
      title: 'Artefato com template',
      dodText: 'dod',
      seals: ['T'],
      ownLevel: 2,
      ownClassification: 'essencial',
    },
    {
      logicalKey: 'sem-template',
      typeCode: 'registro',
      title: 'Artefato sem template',
      dodText: 'dod',
      seals: ['D'],
      ownLevel: 2,
      ownClassification: 'complementar',
    },
  ],
}

async function anexar(artifactId: number, filename = 'modelo.pdf', ref = 'ref-1.pdf') {
  await contentRepository.createTemplate({
    artifact_id: artifactId,
    file_ref: ref,
    filename,
    mime_type: 'application/pdf',
    size_bytes: 123,
  })
}

async function artefatoDoGraph(versionId: number, logicalKey: string) {
  const graph = await contentService.getVersionGraph(versionId)
  const artefato = graph.artifacts.find((a) => a.logicalKey === logicalKey)
  if (!artefato) throw new Error(`artefato ${logicalKey} não encontrado na versão ${versionId}`)
  return artefato
}

let processId: number
let draftId: number

beforeEach(async () => {
  await truncateAll()
  const p = await contentService.createProcess({
    code: 'TT',
    name: 'Processo com templates',
    processGroup: 'suporte',
  })
  processId = p.id
  const draft = await contentService.createDraft(processId, null)
  draftId = draft.versionId
  await contentService.saveDraft(draftId, GRAPH)
})

afterAll(closeDb)

describe('templates × ciclo editorial do CMS', () => {
  it('salvar o rascunho de novo preserva o template (bug do 500)', async () => {
    const antes = await artefatoDoGraph(draftId, 'com-template')
    await anexar(antes.id)

    // Antes do fix: ER_ROW_IS_REFERENCED_2 (FK artifact_template → artifact)
    await contentService.saveDraft(draftId, GRAPH)

    const depois = await artefatoDoGraph(draftId, 'com-template')
    expect(depois.templates).toHaveLength(1)
    expect(depois.templates[0]!.filename).toBe('modelo.pdf')
    const semTemplate = await artefatoDoGraph(draftId, 'sem-template')
    expect(semTemplate.templates).toHaveLength(0)
  })

  it('remover o artefato do rascunho descarta o template e informa o arquivo órfão', async () => {
    const antes = await artefatoDoGraph(draftId, 'com-template')
    await anexar(antes.id)

    const soSegundo: DraftGraphInput = { ...GRAPH, artifacts: [GRAPH.artifacts[1]!] }
    const { orphanFileRefs } = await contentService.saveDraft(draftId, soSegundo)

    expect(orphanFileRefs).toEqual(['ref-1.pdf'])
    const graph = await contentService.getVersionGraph(draftId)
    expect(graph.artifacts).toHaveLength(1)
  })

  it('publicar e abrir novo rascunho clona os templates (arquivos não somem no ciclo)', async () => {
    const antes = await artefatoDoGraph(draftId, 'com-template')
    await anexar(antes.id)
    await contentService.publish(draftId, null)

    const novo = await contentService.createDraft(processId, null)
    const clonado = await artefatoDoGraph(novo.versionId, 'com-template')
    expect(clonado.templates).toHaveLength(1)
    expect(clonado.templates[0]!.filename).toBe('modelo.pdf')

    // A versão publicada segue com o template dela (downloads dos centros)
    const publicado = await artefatoDoGraph(draftId, 'com-template')
    expect(publicado.templates).toHaveLength(1)
  })

  it('arquivo compartilhado entre versões só é órfão quando a última referência sai', async () => {
    const antes = await artefatoDoGraph(draftId, 'com-template')
    await anexar(antes.id)
    await contentService.publish(draftId, null)
    const novo = await contentService.createDraft(processId, null) // clona → 2 linhas p/ ref-1.pdf

    const soSegundo: DraftGraphInput = { ...GRAPH, artifacts: [GRAPH.artifacts[1]!] }
    const { orphanFileRefs } = await contentService.saveDraft(novo.versionId, soSegundo)

    // A publicada ainda referencia ref-1.pdf — o arquivo NÃO pode ser apagado
    expect(orphanFileRefs).toEqual([])
  })
})
