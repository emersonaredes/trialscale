import { apiFetch, ApiError } from '../../shared/lib/api-client'

// ------------------------------------------------------------------ tipos
export type WorkshopStep =
  | 'entrada'
  | 'objetivos'
  | 'ranking_objetivos'
  | 'ranking_processos'
  | 'avaliacao'
  | 'distribuicao'

export interface PublicRoom {
  code: string
  name: string
  status: 'aberta' | 'encerrada'
  step: WorkshopStep
  process: { id: number; code: string | null; name: string; oneLine: string | null } | null
  maxObjectives: number
}

export interface RoomListItem {
  id: number
  code: string
  name: string
  status: 'aberta' | 'encerrada'
  step: WorkshopStep
  createdAt: string | null
  participants: number
}

export interface Snapshot {
  room: PublicRoom
  roomId: number
  participants: { total: number; online: number; list: Array<{ id: number; nickname: string }> }
  objectives: {
    respondents: number
    ranking: Array<{ id: number; theme: string; name: string; votes: number }>
  }
  processes: Array<{
    id: number
    code: string | null
    name: string
    group: string
    published: boolean
    points: number
    score: number
    drivers: Array<{ objectiveId: number; name: string; votes: number; weight: number }>
  }>
  assessment: {
    finished: number
    distribution: number[]
    levels: Array<{ number: number; name: string }>
  } | null
}

export interface WorkshopArtifact {
  id: number
  title: string
  dodText: string
  whyItMatters?: string | null
  typeName: string
  seals?: string[]
  level: number
  classification: 'essencial' | 'complementar'
  conditional: boolean
  conditionLabel: string | null
}

export interface WorkshopGuide {
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

export interface ProcessContent {
  process: {
    id: number
    code: string | null
    name: string
    group: string
    oneLine: string | null
    objectiveText: string | null
  }
  levels: Array<{ number: number; name: string; description: string | null }>
  artifacts: WorkshopArtifact[]
  guide: WorkshopGuide | null
}

export interface LevelResult {
  processId: number
  level: number
  levelName: string
  nextLevel: { number: number; name: string } | null
  missing: Array<{ id: number; title: string; level: number }>
  essentialsDone: number
  essentialsTotal: number
}

// ------------------------------------------------------------------ apresentador (staff)
export const workshopAdminApi = {
  list: () => apiFetch<RoomListItem[]>('/api/workshops'),
  create: (name: string) =>
    apiFetch<RoomListItem>('/api/workshops', { method: 'POST', body: JSON.stringify({ name }) }),
  snapshot: (id: number) => apiFetch<Snapshot>(`/api/workshops/${id}`),
  setStep: (id: number, step: WorkshopStep) =>
    apiFetch<Snapshot>(`/api/workshops/${id}/step`, { method: 'POST', body: JSON.stringify({ step }) }),
  setProcess: (id: number, processId: number) =>
    apiFetch<Snapshot>(`/api/workshops/${id}/process`, {
      method: 'POST',
      body: JSON.stringify({ processId }),
    }),
  close: (id: number) => apiFetch<Snapshot>(`/api/workshops/${id}/close`, { method: 'POST' }),
  removeParticipant: (id: number, participantId: number) =>
    apiFetch<Snapshot>(`/api/workshops/${id}/participants/${participantId}`, { method: 'DELETE' }),
  processDetail: (id: number, processId: number) =>
    apiFetch<ProcessContent>(`/api/workshops/${id}/processes/${processId}`),
}

// ------------------------------------------------------------------ participante (celular)
export interface PlayerState {
  room: PublicRoom
  me: { nickname: string }
  votes: number[]
  result: LevelResult | null
}

export interface PlayerProcess {
  process: ProcessContent['process']
  levels: ProcessContent['levels']
  artifacts: WorkshopArtifact[]
  mine: { artifactIds: number[]; notApplicableIds: number[] } | null
}

/** Chamadas do celular: token opaco da sala (não é a sessão do TrialScale). */
async function playFetch<T>(code: string, path: string, token: string | null, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`/api/w/${encodeURIComponent(code)}${path}`, { ...init, headers })
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (body.code as string) ?? 'ERRO',
      (body.message as string) ?? 'Erro inesperado.',
      body.details,
    )
  }
  return body as T
}

export const workshopPlayApi = {
  join: (code: string) =>
    playFetch<{ token: string; nickname: string; room: PublicRoom }>(code, '/join', null, {
      method: 'POST',
    }),
  state: (code: string, token: string) => playFetch<PlayerState>(code, '/state', token),
  objectives: (code: string, token: string) =>
    playFetch<{
      maxObjectives: number
      themes: Array<{ theme: string; items: Array<{ id: number; name: string }> }>
    }>(code, '/objectives', token),
  saveVotes: (code: string, token: string, objectiveIds: number[]) =>
    playFetch<{ votes: number[] }>(code, '/votes', token, {
      method: 'PUT',
      body: JSON.stringify({ objectiveIds }),
    }),
  process: (code: string, token: string) => playFetch<PlayerProcess>(code, '/process', token),
  saveAssessment: (code: string, token: string, artifactIds: number[], notApplicableIds: number[]) =>
    playFetch<LevelResult>(code, '/assessment', token, {
      method: 'PUT',
      body: JSON.stringify({ artifactIds, notApplicableIds }),
    }),
}
