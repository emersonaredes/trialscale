import { tokenService } from '../../src/services/token-service'
import { UnauthorizedError } from '../../src/errors/domain-errors'

describe('tokenService', () => {
  it('assina e verifica access token com claims corretos', () => {
    const token = tokenService.signAccessToken({
      sub: 42,
      tenantId: 7,
      role: 'administrador',
      isStaff: false,
    })
    const claims = tokenService.verifyAccessToken(token)
    expect(claims).toEqual({ sub: 42, tenantId: 7, role: 'administrador', isStaff: false })
  })

  it('rejeita token adulterado', () => {
    const token = tokenService.signAccessToken({ sub: 1, tenantId: 1, role: 'membro', isStaff: false })
    const adulterado = token.slice(0, -4) + 'XXXX'
    expect(() => tokenService.verifyAccessToken(adulterado)).toThrow(UnauthorizedError)
  })

  it('token opaco: 32 bytes base64url e hash sha-256 hex de 64 chars', () => {
    const { token, hash } = tokenService.generateOpaqueToken()
    expect(token.length).toBeGreaterThanOrEqual(42)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(tokenService.hashToken(token)).toBe(hash) // determinístico
    expect(tokenService.generateOpaqueToken().token).not.toBe(token) // aleatório
  })
})
