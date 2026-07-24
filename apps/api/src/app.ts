import path from 'node:path'
import fs from 'node:fs'
import express from 'express'
import cookieParser from 'cookie-parser'
import { routes } from './routes'
import { errorHandler } from './middlewares/error-handler'

export function createApp(): express.Express {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1) // atrás do proxy do provedor em staging
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())

  app.use('/api', routes)

  // Staging same-origin: se o build do web existir, o api o serve (SPA fallback).
  const webDist = process.env.WEB_DIST ?? path.resolve(__dirname, '../../web/dist')
  if (fs.existsSync(path.join(webDist, 'index.html'))) {
    app.use(express.static(webDist))
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(webDist, 'index.html'))
    })
  }

  app.use(errorHandler)
  return app
}
