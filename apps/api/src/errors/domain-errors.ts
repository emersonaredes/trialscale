/** Erros de domínio (app-architect: services lançam erros de domínio; um
 *  único error-handler os converte para HTTP). */

export abstract class DomainError extends Error {
  abstract readonly httpStatus: number
  abstract readonly code: string
}

export class MissingTenantContextError extends DomainError {
  readonly httpStatus = 500
  readonly code = 'MISSING_TENANT_CONTEXT'
  constructor(modelName: string) {
    super(
      `Acesso ao model '${modelName}' (tenancy=tenant) sem contexto de tenant. ` +
        'Toda query de dados de centro exige RequestContext com tenantId (ADR 001).',
    )
  }
}

export class CrossTenantWriteError extends DomainError {
  readonly httpStatus = 500
  readonly code = 'CROSS_TENANT_WRITE'
  constructor(modelName: string) {
    super(`Escrita em '${modelName}' com tenant_id diferente do contexto (ADR 001).`)
  }
}

export class BlockedModelOperationError extends DomainError {
  readonly httpStatus = 500
  readonly code = 'BLOCKED_MODEL_OPERATION'
  constructor(op: string, modelName: string) {
    super(
      `Operação '${op}' direto no model '${modelName}' é bloqueada (ADR 001): ` +
        'não passa pelos hooks de escopo. Use métodos do repository.',
    )
  }
}

export class ValidationFailedError extends DomainError {
  readonly httpStatus = 400
  readonly code = 'VALIDATION_FAILED'
  constructor(public readonly details: unknown) {
    super('Dados inválidos.')
  }
}

export class UnauthorizedError extends DomainError {
  readonly httpStatus = 401
  readonly code = 'UNAUTHORIZED'
  constructor(message = 'Credenciais inválidas.') {
    super(message)
  }
}

export class ForbiddenError extends DomainError {
  readonly httpStatus = 403
  readonly code = 'FORBIDDEN'
  constructor(message = 'Sem permissão para esta ação.') {
    super(message)
  }
}

export class NotFoundError extends DomainError {
  readonly httpStatus = 404
  readonly code = 'NOT_FOUND'
  constructor(message = 'Recurso não encontrado.') {
    super(message)
  }
}

export class ConflictError extends DomainError {
  readonly httpStatus = 409
  readonly code = 'CONFLICT'
  constructor(message: string) {
    super(message)
  }
}
