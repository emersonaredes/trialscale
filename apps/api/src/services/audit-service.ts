import type { Transaction } from 'sequelize'
import { getContext } from '../context/request-context'
import { identityRepository } from '../repositories/identity-repository'

/** Chaves permitidas em audit_log.metadata (ALLOW-LIST — RN-4/AC-14):
 *  nunca payloads livres, nunca PII, nunca tokens. */
const ALLOWED_KEYS = [
  'reason',
  'familyId',
  'consentVersion',
  'specialtyCount',
  'migratedCount',
  'ip',
] as const
type AllowedKey = (typeof ALLOWED_KEYS)[number]
export type AuditMetadata = Partial<Record<AllowedKey, string | number>>

export const auditService = {
  async record(
    eventType: string,
    entity: string,
    entityId: string | number | null,
    metadata?: AuditMetadata,
    override?: { tenantId?: number | null; userId?: number | null },
    transaction?: Transaction,
  ): Promise<void> {
    const ctx = getContext()
    const clean: AuditMetadata = {}
    if (metadata) {
      for (const key of ALLOWED_KEYS) {
        if (metadata[key] !== undefined) clean[key] = metadata[key]
      }
    }
    await identityRepository.appendAudit(
      {
        tenant_id: override?.tenantId !== undefined ? override.tenantId : (ctx?.tenantId ?? null),
        user_id: override?.userId !== undefined ? override.userId : (ctx?.userId ?? null),
        event_type: eventType,
        entity,
        entity_id: entityId == null ? null : String(entityId),
        metadata: Object.keys(clean).length ? clean : null,
      },
      transaction,
    )
  },
}
