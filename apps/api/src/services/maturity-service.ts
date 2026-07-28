import { getContext } from '../context/request-context'
import { contentRepository } from '../repositories/content-repository'
import {
  assessmentRepository,
  processApplicabilityRepository,
} from '../repositories/assessment-repository'
import { identityRepository } from '../repositories/identity-repository'
import { UnauthorizedError } from '../errors/domain-errors'
import type { AssessmentState } from '../types/domain'

/**
 * MOTOR DE CÁLCULO DE NÍVEL (spec 002; regras da concepção §4):
 * - Nível por processo = maior N tal que TODOS os essenciais dos níveis <= N
 *   (aplicáveis ao perfil) estão 'completo'. Complementar não trava.
 * - Compartilhado: a marcação é por (tenant, artefato) — conta em todos os
 *   processos que o colocam (ADR 002: versão publicada corrente do dono).
 * - Condicional: perfil NULL = aplicável (nunca excluir em silêncio; RN-3 —
 *   exclusões são reportadas em `excludedByCondition`).
 * - Nível geral (interino): média simples dos processos aplicáveis (ADR 002).
 */

interface TenantProfile {
  tipo_instituicao: string | null
  possui_pi_refrigerado: boolean | null
  possui_amostras: boolean | null
  // Perfil ORPC (PT-0067) — codes de condição = nomes das colunas do tenant
  perfil_fomento: boolean | null
  assume_atribuicoes_anvisa: boolean | null
  assume_farmacovigilancia: boolean | null
}

export function conditionApplies(code: string, profile: TenantProfile): boolean {
  switch (code) {
    case 'centro_publico':
      return profile.tipo_instituicao === null || profile.tipo_instituicao === 'publica'
    case 'possui_pi_refrigerado':
      return profile.possui_pi_refrigerado !== false
    case 'possui_amostras':
      return profile.possui_amostras !== false
    case 'perfil_fomento':
      return profile.perfil_fomento !== false
    case 'assume_atribuicoes_anvisa':
      return profile.assume_atribuicoes_anvisa !== false
    case 'assume_farmacovigilancia':
      return profile.assume_farmacovigilancia !== false
    default:
      return true // condição desconhecida nunca exclui silenciosamente
  }
}

export interface ArtifactStatus {
  artifactId: number
  logicalKey: string
  title: string
  dodText: string
  whyItMatters: string | null
  typeCode: string
  seals: string[]
  level: number
  classification: 'essencial' | 'complementar'
  state: AssessmentState
  expectedDueDate: string | null
  ownerProcessId: number
  shared: boolean
  custom: boolean // criado pelo próprio tenant (PT-0068) — sempre complementar
  templates: Array<{ id: number; filename: string }>
}

export interface ProcessMaturity {
  processId: number
  level: number
  applies: boolean
  naJustification: string | null
  essentialsTotal: number
  essentialsComplete: number
  complementaryTotal: number
  complementaryComplete: number
  nextLevelMissing: number
  excludedByCondition: Array<{ title: string; conditionCode: string }>
  artifacts: ArtifactStatus[]
}

async function tenantProfile(): Promise<TenantProfile> {
  const ctx = getContext()
  if (!ctx || ctx.tenantId == null) throw new UnauthorizedError()
  const tenant = await identityRepository.findTenantById(ctx.tenantId)
  if (!tenant) throw new UnauthorizedError()
  return {
    tipo_instituicao: tenant.get('tipo_instituicao') as string | null,
    possui_pi_refrigerado: tenant.get('possui_pi_refrigerado') as boolean | null,
    possui_amostras: tenant.get('possui_amostras') as boolean | null,
    perfil_fomento: tenant.get('perfil_fomento') as boolean | null,
    assume_atribuicoes_anvisa: tenant.get('assume_atribuicoes_anvisa') as boolean | null,
    assume_farmacovigilancia: tenant.get('assume_farmacovigilancia') as boolean | null,
  }
}

export const maturityService = {
  async computeProcess(processId: number): Promise<ProcessMaturity> {
    const profile = await tenantProfile()
    const effective = await contentRepository.findEffectivePlacementsForProcess(processId)
    const conditions = await contentRepository.listConditions()
    const conditionById = new Map(
      conditions.map((c) => [c.get('id') as number, c.get('code') as string]),
    )
    const types = await contentRepository.listArtifactTypes()
    const typeById = new Map(types.map((t) => [t.get('id') as number, t.get('code') as string]))

    // Filtro de condição (RN-3: exclusões visíveis, nunca silenciosas)
    const excludedByCondition: Array<{ title: string; conditionCode: string }> = []
    const applicable = effective.filter(({ artifact }) => {
      const condId = artifact.get('applicability_condition_id') as number | null
      if (condId == null) return true
      const code = conditionById.get(condId) ?? ''
      if (conditionApplies(code, profile)) return true
      excludedByCondition.push({ title: artifact.get('title') as string, conditionCode: code })
      return false
    })

    const artifactIds = applicable.map(({ artifact }) => artifact.get('id') as number)
    const assessments = await assessmentRepository.findByArtifactIds(artifactIds)
    const stateByArtifact = new Map(
      assessments.map((a) => [
        a.get('artifact_id') as number,
        {
          state: a.get('state') as AssessmentState,
          due: a.get('expected_due_date') as string | null,
        },
      ]),
    )
    const seals = await contentRepository.findSealsByArtifactIds(artifactIds)
    const templates = await contentRepository.findTemplatesByArtifactIds(artifactIds)

    const artifacts: ArtifactStatus[] = applicable.map(({ placement, artifact }) => {
      const id = artifact.get('id') as number
      const marc = stateByArtifact.get(id)
      return {
        artifactId: id,
        logicalKey: artifact.get('logical_key') as string,
        title: artifact.get('title') as string,
        dodText: artifact.get('dod_text') as string,
        whyItMatters: artifact.get('why_it_matters') as string | null,
        typeCode: typeById.get(artifact.get('artifact_type_id') as number) ?? '',
        seals: seals.filter((s) => s.get('artifact_id') === id).map((s) => s.get('seal_code') as string),
        level: placement.get('level_number') as number,
        classification: placement.get('classification') as 'essencial' | 'complementar',
        state: marc?.state ?? 'nao_iniciado',
        expectedDueDate: marc?.due ?? null,
        ownerProcessId: artifact.get('owner_process_id') as number,
        shared: (artifact.get('owner_process_id') as number) !== processId,
        custom: artifact.get('tenant_id') != null,
        templates: templates
          .filter((t) => t.get('artifact_id') === id)
          .map((t) => ({ id: t.get('id') as number, filename: t.get('filename') as string })),
      }
    })

    // Nível: todos os essenciais dos níveis <= N completos
    let level = 1
    for (let n = 2; n <= 5; n++) {
      const pendentes = artifacts.filter(
        (a) => a.classification === 'essencial' && a.level <= n && a.state !== 'completo',
      )
      if (pendentes.length === 0) level = n
      else break
    }
    const nextLevelMissing =
      level < 5
        ? artifacts.filter(
            (a) => a.classification === 'essencial' && a.level <= level + 1 && a.state !== 'completo',
          ).length
        : 0

    const applicability = await processApplicabilityRepository.findByProcessId(processId)

    return {
      processId,
      level,
      applies: applicability ? Boolean(applicability.get('applies')) : true,
      naJustification: applicability
        ? (applicability.get('na_justification') as string | null)
        : null,
      essentialsTotal: artifacts.filter((a) => a.classification === 'essencial').length,
      essentialsComplete: artifacts.filter(
        (a) => a.classification === 'essencial' && a.state === 'completo',
      ).length,
      complementaryTotal: artifacts.filter((a) => a.classification === 'complementar').length,
      complementaryComplete: artifacts.filter(
        (a) => a.classification === 'complementar' && a.state === 'completo',
      ).length,
      nextLevelMissing,
      excludedByCondition,
      artifacts: artifacts.sort((a, b) => a.level - b.level || a.title.localeCompare(b.title)),
    }
  },

  /** Visão geral: nível por processo publicado + nível geral (média simples
   *  dos aplicáveis — ponderação chega na Fatia 2, ADR 002). */
  async computeOverview() {
    const processes = await contentRepository.listProcesses()
    const items: Array<{
      processId: number
      code: string | null
      name: string
      processGroup: string
      oneLineDescription: string | null
      level: number
      applies: boolean
      essentialsTotal: number
      essentialsComplete: number
      nextLevelMissing: number
    }> = []

    for (const p of processes) {
      const processId = p.get('id') as number
      const published = await contentRepository.findPublishedVersion(processId)
      if (!published) continue // centros só veem conteúdo publicado
      const m = await this.computeProcess(processId)
      items.push({
        processId,
        code: p.get('code') as string | null,
        name: p.get('name') as string,
        processGroup: p.get('process_group') as string,
        oneLineDescription: p.get('one_line_description') as string | null,
        level: m.level,
        applies: m.applies,
        essentialsTotal: m.essentialsTotal,
        essentialsComplete: m.essentialsComplete,
        nextLevelMissing: m.nextLevelMissing,
      })
    }

    const applicable = items.filter((i) => i.applies)
    const overall =
      applicable.length > 0
        ? Math.round((applicable.reduce((s, i) => s + i.level, 0) / applicable.length) * 10) / 10
        : null

    return { processes: items, overallLevel: overall }
  },
}
