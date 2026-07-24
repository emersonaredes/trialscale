import type { Request, Response, NextFunction } from 'express'
import { authService, type RegisterInput } from '../services/auth-service'
import { consoleMailAdapter } from '../adapters/mail-adapter'
import { env, isProd } from '../config/env'

const REFRESH_COOKIE = 'ts_refresh'

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/api/auth', // só viaja para os endpoints de auth
    secure: isProd,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  })
}

/** Controllers finos (app-architect): HTTP↔DTO, chama UM service. */
export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body as RegisterInput)
      res.status(201).json(result) // 201 SEM autologin (decisão do plano)
    } catch (err) {
      next(err)
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as { email: string; password: string }
      const session = await authService.login(email, password)
      setRefreshCookie(res, session.refreshToken)
      const { refreshToken: _omitido, ...body } = session
      res.json(body)
    } catch (err) {
      next(err)
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cookie = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE]
      const session = await authService.refresh(cookie ?? '')
      setRefreshCookie(res, session.refreshToken)
      const { refreshToken: _omitido, ...body } = session
      res.json(body)
    } catch (err) {
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' })
      next(err)
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cookie = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE]
      await authService.logout(cookie)
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' })
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as { email: string }
      await authService.forgotPassword(email, consoleMailAdapter)
      res.status(202).json({ message: 'Se o e-mail existir, enviaremos instruções.' })
    } catch (err) {
      next(err)
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body as { token: string; newPassword: string }
      await authService.resetPassword(token, newPassword)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },

  async me(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await authService.me())
    } catch (err) {
      next(err)
    }
  },
}
