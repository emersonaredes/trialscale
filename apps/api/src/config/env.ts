import path from 'node:path'
import dotenv from 'dotenv'
import { z } from 'zod'

// O .env vive na RAIZ do repo (ponto único de manutenção — decisão do usuário).
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  APP_URL: z.string().url().default('http://localhost:5173'),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_NAME_TEST: z.string().min(1).default('trialscale_test'),
  // Opcional (deploy): socket unix do Cloud SQL (/cloudsql/PROJETO:REGIAO:INSTANCIA)
  // — quando definido, substitui host/porta. E tamanho do pool de conexões.
  DB_SOCKET_PATH: z.string().min(1).optional(),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  // Opcional (deploy): no boot, aplica o schema, carrega o catálogo e garante
  // o usuário staff (STAFF_EMAIL/STAFF_PASSWORD) — idempotente.
  AUTO_BOOTSTRAP: z.enum(['true', 'false']).default('false'),
  STAFF_EMAIL: z.string().email().optional(),
  STAFF_PASSWORD: z.string().min(10).optional(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa de >=32 caracteres'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900), // 15 min
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(30),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  // Falha no boot com mensagem clara — sem valores, só os nomes dos campos.
  const campos = parsed.error.issues.map((i) => i.path.join('.')).join(', ')
  throw new Error(`Configuração inválida no .env — verifique: ${campos}`)
}

export const env = parsed.data
export const isTest = env.NODE_ENV === 'test'
export const isProd = env.NODE_ENV === 'production'
/** Em teste, o Sequelize aponta para o banco de teste — NUNCA o dev. */
export const dbName = isTest ? env.DB_NAME_TEST : env.DB_NAME
