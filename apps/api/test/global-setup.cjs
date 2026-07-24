/** Recria o banco de TESTE do zero a partir do schema.sql — a mesma fonte da
 *  verdade do dev (zero drift). Roda uma vez por projeto Jest. */
const path = require('node:path')
const fs = require('node:fs')
const dotenv = require('dotenv')
const mysql = require('mysql2/promise')

module.exports = async function globalSetup() {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
  const database = process.env.DB_NAME_TEST || 'trialscale_test'
  if (!database.includes('test')) {
    throw new Error(`Banco de teste inválido: '${database}' (precisa conter 'test')`)
  }
  const schemaPath = path.resolve(__dirname, '../../../specs/000-modelo-de-dados/schema.sql')
  const sql = fs.readFileSync(schemaPath, 'utf8')

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  })
  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${database}\`;`)
    await conn.query(
      `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    )
    await conn.query(`USE \`${database}\`;`)
    await conn.query(sql)
  } finally {
    await conn.end()
  }
}
