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
  silentRisk: boolean
  suggested: boolean
}

export interface RoundInfo {
  roundId: number
  sequenceNo: number
  startedAt: string | null
  challengeWeeks: number | null
  challengeDeadline: string | null
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
  }>
  canConclude: boolean
}

export interface KanbanCard {
  artifactId: number
  title: string
  dodText: string
  processCode: string | null
  processName: string
  level: number
  classification: 'essencial' | 'complementar'
  expectedDueDate: string | null
  shared: boolean
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
  createRound: (processIds: number[], challengeWeeks: number | null) =>
    apiFetch<{ roundId: number; sequenceNo: number }>('/api/rounds', {
      method: 'POST',
      body: JSON.stringify({ processIds, challengeWeeks }),
    }),
  kanban: () =>
    apiFetch<{ round: RoundInfo; columns: Record<string, KanbanCard[]> }>('/api/rounds/current/kanban'),
  conclude: () =>
    apiFetch<{ sequenceNo: number; processes: Array<{ name: string; code: string | null; from: number; to: number }> }>(
      '/api/rounds/current/conclude',
      { method: 'POST' },
    ),
}
