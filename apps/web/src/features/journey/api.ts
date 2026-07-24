import { apiFetch } from '../../shared/lib/api-client'

export interface ObjectiveTheme {
  theme: string
  objectives: Array<{ id: number; name: string }>
}

export interface MyObjective {
  objectiveId: number
  rank: number
  name: string
  theme: string
}

export interface ThermometerProcess {
  processId: number
  code: string | null
  name: string
  processGroup: string
  oneLineDescription: string | null
  score: number | null
  published: boolean
}

export interface PhotoProcess extends ThermometerProcess {
  relevance: number // 0–5 (relevância estratégica normalizada)
  objectiveIds: number[]
}

export interface PhotoObjective {
  objectiveId: number
  name: string
  rank: number
  processIds: number[]
  averagePain: number | null
}

export interface Photo {
  groups: Array<{
    group: string
    processes: PhotoProcess[]
    answered: number
    total: number
    averagePain: number | null
  }>
  topPains: PhotoProcess[]
  objectives: PhotoObjective[]
  answered: number
  total: number
}

export const journeyApi = {
  objectives: () => apiFetch<ObjectiveTheme[]>('/api/objectives'),
  myObjectives: () => apiFetch<MyObjective[]>('/api/me/objectives'),
  saveMyObjectives: (objectiveIds: number[]) =>
    apiFetch<void>('/api/me/objectives', { method: 'PUT', body: JSON.stringify({ objectiveIds }) }),
  thermometer: () =>
    apiFetch<{ processes: ThermometerProcess[]; answered: number; total: number }>('/api/thermometer'),
  scorePain: (processId: number, score: number) =>
    apiFetch<void>(`/api/thermometer/${processId}`, { method: 'PUT', body: JSON.stringify({ score }) }),
  photo: () => apiFetch<Photo>('/api/photo'),
}
