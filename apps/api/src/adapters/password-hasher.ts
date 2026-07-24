import argon2 from 'argon2'

/** Interface isola a lib de hash (fallback decidido: bcryptjs — ADR curto se precisar). */
export interface PasswordHasher {
  hash(plain: string): Promise<string>
  verify(hash: string, plain: string): Promise<boolean>
}

/** argon2id — recomendação OWASP para senhas. */
export const passwordHasher: PasswordHasher = {
  hash(plain) {
    return argon2.hash(plain, { type: argon2.argon2id })
  },
  async verify(hash, plain) {
    try {
      return await argon2.verify(hash, plain)
    } catch {
      return false
    }
  },
}
