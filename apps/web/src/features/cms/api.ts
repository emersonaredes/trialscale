import { apiFetch } from '../../shared/lib/api-client'

export interface CmsProcess {
  id: number
  code: string | null
  name: string
  processGroup: string
  oneLineDescription: string | null
  publishedVersion: number | null
  draftVersionId: number | null
}

export interface CmsArtifact {
  id?: number
  logicalKey: string
  typeCode: string
  title: string
  dodText: string
  seals: string[]
  conditionCode: string | null
  ownLevel: number
  ownClassification: 'essencial' | 'complementar'
  extraPlacements: Array<{ processId: number; level: number; classification: 'essencial' | 'complementar' }>
  templates?: Array<{ id: number; filename: string }>
}

export interface CmsVersionGraph {
  versionId: number
  processId: number
  versionNo: number
  status: string
  levels: Array<{ number: number; name: string; description: string | null }>
  artifacts: CmsArtifact[]
}

export interface CmsLookups {
  artifactTypes: Array<{ code: string; name: string }>
  conditions: Array<{ code: string; description: string }>
  processes: Array<{ id: number; code: string | null; name: string }>
}

export const cmsApi = {
  lookups: () => apiFetch<CmsLookups>('/api/cms/lookups'),
  listProcesses: () => apiFetch<CmsProcess[]>('/api/cms/processes'),
  createProcess: (payload: {
    code: string | null
    name: string
    processGroup: string
    oneLineDescription?: string | null
  }) => apiFetch<{ id: number }>('/api/cms/processes', { method: 'POST', body: JSON.stringify(payload) }),
  createDraft: (processId: number) =>
    apiFetch<{ versionId: number; versionNo: number }>(`/api/cms/processes/${processId}/draft`, {
      method: 'POST',
    }),
  getVersion: (versionId: number) => apiFetch<CmsVersionGraph>(`/api/cms/versions/${versionId}`),
  saveDraft: (versionId: number, graph: { levels: CmsVersionGraph['levels']; artifacts: CmsArtifact[] }) =>
    apiFetch<void>(`/api/cms/versions/${versionId}`, { method: 'PUT', body: JSON.stringify(graph) }),
  publish: (versionId: number) =>
    apiFetch<{ migratedAssessments: number }>(`/api/cms/versions/${versionId}/publish`, {
      method: 'POST',
    }),
  uploadTemplate: (artifactId: number, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetch<{ id: number; filename: string }>(`/api/cms/artifacts/${artifactId}/template`, {
      method: 'POST',
      body: fd,
    })
  },
  deleteTemplate: (templateId: number) =>
    apiFetch<void>(`/api/cms/templates/${templateId}`, { method: 'DELETE' }),
}
