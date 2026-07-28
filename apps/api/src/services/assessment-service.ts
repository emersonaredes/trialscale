import { contentRepository } from '../repositories/content-repository'
import {
  assessmentRepository,
  assessmentAssigneeRepository,
  processApplicabilityRepository,
} from '../repositories/assessment-repository'
import { identityRepository } from '../repositories/identity-repository'
import { getContext } from '../context/request-context'
import { auditService } from './audit-service'
import { NotFoundError, UnauthorizedError, ValidationFailedError } from '../errors/domain-errors'
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

  /** Define os responsáveis pelo artefato (PT-0068). A lista é restrita a
   *  usuários com membership no MESMO tenant; cria o assessment (nao_iniciado)
   *  se ainda não existir marcação. */
  async setAssignees(artifactId: number, userIds: number[]): Promise<void> {
    const ctx = getContext()
    if (!ctx || ctx.tenantId == null) throw new UnauthorizedError()

    const artifact = await contentRepository.findArtifactById(artifactId)
    if (!artifact) throw new NotFoundError('Artefato não encontrado.')

    const unicos = [...new Set(userIds)]
    for (const userId of unicos) {
      const membership = await identityRepository.findMembership(userId, ctx.tenantId)
      if (!membership) {
        throw new ValidationFailedError({ userIds: `usuário ${userId} não pertence ao centro` })
      }
    }

    let assessment = await assessmentRepository.findByArtifactId(artifactId)
    if (!assessment) {
      assessment = await assessmentRepository.create({
        artifact_id: artifactId,
        state: 'nao_iniciado',
        expected_due_date: null,
        completed_at: null,
      } as never)
    }
    await assessmentAssigneeRepository.replaceForAssessment(
      assessment.get('id') as number,
      unicos,
    )
  },

  /** Responsáveis por artefato, resolvidos com nome (para kanban/detalhe). */
  async assigneesByArtifactIds(
    artifactIds: number[],
  ): Promise<Map<number, Array<{ id: number; name: string }>>> {
    const resultado = new Map<number, Array<{ id: number; name: string }>>()
    if (artifactIds.length === 0) return resultado
    const assessments = await assessmentRepository.findByArtifactIds(artifactIds)
    if (assessments.length === 0) return resultado
    const porAssessment = new Map(
      assessments.map((a) => [a.get('id') as number, a.get('artifact_id') as number]),
    )
    const assignees = await assessmentAssigneeRepository.findByAssessmentIds([...porAssessment.keys()])
    const users = await identityRepository.findUsersByIds(
      [...new Set(assignees.map((x) => x.get('user_id') as number))],
    )
    const nomePorUser = new Map(users.map((u) => [u.get('id') as number, u.get('name') as string]))
    for (const row of assignees) {
      const artifactId = porAssessment.get(row.get('assessment_id') as number)!
      const userId = row.get('user_id') as number
      const lista = resultado.get(artifactId) ?? []
      lista.push({ id: userId, name: nomePorUser.get(userId) ?? `usuário ${userId}` })
      resultado.set(artifactId, lista)
    }
    return resultado
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
