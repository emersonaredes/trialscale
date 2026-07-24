import path from 'node:path'
import fs from 'node:fs'
import mysql from 'mysql2/promise'
import { env, dbName } from '../config/env'

/**
 * Aplica o schema.sql (fonte da verdade — specs/000-modelo-de-dados) no banco
 * do .env. Cross-platform (substitui o apply-schema.ps1 no fluxo npm).
 * Idempotente: só CREATE IF NOT EXISTS / INSERT IGNORE; nunca DROP.
 * Bancos criados ANTES de uma mudança de coluna precisam das migrações
 * manuais em scripts/migrations/ (revisadas linha a linha — constituição §3).
 */
export async function applySchema(database: string = dbName): Promise<void> {
  const schemaPath = path.resolve(__dirname, '../../../../specs/000-modelo-de-dados/schema.sql')
  const sql = fs.readFileSync(schemaPath, 'utf8')

  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true,
    timezone: 'Z',
  })
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    )
    await conn.query(`USE \`${database}\`;`)
    await conn.query(sql)
  } finally {
    await conn.end()
  }
}

/** Recria o banco do zero (SÓ para o banco de TESTE — descartável). */
export async function recreateDatabase(database: string): Promise<void> {
  if (!database.includes('test')) {
    throw new Error(`recreateDatabase só aceita banco de teste (recebeu '${database}')`)
  }
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true,
  })
  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${database}\`;`)
  } finally {
    await conn.end()
  }
  await applySchema(database)
}

// Execução direta: npm run db:apply
if (require.main === module) {
  applySchema()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log(`Schema aplicado em '${dbName}'.`)
      process.exit(0)
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Falha ao aplicar schema:', err.message)
      process.exit(1)
    })
}
