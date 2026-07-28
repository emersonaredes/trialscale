import { apiFetch } from '../../shared/lib/api-client'

export interface PlanInfo {
  code: string
  name: string
  amount: string
}

export interface PriorityItem {
  processId: number
  code: string | null
  name: string
  processGroup: string
  published: boolean
  applies: boolean
  pain: number | null
  relevance: number
  score: number
  unlocks: number
  level: number | null
  essentialsTotal: number | null
  essentialsComplete: number | null
  nextLevelMissing: number | null
  silentRisk: boolean
  suggested: boolean
}

export interface RoundInfo {
  roundId: number
  sequenceNo: number
  startedAt: string | null
  challengeWeeks: number | null
  challengeDeadline: string | null
  artifactsTotal: number
  artifactsComplete: number
  realizedPct: number
  expectedPct: number | null
  processes: Array<{
    processId: number
    code: string | null
    name: string
    baselineLevel: number
    currentLevel: number
    leveledUp: boolean
    nextLevelMissing: number
    essentialsTotal: number
    essentialsComplete: number
    artifactsTotal: number
    artifactsComplete: number
  }>
  canConclude: boolean
}

export interface Assignee {
  id: number
  name: string
}

export interface KanbanCard {
  artifactId: number
  title: string
  dodText: string
  processId: number
  processCode: string | null
  processName: string
  level: number
  classification: 'essencial' | 'complementar'
  expectedDueDate: string | null
  shared: boolean
  custom: boolean
  assignees: Assignee[]
}

export interface RoundArtifactDetail {
  artifact: {
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
  process: { id: number; code: string | null; name: string }
  assignees: Assignee[]
}

export interface TenantUser {
  id: number
  name: string
  role: string | null
}

export const paidApi = {
  plans: () => apiFetch<{ plans: PlanInfo[]; myPlan: { code: string; name: string } | null }>('/api/plans'),
  subscribe: (planCode: string) =>
    apiFetch<{ code: string; name: string }>('/api/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planCode }),
    }),
  cancel: () => apiFetch<void>('/api/billing/cancel', { method: 'POST' }),
  priorities: () =>
    apiFetch<{ items: PriorityItem[]; answeredPain: number; hasObjectives: boolean }>('/api/priorities'),
  currentRound: () => apiFetch<{ round: RoundInfo | null }>('/api/rounds/current'),
  suggestion: () => apiFetch<{ suggestion: PriorityItem[] }>('/api/rounds/suggestion'),
  createRound: (processIds: number[], challengeWeeks: number | null, startedAt: string | null) =>
    apiFetch<{ roundId: number; sequenceNo: number }>('/api/rounds', {
      method: 'POST',
      body: JSON.stringify({ processIds, challengeWeeks, startedAt }),
    }),
  artifactDetail: (artifactId: number) =>
    apiFetch<RoundArtifactDetail>(`/api/round-artifacts/${artifactId}`),
  createCustomArtifact: (payload: { processId: number; title: string; dodText: string; level: number }) =>
    apiFetch<{ artifactId: number }>('/api/rounds/current/artifacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  setAssignees: (artifactId: number, userIds: number[]) =>
    apiFetch<void>(`/api/assessments/${artifactId}/assignees`, {
      method: 'PUT',
      body: JSON.stringify({ userIds }),
    }),
  tenantUsers: () => apiFetch<{ users: TenantUser[] }>('/api/tenant/users'),
  kanban: () =>
    apiFetch<{ round: RoundInfo; columns: Record<string, KanbanCard[]> }>('/api/rounds/current/kanban'),
  conclude: () =>
    apiFetch<{ sequenceNo: number; processes: Array<{ name: string; code: string | null; from: number; to: number }> }>(
      '/api/rounds/current/conclude',
      { method: 'POST' },
    ),
}
