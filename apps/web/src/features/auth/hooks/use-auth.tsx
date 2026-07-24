import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '../api/auth-api'
import { setAccessToken } from '../../../shared/lib/api-client'
import type { Session } from '../types'

interface AuthState {
  session: Omit<Session, 'accessToken'> | null
  carregando: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthState['session']>(null)
  const [carregando, setCarregando] = useState(true)

  // Bootstrap: tenta restaurar a sessão pelo cookie de refresh (httpOnly).
  useEffect(() => {
    authApi
      .refresh()
      .then(({ accessToken, ...resto }) => {
        setAccessToken(accessToken)
        setSession(resto)
      })
      .catch(() => setSession(null))
      .finally(() => setCarregando(false))
  }, [])

  // Renovação periódica (access token dura 15 min; renovamos aos 12).
  useEffect(() => {
    if (!session) return
    const id = setInterval(() => {
      authApi
        .refresh()
        .then(({ accessToken, ...resto }) => {
          setAccessToken(accessToken)
          setSession(resto)
        })
        .catch(() => {
          setAccessToken(null)
          setSession(null)
        })
    }, 12 * 60 * 1000)
    return () => clearInterval(id)
  }, [session])

  async function login(email: string, password: string) {
    const { accessToken, ...resto } = await authApi.login(email, password)
    setAccessToken(accessToken)
    setSession(resto)
  }

  async function logout() {
    await authApi.logout().catch(() => undefined)
    setAccessToken(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa do AuthProvider')
  return ctx
}
