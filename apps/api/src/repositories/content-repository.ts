import { Op, type Transaction } from 'sequelize'
import {
  Process,
  ContentVersion,
  Level,
  Artifact,
  ArtifactSeal,
  ArtifactPlacement,
  ArtifactTemplate,
  ArtifactType,
  ApplicabilityCondition,
  type ProcessCreation,
  type ContentVersionCreation,
  type LevelCreation,
  type ArtifactCreation,
  type PlacementCreation,
  type ArtifactTemplateCreation,
} from '../models/catalog'

/**
 * Repository do CATÁLOGO de conteúdo (zona global). O CMS (staff) escreve;
 * centros leem apenas versões publicadas — regra aplicada nos services.
 */
export const contentRepository = {
  // ---- lookups ----------------------------------------------------------
  listArtifactTypes() {
    return ArtifactType.findAll({ order: [['id', 'ASC']] })
  },
  listConditions() {
    return ApplicabilityCondition.findAll({ order: [['id', 'ASC']] })
  },

  // ---- process ----------------------------------------------------------
  createProcess(data: ProcessCreation, t?: Transaction) {
    return Process.create(data as never, t ? { transaction: t } : undefined)
  },
  updateProcess(id: number, patch: Partial<ProcessCreation>, t?: Transaction) {
    return Process.update(patch, { where: { id }, ...(t ? { transaction: t } : {}) })
  },
  findProcessById(id: number, t?: Transaction) {
    return Process.findByPk(id, t ? { transaction: t } : undefined)
  },
  findProcessByCode(code: string, t?: Transaction) {
    return Process.findOne({ where: { code }, ...(t ? { transaction: t } : {}) })
  },
  listProcesses() {
    return Process.findAll({ order: [['code', 'ASC'], ['name', 'ASC']] })
  },

  // ---- versions ---------------------------------------------------------
  createVersion(data: ContentVersionCreation, t?: Transaction) {
    return ContentVersion.create(data as never, t ? { transaction: t } : undefined)
  },
  findVersionById(id: number, t?: Transaction) {
    return ContentVersion.findByPk(id, t ? { transaction: t } : undefined)
  },
  findPublishedVersion(processId: number, t?: Transaction) {
    return ContentVersion.findOne({
      where: { process_id: processId, status: 'publicado' },
      ...(t ? { transaction: t } : {}),
    })
  },
  findDraftVersion(processId: number, t?: Transaction) {
    return ContentVersion.findOne({
      where: { process_id: processId, status: 'rascunho' },
      ...(t ? { transaction: t } : {}),
    })
  },
  findVersionsByProcess(processId: number) {
    return ContentVersion.findAll({
      where: { process_id: processId },
      order: [['version_no', 'DESC']],
    })
  },
  async maxVersionNo(processId: number, t?: Transaction): Promise<number> {
    const rows = await ContentVersion.findAll({
      where: { process_id: processId },
      order: [['version_no', 'DESC']],
      limit: 1,
      ...(t ? { transaction: t } : {}),
    })
    return rows[0] ? (rows[0].get('version_no') as number) : 0
  },
  updateVersionStatus(
    id: number,
    patch: { status: string; published_at?: Date | null; notes?: string | null },
    t?: Transaction,
  ) {
    return ContentVersion.update(patch as never, { where: { id }, ...(t ? { transaction: t } : {}) })
  },

  // ---- graph da versão (levels / artifacts / placements / seals) ---------
  findLevelsByVersion(versionId: number, t?: Transaction) {
    return Level.findAll({
      where: { content_version_id: versionId },
      order: [['number', 'ASC']],
      ...(t ? { transaction: t } : {}),
    })
  },
  createLevel(data: LevelCreation, t?: Transaction) {
    return Level.create(data as never, t ? { transaction: t } : undefined)
  },
  destroyLevelsByVersion(versionId: number, t?: Transaction) {
    return Level.destroy({ where: { content_version_id: versionId }, ...(t ? { transaction: t } : {}) })
  },

  findArtifactsByVersion(versionId: number, t?: Transaction) {
    return Artifact.findAll({
      where: { content_version_id: versionId },
      ...(t ? { transaction: t } : {}),
    })
  },
  findArtifactById(id: number, t?: Transaction) {
    return Artifact.findByPk(id, t ? { transaction: t } : undefined)
  },
  createArtifact(data: ArtifactCreation, t?: Transaction) {
    return Artifact.create(data as never, t ? { transaction: t } : undefined)
  },
  async destroyArtifactsByVersion(versionId: number, t?: Transaction) {
    const artifacts = await Artifact.findAll({
      where: { content_version_id: versionId },
      ...(t ? { transaction: t } : {}),
    })
    const ids = artifacts.map((a) => a.get('id') as number)
    if (ids.length === 0) return
    await ArtifactPlacement.destroy({
      where: { artifact_id: { [Op.in]: ids } },
      ...(t ? { transaction: t } : {}),
    })
    await ArtifactSeal.destroy({
      where: { artifact_id: { [Op.in]: ids } },
      ...(t ? { transaction: t } : {}),
    })
    await Artifact.destroy({
      where: { content_version_id: versionId },
      ...(t ? { transaction: t } : {}),
    })
  },

  createSeal(artifactId: number, sealCode: string, t?: Transaction) {
    return ArtifactSeal.create(
      { artifact_id: artifactId, seal_code: sealCode } as never,
      t ? { transaction: t } : undefined,
    )
  },
  findSealsByArtifactIds(ids: number[], t?: Transaction) {
    if (ids.length === 0) return Promise.resolve([])
    return ArtifactSeal.findAll({
      where: { artifact_id: { [Op.in]: ids } },
      ...(t ? { transaction: t } : {}),
    })
  },

  createPlacement(data: PlacementCreation, t?: Transaction) {
    return ArtifactPlacement.create(data as never, t ? { transaction: t } : undefined)
  },
  findPlacementsByArtifactIds(ids: number[], t?: Transaction) {
    if (ids.length === 0) return Promise.resolve([])
    return ArtifactPlacement.findAll({
      where: { artifact_id: { [Op.in]: ids } },
      ...(t ? { transaction: t } : {}),
    })
  },
  /** Placements que CONTAM para um processo: artefato precisa pertencer à
   *  versão PUBLICADA corrente do seu processo-dono (ADR 002 / Q3). */
  async findEffectivePlacementsForProcess(processId: number) {
    const placements = await ArtifactPlacement.findAll({ where: { process_id: processId } })
    if (placements.length === 0) return []
    const artifactIds = placements.map((p) => p.get('artifact_id') as number)
    const artifacts = await Artifact.findAll({ where: { id: { [Op.in]: artifactIds } } })
    const versionIds = [...new Set(artifacts.map((a) => a.get('content_version_id') as number))]
    const published = await ContentVersion.findAll({
      where: { id: { [Op.in]: versionIds }, status: 'publicado' },
    })
    const publishedIds = new Set(published.map((v) => v.get('id') as number))
    const artifactById = new Map(artifacts.map((a) => [a.get('id') as number, a]))
    return placements
      .map((p) => ({ placement: p, artifact: artifactById.get(p.get('artifact_id') as number) }))
      .filter(
        (par): par is { placement: (typeof placements)[number]; artifact: (typeof artifacts)[number] } =>
          par.artifact !== undefined &&
          publishedIds.has(par.artifact.get('content_version_id') as number),
      )
  },

  // ---- templates ----------------------------------------------------------
  createTemplate(data: ArtifactTemplateCreation, t?: Transaction) {
    return ArtifactTemplate.create(data as never, t ? { transaction: t } : undefined)
  },
  findTemplateById(id: number) {
    return ArtifactTemplate.findByPk(id)
  },
  findTemplatesByArtifactIds(ids: number[]) {
    if (ids.length === 0) return Promise.resolve([])
    return ArtifactTemplate.findAll({ where: { artifact_id: { [Op.in]: ids } } })
  },
  destroyTemplate(id: number) {
    return ArtifactTemplate.destroy({ where: { id } })
  },
}
