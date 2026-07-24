import { contentRepository } from '../repositories/content-repository'
import {
  assessmentRepository,
  processApplicabilityRepository,
} from '../repositories/assessment-repository'
import { auditService } from './audit-service'
import { NotFoundError, ValidationFailedError } from '../errors/domain-errors'
import type { AssessmentState } from '../types/domain'

export const assessmentService = {
  /** Marca o estado de um artefato (Raio-X). Única por (tenant, artefato) —
   *  compartilhado marcado uma vez conta em todos os processos (CA-2). */
  async markState(artifactId: number, state: AssessmentState, expectedDueDate: string | null) {
    const artifact = await contentRepository.findArtifactById(artifactId)
    if (!artifact) throw new NotFoundError('Artefato não encontrado.')
    const version = await contentRepository.findVersionById(
      artifact.get('content_version_id') as number,
    )
    if (!version || version.get('status') !== 'publicado') {
      throw new NotFoundError('Artefato não está em conteúdo publicado.')
    }
    // CA-7 / AC-9: data-limite só faz sentido em elaboração
    if (expectedDueDate && state !== 'em_elaboracao') {
      throw new ValidationFailedError({
        expectedDueDate: 'data-limite só é aceita no estado "em elaboração"',
      })
    }

    const existente = await assessmentRepository.findByArtifactId(artifactId)
    const dados = {
      state,
      expected_due_date: state === 'em_elaboracao' ? expectedDueDate : null,
      completed_at: state === 'completo' ? new Date() : null,
    }
    if (existente) {
      existente.set(dados as never)
      await existente.save()
    } else {
      await assessmentRepository.create({ artifact_id: artifactId, ...dados } as never)
    }
  },

  /** "Não se aplica" com justificativa (CA-4). Papel: admin/coordenador (rota). */
  async setProcessApplicability(processId: number, applies: boolean, justification: string | null) {
    const process = await contentRepository.findProcessById(processId)
    if (!process) throw new NotFoundError('Processo não encontrado.')
    if (!applies && (!justification || justification.trim().length < 5)) {
      throw new ValidationFailedError({
        justification: 'marque "não se aplica" com uma justificativa (mínimo 5 caracteres)',
      })
    }
    const existente = await processApplicabilityRepository.findByProcessId(processId)
    if (existente) {
      existente.set({
        applies,
        na_justification: applies ? null : justification,
      } as never)
      await existente.save()
    } else {
      await processApplicabilityRepository.create({
        process_id: processId,
        applies,
        na_justification: applies ? null : justification,
      } as never)
    }
    await auditService.record('process.applicability_changed', 'process', processId, {
      reason: applies ? 'aplicavel' : 'nao_se_aplica',
    })
  },
}
