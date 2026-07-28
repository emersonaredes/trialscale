import { Op, type ModelDefined, type Transaction } from 'sequelize'
import { TenantRepository } from './tenant-repository'
import {
  Assessment,
  AssessmentAssignee,
  ProcessApplicability,
  type AssessmentAttrs,
  type AssessmentCreation,
  type AssessmentAssigneeAttrs,
  type AssessmentAssigneeCreation,
  type ProcessApplicabilityAttrs,
  type ProcessApplicabilityCreation,
} from '../models/catalog'

/** Marcações do Raio-X (tenancy 'tenant' — escopo automático pelo contexto). */
class AssessmentRepository extends TenantRepository<AssessmentAttrs, AssessmentCreation> {
  protected model: ModelDefined<AssessmentAttrs, AssessmentCreation> = Assessment

  findByArtifactIds(artifactIds: number[]) {
    if (artifactIds.length === 0) return Promise.resolve([])
    return Assessment.findAll({ where: { artifact_id: { [Op.in]: artifactIds } } })
  }

  findByArtifactId(artifactId: number) {
    return Assessment.findOne({ where: { artifact_id: artifactId } })
  }
}
export const assessmentRepository = new AssessmentRepository()

/** Responsáveis pelo artefato (tenancy 'tenant' — escopo automático; PT-0068). */
class AssessmentAssigneeRepository extends TenantRepository<
  AssessmentAssigneeAttrs,
  AssessmentAssigneeCreation
> {
  protected model: ModelDefined<AssessmentAssigneeAttrs, AssessmentAssigneeCreation> =
    AssessmentAssignee

  findByAssessmentIds(assessmentIds: number[]) {
    if (assessmentIds.length === 0) return Promise.resolve([])
    return AssessmentAssignee.findAll({ where: { assessment_id: { [Op.in]: assessmentIds } } })
  }

  /** Substitui o conjunto de responsáveis de um assessment. */
  async replaceForAssessment(assessmentId: number, userIds: number[]): Promise<void> {
    await AssessmentAssignee.destroy({ where: { assessment_id: assessmentId } })
    if (userIds.length === 0) return
    await this.bulkCreate(
      [...new Set(userIds)].map((user_id) => ({ assessment_id: assessmentId, user_id })),
    )
  }
}
export const assessmentAssigneeRepository = new AssessmentAssigneeRepository()

/** "Não se aplica" por processo (tenancy 'tenant'). */
class ProcessApplicabilityRepository extends TenantRepository<
  ProcessApplicabilityAttrs,
  ProcessApplicabilityCreation
> {
  protected model: ModelDefined<ProcessApplicabilityAttrs, ProcessApplicabilityCreation> =
    ProcessApplicability

  findByProcessId(processId: number) {
    return ProcessApplicability.findOne({ where: { process_id: processId } })
  }
}
export const processApplicabilityRepository = new ProcessApplicabilityRepository()

/** Migração de marcações na publicação (ADR 002): cruza tenants por definição.
 *  Chamada EXCLUSIVAMENTE dentro de runWithoutTenantScope, auditada. */
export async function migrateAssessments(
  pairs: Array<{ fromArtifactId: number; toArtifactId: number }>,
  t?: Transaction,
): Promise<number> {
  let migrated = 0
  for (const { fromArtifactId, toArtifactId } of pairs) {
    const [n] = await Assessment.update(
      { artifact_id: toArtifactId },
      { where: { artifact_id: fromArtifactId }, ...(t ? { transaction: t } : {}) },
    )
    migrated += n
  }
  return migrated
}
