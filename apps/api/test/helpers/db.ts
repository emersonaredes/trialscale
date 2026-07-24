import { sequelize } from '../../src/db/sequelize'

/** Tabelas de DADOS truncadas entre testes (lookups seedados são preservados). */
const DATA_TABLES = [
  // Jornada paga (Etapa 3) — process_dependency já está na lista da Fatia 1
  'round_process',
  'round',
  'objective_process_weight',
  // Jornada (Fatia 2)
  'pain_score',
  'tenant_objective',
  'objective',
  // Raio-X e catálogo (Fatia 1) — filhas primeiro
  'assessment',
  'process_applicability',
  'level_target',
  'artifact_template',
  'artifact_seal',
  'artifact_placement',
  'artifact',
  'level',
  'content_version',
  'process_dependency',
  'process',
  // Zona de centro / identidade (Fatia 0)
  'tenant_specialty',
  'consent',
  'refresh_token',
  'password_reset_token',
  'audit_log',
  'membership',
  'tenant',
  'user',
]

export async function truncateAll(): Promise<void> {
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
  for (const table of DATA_TABLES) {
    await sequelize.query(`TRUNCATE TABLE \`${table}\``)
  }
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
}

export async function closeDb(): Promise<void> {
  await sequelize.close()
}
