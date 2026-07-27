import { sequelize } from '../db/sequelize'
import { runWithoutTenantScope } from '../context/request-context'
import { contentRepository } from '../repositories/content-repository'
import { migrateAssessments } from '../repositories/assessment-repository'
import { auditService } from './audit-service'
import { ConflictError, NotFoundError, ValidationFailedError } from '../errors/domain-errors'
import type { ProcessGroup, Classification } from '../types/domain'

const LEVEL_NAMES: Record<number, string> = {
  1: 'Inicial',
  2: 'Informal',
  3: 'Definido',
  4: 'Gerenciado',
  5: 'Otimizado',
}

export interface DraftArtifactInput {
  logicalKey?: string
  typeCode: string
  title: string
  dodText: string
  whyItMatters?: string | null // texto instrutivo v4 ("por que importa")
  seals: string[]
  conditionCode?: string | null
  ownLevel: number
  ownClassification: Classification
  extraPlacements?: Array<{ processId: number; level: number; classification: Classification }>
}

export interface DraftGraphInput {
  levels: Array<{ number: number; description: string | null }>
  artifacts: DraftArtifactInput[]
}

/** Gera logical_key estável a partir do título (editável depois no CMS). */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export const contentService = {
  // -------------------------------------------------------------- processos
  async createProcess(input: {
    code: string | null
    name: string
    processGroup: ProcessGroup
    oneLineDescription?: string | null
    objectiveText?: string | null
  }) {
    if (input.code && (await contentRepository.findProcessByCode(input.code))) {
      throw new ConflictError(`Já existe um processo com o código ${input.code}.`)
    }
    const row = await contentRepository.createProcess({
      code: input.code,
      name: input.name,
      process_group: input.processGroup,
      one_line_description: input.oneLineDescription ?? null,
      objective_text: input.objectiveText ?? null,
    })
    return { id: row.get('id') as number }
  },

  async updateProcess(
    id: number,
    patch: { name?: string; oneLineDescription?: string | null; objectiveText?: string | null },
  ) {
    const process = await contentRepository.findProcessById(id)
    if (!process) throw new NotFoundError('Processo não encontrado.')
    await contentRepository.updateProcess(id, {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.oneLineDescription !== undefined
        ? { one_line_description: patch.oneLineDescription }
        : {}),
      ...(patch.objectiveText !== undefined ? { objective_text: patch.objectiveText } : {}),
    })
  },

  async listProcessesWithStatus() {
    const processes = await contentRepository.listProcesses()
    return Promise.all(
      processes.map(async (p) => {
        const id = p.get('id') as number
        const published = await contentRepository.findPublishedVersion(id)
        const draft = await contentRepository.findDraftVersion(id)
        return {
          id,
          code: p.get('code') as string | null,
          name: p.get('name') as string,
          processGroup: p.get('process_group') as string,
          oneLineDescription: p.get('one_line_description') as string | null,
          publishedVersion: published ? (published.get('version_no') as number) : null,
          draftVersionId: draft ? (draft.get('id') as number) : null,
        }
      }),
    )
  },

  // -------------------------------------------------------------- rascunho
  /** Cria rascunho: clona a versão publicada (se houver) ou nasce vazio. */
  async createDraft(processId: number, createdBy: number | null) {
    const process = await contentRepository.findProcessById(processId)
    if (!process) throw new NotFoundError('Processo não encontrado.')
    if (await contentRepository.findDraftVersion(processId)) {
      throw new ConflictError('Já existe um rascunho aberto para este processo.')
    }

    return sequelize.transaction(async (t) => {
      const versionNo = (await contentRepository.maxVersionNo(processId, t)) + 1
      const draft = await contentRepository.createVersion(
        { process_id: processId, version_no: versionNo, created_by: createdBy },
        t,
      )
      const draftId = draft.get('id') as number

      const published = await contentRepository.findPublishedVersion(processId, t)
      if (!published) {
        for (let n = 1; n <= 5; n++) {
          await contentRepository.createLevel(
            { content_version_id: draftId, number: n, name: LEVEL_NAMES[n]!, description: null },
            t,
          )
        }
        return { versionId: draftId, versionNo }
      }

      // Clona graph da publicada (logical_keys preservados — base da migração ADR 002)
      const publishedId = published.get('id') as number
      for (const level of await contentRepository.findLevelsByVersion(publishedId, t)) {
        await contentRepository.createLevel(
          {
            content_version_id: draftId,
            number: level.get('number') as number,
            name: level.get('name') as string,
            description: level.get('description') as string | null,
          },
          t,
        )
      }
      const artifacts = await contentRepository.findArtifactsByVersion(publishedId, t)
      const oldIds = artifacts.map((a) => a.get('id') as number)
      const seals = await contentRepository.findSealsByArtifactIds(oldIds, t)
      const placements = await contentRepository.findPlacementsByArtifactIds(oldIds, t)
      const templates = await contentRepository.findTemplatesByArtifactIds(oldIds, t)

      for (const artifact of artifacts) {
        const oldId = artifact.get('id') as number
        const novo = await contentRepository.createArtifact(
          {
            content_version_id: draftId,
            logical_key: artifact.get('logical_key') as string,
            artifact_type_id: artifact.get('artifact_type_id') as number,
            title: artifact.get('title') as string,
            dod_text: artifact.get('dod_text') as string,
            why_it_matters: artifact.get('why_it_matters') as string | null,
            owner_process_id: processId,
            applicability_condition_id: artifact.get('applicability_condition_id') as number | null,
          },
          t,
        )
        const novoId = novo.get('id') as number
        for (const s of seals.filter((x) => x.get('artifact_id') === oldId)) {
          await contentRepository.createSeal(novoId, s.get('seal_code') as string, t)
        }
        // Templates acompanham o clone (mesmo file_ref — arquivo é compartilhado
        // entre versões; a exclusão física só ocorre na última referência).
        for (const tpl of templates.filter((x) => x.get('artifact_id') === oldId)) {
          await contentRepository.createTemplate(
            {
              artifact_id: novoId,
              file_ref: tpl.get('file_ref') as string,
              filename: tpl.get('filename') as string,
              mime_type: tpl.get('mime_type') as string,
              size_bytes: tpl.get('size_bytes') as number,
            },
            t,
          )
        }
        for (const p of placements.filter((x) => x.get('artifact_id') === oldId)) {
          await contentRepository.createPlacement(
            {
              artifact_id: novoId,
              process_id: p.get('process_id') as number,
              level_number: p.get('level_number') as number,
              classification: p.get('classification') as Classification,
            },
            t,
          )
        }
      }
      return { versionId: draftId, versionNo }
    })
  },

  /** Substitui o graph do rascunho (o CMS edita localmente e salva inteiro).
   *  Templates anexados sobrevivem ao rebuild (recasados por logical_key);
   *  devolve os file_refs que ficaram sem NENHUMA referência (artefato
   *  removido) para o chamador apagar do storage. */
  async saveDraft(versionId: number, graph: DraftGraphInput): Promise<{ orphanFileRefs: string[] }> {
    const version = await contentRepository.findVersionById(versionId)
    if (!version) throw new NotFoundError('Versão não encontrada.')
    if (version.get('status') !== 'rascunho') {
      throw new ConflictError('Só rascunhos podem ser editados. Crie um novo rascunho.')
    }
    const processId = version.get('process_id') as number

    const types = await contentRepository.listArtifactTypes()
    const typeByCode = new Map(types.map((t) => [t.get('code') as string, t.get('id') as number]))
    const conditions = await contentRepository.listConditions()
    const conditionByCode = new Map(
      conditions.map((c) => [c.get('code') as string, c.get('id') as number]),
    )

    // Validações do graph (RN-5: dono precisa ter placement no próprio processo — garantido por ownLevel)
    const keys = new Set<string>()
    for (const a of graph.artifacts) {
      const key = a.logicalKey?.trim() || slugify(a.title)
      if (keys.has(key)) throw new ValidationFailedError({ logicalKey: `duplicado: ${key}` })
      keys.add(key)
      if (!typeByCode.has(a.typeCode)) {
        throw new ValidationFailedError({ typeCode: `tipo inválido: ${a.typeCode}` })
      }
      if (a.conditionCode && !conditionByCode.has(a.conditionCode)) {
        throw new ValidationFailedError({ conditionCode: `condição inválida: ${a.conditionCode}` })
      }
      if (a.ownLevel < 2 || a.ownLevel > 5) {
        throw new ValidationFailedError({ ownLevel: 'nível do artefato deve ser 2..5' })
      }
    }

    return sequelize.transaction(async (t) => {
      // Captura os templates dos artefatos atuais ANTES do rebuild, indexados
      // pela logical_key — a mesma chave que preserva marcações no publish.
      const antigos = await contentRepository.findArtifactsByVersion(versionId, t)
      const keyPorId = new Map(
        antigos.map((a) => [a.get('id') as number, a.get('logical_key') as string]),
      )
      const templatesAntigos = await contentRepository.findTemplatesByArtifactIds(
        [...keyPorId.keys()],
        t,
      )
      const templatesPorKey = new Map<string, typeof templatesAntigos>()
      for (const tpl of templatesAntigos) {
        const key = keyPorId.get(tpl.get('artifact_id') as number)!
        templatesPorKey.set(key, [...(templatesPorKey.get(key) ?? []), tpl])
      }

      await contentRepository.destroyTemplatesByArtifactIds([...keyPorId.keys()], t)
      await contentRepository.destroyArtifactsByVersion(versionId, t)
      await contentRepository.destroyLevelsByVersion(versionId, t)

      for (let n = 1; n <= 5; n++) {
        const nivel = graph.levels.find((l) => l.number === n)
        await contentRepository.createLevel(
          {
            content_version_id: versionId,
            number: n,
            name: LEVEL_NAMES[n]!,
            description: nivel?.description ?? null,
          },
          t,
        )
      }

      const keysRecriadas = new Set<string>()
      for (const a of graph.artifacts) {
        const logicalKey = a.logicalKey?.trim() || slugify(a.title)
        const artifact = await contentRepository.createArtifact(
          {
            content_version_id: versionId,
            logical_key: logicalKey,
            artifact_type_id: typeByCode.get(a.typeCode)!,
            title: a.title,
            dod_text: a.dodText,
            why_it_matters: a.whyItMatters ?? null,
            owner_process_id: processId,
            applicability_condition_id: a.conditionCode
              ? conditionByCode.get(a.conditionCode)!
              : null,
          },
          t,
        )
        const artifactId = artifact.get('id') as number
        keysRecriadas.add(logicalKey)
        for (const tpl of templatesPorKey.get(logicalKey) ?? []) {
          await contentRepository.createTemplate(
            {
              artifact_id: artifactId,
              file_ref: tpl.get('file_ref') as string,
              filename: tpl.get('filename') as string,
              mime_type: tpl.get('mime_type') as string,
              size_bytes: tpl.get('size_bytes') as number,
            },
            t,
          )
        }
        for (const seal of [...new Set(a.seals)]) {
          await contentRepository.createSeal(artifactId, seal, t)
        }
        await contentRepository.createPlacement(
          {
            artifact_id: artifactId,
            process_id: processId,
            level_number: a.ownLevel,
            classification: a.ownClassification,
          },
          t,
        )
        for (const extra of a.extraPlacements ?? []) {
          if (extra.processId === processId) continue
          await contentRepository.createPlacement(
            {
              artifact_id: artifactId,
              process_id: extra.processId,
              level_number: extra.level,
              classification: extra.classification,
            },
            t,
          )
        }
      }

      // Órfão de verdade = ref cujo artefato saiu do graph E que nenhuma outra
      // versão (publicada/arquivada clonada) ainda referencia.
      const refsCandidatas = [
        ...new Set(
          templatesAntigos
            .filter((tpl) => !keysRecriadas.has(keyPorId.get(tpl.get('artifact_id') as number)!))
            .map((tpl) => tpl.get('file_ref') as string),
        ),
      ]
      const aindaReferenciadas = new Set(
        (await contentRepository.findTemplatesByFileRefs(refsCandidatas, t)).map(
          (tpl) => tpl.get('file_ref') as string,
        ),
      )
      return { orphanFileRefs: refsCandidatas.filter((ref) => !aindaReferenciadas.has(ref)) }
    })
  },

  /** Publica o rascunho (ADR 002): arquiva a anterior e MIGRA as marcações
   *  por logical_key na mesma transação. Recalcular = automático (nível é
   *  sempre derivado da versão publicada corrente). */
  async publish(versionId: number, userId: number | null) {
    const version = await contentRepository.findVersionById(versionId)
    if (!version) throw new NotFoundError('Versão não encontrada.')
    if (version.get('status') !== 'rascunho') {
      throw new ConflictError('Só rascunhos podem ser publicados.')
    }
    const processId = version.get('process_id') as number
    const artifacts = await contentRepository.findArtifactsByVersion(versionId)
    if (artifacts.length === 0) {
      throw new ValidationFailedError({ artifacts: 'rascunho sem artefatos não pode ser publicado' })
    }

    const migrated = await sequelize.transaction(async (t) => {
      const anterior = await contentRepository.findPublishedVersion(processId, t)
      let pairs: Array<{ fromArtifactId: number; toArtifactId: number }> = []

      if (anterior) {
        const antigos = await contentRepository.findArtifactsByVersion(
          anterior.get('id') as number,
          t,
        )
        const novosPorKey = new Map(
          artifacts.map((a) => [a.get('logical_key') as string, a.get('id') as number]),
        )
        pairs = antigos.flatMap((antigo) => {
          const novoId = novosPorKey.get(antigo.get('logical_key') as string)
          return novoId ? [{ fromArtifactId: antigo.get('id') as number, toArtifactId: novoId }] : []
        })
        await contentRepository.updateVersionStatus(
          anterior.get('id') as number,
          { status: 'arquivado' },
          t,
        )
      }

      await contentRepository.updateVersionStatus(
        versionId,
        { status: 'publicado', published_at: new Date() },
        t,
      )

      // Migração cruza tenants por definição — bypass auditado (ADR 001/002).
      const n = await runWithoutTenantScope('publicacao-conteudo', () =>
        migrateAssessments(pairs, t),
      )
      await auditService.record(
        'content.published',
        'content_version',
        versionId,
        { migratedCount: n },
        { tenantId: null, userId },
        t,
      )
      return n
    })

    return { migratedAssessments: migrated }
  },

  /** Graph completo de uma versão (CMS e visão do centro compartilham). */
  async getVersionGraph(versionId: number) {
    const version = await contentRepository.findVersionById(versionId)
    if (!version) throw new NotFoundError('Versão não encontrada.')
    const levels = await contentRepository.findLevelsByVersion(versionId)
    const artifacts = await contentRepository.findArtifactsByVersion(versionId)
    const ids = artifacts.map((a) => a.get('id') as number)
    const seals = await contentRepository.findSealsByArtifactIds(ids)
    const placements = await contentRepository.findPlacementsByArtifactIds(ids)
    const templates = await contentRepository.findTemplatesByArtifactIds(ids)
    const types = await contentRepository.listArtifactTypes()
    const conditions = await contentRepository.listConditions()
    const typeById = new Map(types.map((t) => [t.get('id') as number, t.get('code') as string]))
    const conditionById = new Map(
      conditions.map((c) => [c.get('id') as number, c.get('code') as string]),
    )
    const processId = version.get('process_id') as number

    return {
      versionId,
      processId,
      versionNo: version.get('version_no') as number,
      status: version.get('status') as string,
      levels: levels.map((l) => ({
        number: l.get('number') as number,
        name: l.get('name') as string,
        description: l.get('description') as string | null,
      })),
      artifacts: artifacts.map((a) => {
        const id = a.get('id') as number
        const own = placements.find(
          (p) => p.get('artifact_id') === id && p.get('process_id') === processId,
        )
        return {
          id,
          logicalKey: a.get('logical_key') as string,
          typeCode: typeById.get(a.get('artifact_type_id') as number) ?? '',
          title: a.get('title') as string,
          dodText: a.get('dod_text') as string,
          whyItMatters: a.get('why_it_matters') as string | null,
          seals: seals.filter((s) => s.get('artifact_id') === id).map((s) => s.get('seal_code') as string),
          conditionCode: a.get('applicability_condition_id')
            ? (conditionById.get(a.get('applicability_condition_id') as number) ?? null)
            : null,
          ownLevel: own ? (own.get('level_number') as number) : 0,
          ownClassification: own ? (own.get('classification') as Classification) : 'complementar',
          extraPlacements: placements
            .filter((p) => p.get('artifact_id') === id && p.get('process_id') !== processId)
            .map((p) => ({
              processId: p.get('process_id') as number,
              level: p.get('level_number') as number,
              classification: p.get('classification') as Classification,
            })),
          templates: templates
            .filter((tpl) => tpl.get('artifact_id') === id)
            .map((tpl) => ({ id: tpl.get('id') as number, filename: tpl.get('filename') as string })),
        }
      }),
    }
  },
}
