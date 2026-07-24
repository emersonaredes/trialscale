import { Op, type ModelDefined, type Transaction } from 'sequelize'
import { TenantRepository } from './tenant-repository'
import {
  Assessment,
  ProcessApplicability,
  type AssessmentAttrs,
  type AssessmentCreation,
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
