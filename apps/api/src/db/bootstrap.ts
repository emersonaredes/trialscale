import { env } from '../config/env'
import { logger } from '../config/logger'
import { applySchema } from './apply-schema'
import { seedContent } from './seed-content'
import { seedJourney } from './seed-journey'
import { seedContentCompleto } from './seed-content-completo'
import { seedPriorities } from './seed-priorities'
import { seedGuides } from './seed-guides'
import { contentRepository } from '../repositories/content-repository'
import { identityRepository } from '../repositories/identity-repository'
import { passwordHasher } from '../adapters/password-hasher'

/**
 * Preparação automática do banco no deploy (AUTO_BOOTSTRAP=true): deixa um
 * banco VAZIO pronto para uso sem rodar comandos à mão.
 *  1. aplica o schema.sql (só CREATE IF NOT EXISTS / INSERT IGNORE);
 *  2. carrega o catálogo CPC (processos, artefatos, objetivos, guias) se
 *     ainda não houver versões publicadas;
 *  3. regrava a matriz objetivo→processo (upsert — sempre);
 *  4. garante o usuário staff de STAFF_EMAIL/STAFF_PASSWORD, se informados.
 * Idempotente: rodar de novo não duplica nada. Sem dados de teste (seed-dev).
 */
export async function bootstrap(): Promise<void> {
  await applySchema()
  const publicados = await contentRepository.listPublishedVersions()
  if (publicados.length === 0) {
    await seedContent()
    await seedJourney()
    await seedContentCompleto()
    await seedGuides()
    logger.info('bootstrap: catálogo carregado')
  }
  const { pesos } = await seedPriorities()
  logger.info({ pesos }, 'bootstrap: matriz objetivo→processo aplicada')

  if (env.STAFF_EMAIL && env.STAFF_PASSWORD) {
    if (!(await identityRepository.findUserByEmail(env.STAFF_EMAIL))) {
      await identityRepository.createUser({
        email: env.STAFF_EMAIL,
        password_hash: await passwordHasher.hash(env.STAFF_PASSWORD),
        name: 'Equipe TrialScale',
        is_staff: true,
      })
      logger.info('bootstrap: usuário staff criado')
    }
  }
}
