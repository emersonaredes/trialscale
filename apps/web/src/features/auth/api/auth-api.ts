import { apiFetch } from '../../../shared/lib/api-client'
import type { Session, RegisterPayload, Specialty } from '../types'

export const authApi = {
  register(payload: RegisterPayload) {
    return apiFetch<{ userId: number; tenantId: number }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  login(email: string, password: string) {
    return apiFetch<Session>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
  refresh() {
    return apiFetch<Session>('/api/auth/refresh', { method: 'POST' })
  },
  logout() {
    return apiFetch<void>('/api/auth/logout', { method: 'POST' })
  },
  forgotPassword(email: string) {
    return apiFetch<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
  resetPassword(token: string, newPassword: string) {
    return apiFetch<void>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    })
  },
  me() {
    return apiFetch<Omit<Session, 'accessToken'>>('/api/me')
  },
  specialties() {
    return apiFetch<Specialty[]>('/api/specialties')
  },
}
