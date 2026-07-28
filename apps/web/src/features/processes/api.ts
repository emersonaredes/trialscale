import { apiFetch } from '../../shared/lib/api-client'

export interface ProcessOverviewItem {
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
}

export interface ProcessGuide {
  purposeMd: string
  flowMd: string | null
  flow: { inputs: string[]; activities: string[]; outputs: string[] }
  indicators: string[]
  risks: string[]
  practices: Array<{ title: string; text: string }>
  regulatory: Array<{ source: string; text: string; url?: string }>
  gettingStarted: string[]
  sourceCitation: string | null
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
  state: 'nao_iniciado' | 'em_elaboracao' | 'completo'
  expectedDueDate: string | null
  shared: boolean
  custom: boolean
  templates: Array<{ id: number; filename: string }>
}

export interface ProcessDetail {
  guide: ProcessGuide | null
  process: {
    id: number
    code: string | null
    name: string
    processGroup: string
    oneLineDescription: string | null
    objectiveText: string | null
  }
  levels: Array<{ number: number; name: string; description: string | null }>
  maturity: {
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
}

export const processesApi = {
  overview() {
    return apiFetch<{ processes: ProcessOverviewItem[]; overallLevel: number | null }>(
      '/api/processes',
    )
  },
  detail(id: number) {
    return apiFetch<ProcessDetail>(`/api/processes/${id}`)
  },
  mark(artifactId: number, state: string, expectedDueDate?: string | null) {
    return apiFetch<void>(`/api/assessments/${artifactId}`, {
      method: 'PUT',
      body: JSON.stringify({ state, expectedDueDate: expectedDueDate ?? null }),
    })
  },
  setApplicability(processId: number, applies: boolean, justification?: string) {
    return apiFetch<void>(`/api/processes/${processId}/applicability`, {
      method: 'PUT',
      body: JSON.stringify({ applies, justification: justification ?? null }),
    })
  },
}
