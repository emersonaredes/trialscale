import { Sequelize } from 'sequelize'
import { env, dbName, isTest } from '../config/env'

/** Instância única do Sequelize. Constituição §4: UTC + utf8mb4.
 *  `sync` NUNCA é usado — o schema.sql é a fonte da verdade (decisão do
 *  usuário); os models apenas MAPEIAM as tabelas existentes. */
export const sequelize = new Sequelize(dbName, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  timezone: '+00:00', // grava DATETIME em UTC
  logging: false,
  define: {
    freezeTableName: true, // tabelas singulares, como no schema.sql
    underscored: true,
    timestamps: false, // created_at/updated_at têm DEFAULT no banco
  },
  dialectOptions: {
    charset: 'utf8mb4',
    // MySQL DATETIME não guarda offset; lemos como UTC.
    dateStrings: false,
  },
  pool: { max: isTest ? 2 : 10, min: 0, idle: 10_000 },
})
