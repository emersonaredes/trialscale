import { createApp } from './app'
import { env } from './config/env'
import { logger } from './config/logger'
import { sequelize } from './db/sequelize'

async function main(): Promise<void> {
  await sequelize.authenticate()
  logger.info({ db: 'conectado' }, 'banco ok')
  const app = createApp()
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, `api no ar em http://localhost:${env.PORT}/api/health`)
  })
}

main().catch((err) => {
  logger.error(err, 'falha no boot')
  process.exit(1)
})
