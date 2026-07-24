/**
 * Models da ZONA DE CONTEUDO (spec 000 §4) — catálogo global versionado.
 * Nesta fase todo o catálogo tem tenant_id NULL (personalizados adiados —
 * ADR 002); a tenancy 'catalog' já aplica o filtro correto para o futuro.
 */
import { DataTypes, type ModelDefined, type Optional } from 'sequelize'
import { sequelize } from '../db/sequelize'
import { registerTenancy } from '../db/tenancy'
import type {
  ProcessGroup,
  VersionStatus,
  Classification,
  AssessmentState,
} from '../types/domain'
export type { ProcessGroup, VersionStatus, Classification, AssessmentState }

// ---------------------------------------------------------------- process
export interface ProcessAttrs {
  id: number
  tenant_id: number | null
  code: string | null
  name: string
  process_group: ProcessGroup
  one_line_description: string | null
  objective_text: string | null
}
export type ProcessCreation = Optional<
  ProcessAttrs,
  'id' | 'tenant_id' | 'code' | 'one_line_description' | 'objective_text'
>
export const Process: ModelDefined<ProcessAttrs, ProcessCreation> = sequelize.define('process', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  code: { type: DataTypes.STRING(20), allowNull: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  process_group: {
    type: DataTypes.ENUM('central', 'suporte', 'gestao', 'personalizado'),
    allowNull: false,
  },
  one_line_description: { type: DataTypes.TEXT, allowNull: true },
  objective_text: { type: DataTypes.TEXT, allowNull: true },
})

// ---------------------------------------------------------------- content_version
export interface ContentVersionAttrs {
  id: number
  process_id: number
  tenant_id: number | null
  version_no: number
  status: VersionStatus
  published_at: Date | null
  created_by: number | null
  notes: string | null
}
export type ContentVersionCreation = Optional<
  ContentVersionAttrs,
  'id' | 'tenant_id' | 'status' | 'published_at' | 'created_by' | 'notes'
>
export const ContentVersion: ModelDefined<ContentVersionAttrs, ContentVersionCreation> =
  sequelize.define('content_version', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    process_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    version_no: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: {
      type: DataTypes.ENUM('rascunho', 'publicado', 'arquivado'),
      allowNull: false,
      defaultValue: 'rascunho',
    },
    published_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  })

// ---------------------------------------------------------------- level
export interface LevelAttrs {
  id: number
  content_version_id: number
  tenant_id: number | null
  number: number
  name: string
  description: string | null
}
export type LevelCreation = Optional<LevelAttrs, 'id' | 'tenant_id' | 'description'>
export const Level: ModelDefined<LevelAttrs, LevelCreation> = sequelize.define('level', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  content_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  number: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
  name: { type: DataTypes.STRING(40), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
})

// ---------------------------------------------------------------- artifact
export interface ArtifactAttrs {
  id: number
  content_version_id: number
  tenant_id: number | null
  logical_key: string
  artifact_type_id: number
  title: string
  dod_text: string
  owner_process_id: number
  applicability_condition_id: number | null
}
export type ArtifactCreation = Optional<
  ArtifactAttrs,
  'id' | 'tenant_id' | 'applicability_condition_id'
>
export const Artifact: ModelDefined<ArtifactAttrs, ArtifactCreation> = sequelize.define(
  'artifact',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    content_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    logical_key: { type: DataTypes.STRING(80), allowNull: false },
    artifact_type_id: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    dod_text: { type: DataTypes.TEXT, allowNull: false },
    owner_process_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    applicability_condition_id: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
  },
)

// ---------------------------------------------------------------- artifact_seal
export interface ArtifactSealAttrs {
  artifact_id: number
  seal_code: string
}
export const ArtifactSeal: ModelDefined<ArtifactSealAttrs, ArtifactSealAttrs> = sequelize.define(
  'artifact_seal',
  {
    artifact_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true },
    seal_code: { type: DataTypes.CHAR(1), primaryKey: true },
  },
)

// ---------------------------------------------------------------- artifact_placement
export interface PlacementAttrs {
  id: number
  artifact_id: number
  process_id: number
  tenant_id: number | null
  level_number: number
  classification: Classification
}
export type PlacementCreation = Optional<PlacementAttrs, 'id' | 'tenant_id'>
export const ArtifactPlacement: ModelDefined<PlacementAttrs, PlacementCreation> =
  sequelize.define('artifact_placement', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    artifact_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    process_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    level_number: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    classification: { type: DataTypes.ENUM('essencial', 'complementar'), allowNull: false },
  })

// ---------------------------------------------------------------- artifact_template
export interface ArtifactTemplateAttrs {
  id: number
  artifact_id: number
  file_ref: string
  filename: string
  mime_type: string
  size_bytes: number
}
export type ArtifactTemplateCreation = Optional<ArtifactTemplateAttrs, 'id'>
export const ArtifactTemplate: ModelDefined<ArtifactTemplateAttrs, ArtifactTemplateCreation> =
  sequelize.define('artifact_template', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    artifact_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    file_ref: { type: DataTypes.STRING(500), allowNull: false },
    filename: { type: DataTypes.STRING(255), allowNull: false },
    mime_type: { type: DataTypes.STRING(120), allowNull: false },
    size_bytes: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  })

// ---------------------------------------------------------------- lookups
export interface ArtifactTypeAttrs {
  id: number
  code: string
  name: string
}
export const ArtifactType: ModelDefined<ArtifactTypeAttrs, Optional<ArtifactTypeAttrs, 'id'>> =
  sequelize.define('artifact_type', {
    id: { type: DataTypes.TINYINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(40), allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
  })

export interface ApplicabilityConditionAttrs {
  id: number
  code: string
  description: string
}
export const ApplicabilityCondition: ModelDefined<
  ApplicabilityConditionAttrs,
  Optional<ApplicabilityConditionAttrs, 'id'>
> = sequelize.define('applicability_condition', {
  id: { type: DataTypes.SMALLINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(60), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: false },
})

// ---------------------------------------------------------------- zona de centro (Raio-X)
export interface AssessmentAttrs {
  id: number
  tenant_id: number
  artifact_id: number
  state: AssessmentState
  expected_due_date: string | null
  completed_at: Date | null
}
export type AssessmentCreation = Optional<
  AssessmentAttrs,
  'id' | 'tenant_id' | 'state' | 'expected_due_date' | 'completed_at'
>
export const Assessment: ModelDefined<AssessmentAttrs, AssessmentCreation> = sequelize.define(
  'assessment',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    artifact_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    state: {
      type: DataTypes.ENUM('nao_iniciado', 'em_elaboracao', 'completo'),
      allowNull: false,
      defaultValue: 'nao_iniciado',
    },
    expected_due_date: { type: DataTypes.DATEONLY, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
  },
)

export interface ProcessApplicabilityAttrs {
  id: number
  tenant_id: number
  process_id: number
  applies: boolean
  na_justification: string | null
}
export type ProcessApplicabilityCreation = Optional<
  ProcessApplicabilityAttrs,
  'id' | 'tenant_id' | 'applies' | 'na_justification'
>
export const ProcessApplicability: ModelDefined<
  ProcessApplicabilityAttrs,
  ProcessApplicabilityCreation
> = sequelize.define('process_applicability', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  process_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  applies: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  na_justification: { type: DataTypes.STRING(500), allowNull: true },
})

// ---------------------------------------------------------------- tenancy (ADR 001/002)
registerTenancy(Process, 'catalog')
registerTenancy(ContentVersion, 'catalog')
registerTenancy(Level, 'catalog')
registerTenancy(Artifact, 'catalog')
registerTenancy(ArtifactPlacement, 'catalog')
registerTenancy(ArtifactSeal, 'global')
registerTenancy(ArtifactTemplate, 'global')
registerTenancy(ArtifactType, 'global')
registerTenancy(ApplicabilityCondition, 'global')
registerTenancy(Assessment, 'tenant')
registerTenancy(ProcessApplicability, 'tenant')
