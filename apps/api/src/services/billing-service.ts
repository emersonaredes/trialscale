import { getContext } from '../context/request-context'
import { planRepository } from '../repositories/paid-journey-repository'
import { identityRepository } from '../repositories/identity-repository'
import { auditService } from './audit-service'
import { NotFoundError, UnauthorizedError } from '../errors/domain-errors'

/**
 * ASSINATURA SIMULADA (decisão 2026-07-24): o próprio centro ativa o plano,
 * claramente marcado como placeholder até o gateway de pagamento (Etapa 5).
 * Nenhuma cobrança acontece. A troca pelo gateway substitui SÓ este service.
 */
export const billingService = {
  async listPlans() {
    const plans = await planRepository.listAll()
    return plans.map((p) => ({
      code: p.get('code') as string,
      name: p.get('name') as string,
      amount: p.get('amount') as string, // DECIMAL como string — formatação no cliente
    }))
  },

  async getMyPlan(): Promise<{ code: string; name: string } | null> {
    const ctx = getContext()
    if (!ctx || ctx.tenantId == null) return null
    const tenant = await identityRepository.findTenantById(ctx.tenantId)
    const planId = tenant?.get('plan_id') as number | null | undefined
    if (!planId) return null
    const plans = await planRepository.listAll()
    const plan = plans.find((p) => (p.get('id') as number) === planId)
    return plan ? { code: plan.get('code') as string, name: plan.get('name') as string } : null
  },

  /** Ativa o plano (SIMULADO — sem cobrança). Papel: administrador (rota). */
  async subscribe(planCode: string): Promise<{ code: string; name: string }> {
    const ctx = getContext()
    if (!ctx || ctx.tenantId == null) throw new UnauthorizedError()
    const plan = await planRepository.findByCode(planCode)
    if (!plan) throw new NotFoundError('Plano não encontrado.')
    await planRepository.setTenantPlan(ctx.tenantId, plan.get('id') as number)
    await auditService.record('billing.subscribed_simulated', 'tenant', ctx.tenantId, {
      reason: planCode,
    })
    return { code: plan.get('code') as string, name: plan.get('name') as string }
  },

  /** Cancela (simulado): volta ao gratuito. */
  async cancel(): Promise<void> {
    const ctx = getContext()
    if (!ctx || ctx.tenantId == null) throw new UnauthorizedError()
    await planRepository.setTenantPlan(ctx.tenantId, null)
    await auditService.record('billing.cancelled_simulated', 'tenant', ctx.tenantId)
  },
}
