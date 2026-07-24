import supertest from 'supertest'
import { createApp } from '../../src/app'

export const app = createApp()
export const request = () => supertest(app)

export interface RegisteredTenant {
  email: string
  password: string
  accessToken: string
  cookies: string[]
  tenantId: number
  userId: number
}

let contador = 0

/** Registra um centro novo e loga — devolve sessão pronta para os testes. */
export async function registerAndLogin(prefixo: string): Promise<RegisteredTenant> {
  contador += 1
  const email = `${prefixo}${contador}@teste.dev`
  const password = 'SenhaForte#123'

  const reg = await request()
    .post('/api/auth/register')
    .send({
      name: `Usuário ${prefixo}`,
      email,
      password,
      tenant: {
        name: `Centro ${prefixo} ${contador}`,
        tipoInstituicao: 'privada',
        cidade: 'Ribeirão Preto',
        estado: 'SP',
        protocolosAtivosFaixa: '11_30',
        specialtyIds: [1, 2],
      },
      consent: { version: 'v1-test', accepted: true },
    })
  if (reg.status !== 201) throw new Error(`register falhou: ${reg.status} ${JSON.stringify(reg.body)}`)

  const login = await request().post('/api/auth/login').send({ email, password })
  if (login.status !== 200) throw new Error(`login falhou: ${login.status}`)

  const rawCookies = login.headers['set-cookie']
  const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : []
  return {
    email,
    password,
    accessToken: login.body.accessToken as string,
    cookies,
    tenantId: reg.body.tenantId as number,
    userId: reg.body.userId as number,
  }
}
