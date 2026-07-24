import { AsyncLocalStorage } from 'node:async_hooks'

export type Role = 'administrador' | 'coordenador' | 'membro'

/** Contexto por request, propagado por AsyncLocalStorage (ADR 001).
 *  Populado pelo middleware authenticate A PARTIR DO TOKEN — nunca de
 *  body/query. É a única fonte do escopo de tenant. */
export interface RequestContext {
  requestId: string
  userId: number | null
  tenantId: number | null
  role: Role | null
  isStaff: boolean
  /** true somente dentro de runWithoutTenantScope (auditado). */
  bypassTenantScope?: boolean
  bypassReason?: string
}

const als = new AsyncLocalStorage<RequestContext>()

export function runWithContext<T>(ctx: RequestContext, fn: () => Promise<T> | T): Promise<T> | T {
  return als.run(ctx, fn)
}

export function getContext(): RequestContext | undefined {
  return als.getStore()
}

/** Escape hatch ÚNICO do escopo de tenant (ADR 001): uso interno documentado
 *  (ex.: fluxos de identidade) — toda chamada é auditada pelo chamador via
 *  auditBypass() no service de auditoria. */
export function runWithoutTenantScope<T>(reason: string, fn: () => Promise<T> | T): Promise<T> | T {
  const atual = als.getStore()
  const ctx: RequestContext = atual
    ? { ...atual, bypassTenantScope: true, bypassReason: reason }
    : {
        requestId: 'sistema',
        userId: null,
        tenantId: null,
        role: null,
        isStaff: false,
        bypassTenantScope: true,
        bypassReason: reason,
      }
  return als.run(ctx, fn)
}
