/** Cliente HTTP mínimo: access token em MEMÓRIA (app-architect), cookie do
 *  refresh viaja sozinho (same-origin via proxy do Vite). */

let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  // FormData define seu próprio Content-Type (boundary do multipart)
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const res = await fetch(path, { ...options, headers, credentials: 'same-origin' })
  if (res.status === 204) return undefined as T

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

/** Download autenticado (o header Authorization não viaja em <a href>). */
export async function apiDownload(path: string, filename: string): Promise<void> {
  const headers = new Headers()
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const res = await fetch(path, { headers, credentials: 'same-origin' })
  if (!res.ok) throw new ApiError(res.status, 'DOWNLOAD', 'Falha ao baixar o arquivo.')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
