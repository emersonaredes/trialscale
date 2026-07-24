import { request, registerAndLogin } from '../helpers/http'
import { truncateAll, closeDb } from '../helpers/db'
import { runWithoutTenantScope } from '../../src/context/request-context'
import { Consent, TenantSpecialty, Membership, User } from '../../src/models'

beforeEach(truncateAll)
afterAll(closeDb)

const payloadRegistro = (email: string) => ({
  name: 'Emerson Teste',
  email,
  password: 'SenhaForte#123',
  tenant: {
    name: 'Centro Teste',
    tipoInstituicao: 'publica',
    cidade: 'São Paulo',
    estado: 'SP',
    protocolosAtivosFaixa: '0_10',
    specialtyIds: [1, 2, 3],
  },
  consent: { version: 'v1-test', accepted: true },
})

describe('POST /api/auth/register', () => {
  it('cria user+tenant+membership+consent+especialidades em uma transação (201)', async () => {
    const res = await request().post('/api/auth/register').send(payloadRegistro('novo@c.dev'))
    expect(res.status).toBe(201)
    expect(res.body.userId).toBeGreaterThan(0)
    expect(res.body.tenantId).toBeGreaterThan(0)

    await runWithoutTenantScope('verificação-teste', async () => {
      expect(await Membership.count()).toBe(1)
      expect(await Consent.count()).toBe(1)
      expect(await TenantSpecialty.count()).toBe(3)
    })
  })

  it('e-mail duplicado → 409', async () => {
    await request().post('/api/auth/register').send(payloadRegistro('dup@c.dev'))
    const res = await request().post('/api/auth/register').send(payloadRegistro('dup@c.dev'))
    expect(res.status).toBe(409)
  })

  it('sem consentimento aceito → 400 e nada é criado', async () => {
    const payload = payloadRegistro('semconsent@c.dev')
    const res = await request()
      .post('/api/auth/register')
      .send({ ...payload, consent: { version: 'v1', accepted: false } })
    expect(res.status).toBe(400)
    await runWithoutTenantScope('verificação-teste', async () => {
      expect(await User.count()).toBe(0)
    })
  })

  it('UF inválida e especialidade inexistente → 400', async () => {
    const p1 = payloadRegistro('uf@c.dev')
    p1.tenant.estado = 'XX'
    expect((await request().post('/api/auth/register').send(p1)).status).toBe(400)

    const p2 = payloadRegistro('esp@c.dev')
    p2.tenant.specialtyIds = [9999]
    expect((await request().post('/api/auth/register').send(p2)).status).toBe(400)
  })
})

describe('login/me/refresh/logout', () => {
  it('login devolve access token + cookie httpOnly; /me responde a sessão', async () => {
    const sessao = await registerAndLogin('fluxo')
    expect(sessao.accessToken).toBeTruthy()
    expect(sessao.cookies.some((c) => c.startsWith('ts_refresh=') && c.includes('HttpOnly'))).toBe(true)

    const me = await request().get('/api/me').set('Authorization', `Bearer ${sessao.accessToken}`)
    expect(me.status).toBe(200)
    expect(me.body.tenant.id).toBe(sessao.tenantId)
    expect(me.body.role).toBe('administrador')
  })

  it('senha errada → 401 genérico (sem enumeração)', async () => {
    const sessao = await registerAndLogin('senha')
    const res = await request()
      .post('/api/auth/login')
      .send({ email: sessao.email, password: 'errada!' })
    expect(res.status).toBe(401)
    const inexistente = await request()
      .post('/api/auth/login')
      .send({ email: 'naoexiste@x.dev', password: 'qualquer1' })
    expect(inexistente.status).toBe(401)
    expect(res.body.message).toBe(inexistente.body.message) // mesma mensagem
  })

  it('/me sem token → 401', async () => {
    expect((await request().get('/api/me')).status).toBe(401)
  })

  it('refresh ROTACIONA; reuso do token antigo revoga a família inteira', async () => {
    const sessao = await registerAndLogin('rotacao')

    const r1 = await request().post('/api/auth/refresh').set('Cookie', sessao.cookies)
    expect(r1.status).toBe(200)
    const cookies2raw = r1.headers['set-cookie']
    const cookies2 = Array.isArray(cookies2raw) ? cookies2raw : [cookies2raw as string]

    // Reuso do cookie ANTIGO (já rotacionado) → 401 + família revogada
    const reuso = await request().post('/api/auth/refresh').set('Cookie', sessao.cookies)
    expect(reuso.status).toBe(401)

    // O cookie novo TAMBÉM cai (família inteira revogada — detecção de roubo)
    const aposReuso = await request().post('/api/auth/refresh').set('Cookie', cookies2)
    expect(aposReuso.status).toBe(401)
  })

  it('logout revoga a sessão: refresh seguinte falha', async () => {
    const sessao = await registerAndLogin('logout')
    const out = await request().post('/api/auth/logout').set('Cookie', sessao.cookies)
    expect(out.status).toBe(204)
    const depois = await request().post('/api/auth/refresh').set('Cookie', sessao.cookies)
    expect(depois.status).toBe(401)
  })
})

describe('recuperação de senha', () => {
  function capturarLinkReset(): { restore: () => void; url: () => string | null } {
    let capturada: string | null = null
    const original = console.log
    console.log = (...args: unknown[]) => {
      const texto = args.join(' ')
      const m = texto.match(/https?:\/\/\S*redefinir-senha\?token=(\S+)/)
      if (m) capturada = m[0]
      original(...args)
    }
    return { restore: () => (console.log = original), url: () => capturada }
  }

  it('forgot responde 202 sempre (existente e inexistente)', async () => {
    const sessao = await registerAndLogin('forgot')
    expect(
      (await request().post('/api/auth/forgot-password').send({ email: sessao.email })).status,
    ).toBe(202)
    expect(
      (await request().post('/api/auth/forgot-password').send({ email: 'x@nao.dev' })).status,
    ).toBe(202)
  })

  it('reset troca a senha, derruba todas as sessões e o token é single-use', async () => {
    const sessao = await registerAndLogin('reset')
    const captura = capturarLinkReset()
    try {
      await request().post('/api/auth/forgot-password').send({ email: sessao.email })
    } finally {
      captura.restore()
    }
    const url = captura.url()
    expect(url).toBeTruthy()
    const token = new URL(url as string).searchParams.get('token') as string

    const res = await request()
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'NovaSenha#456' })
    expect(res.status).toBe(204)

    // sessões antigas caíram
    expect((await request().post('/api/auth/refresh').set('Cookie', sessao.cookies)).status).toBe(401)
    // senha antiga não vale; nova vale
    expect(
      (await request().post('/api/auth/login').send({ email: sessao.email, password: sessao.password }))
        .status,
    ).toBe(401)
    expect(
      (
        await request()
          .post('/api/auth/login')
          .send({ email: sessao.email, password: 'NovaSenha#456' })
      ).status,
    ).toBe(200)
    // single-use
    expect(
      (
        await request()
          .post('/api/auth/reset-password')
          .send({ token, newPassword: 'Outra#789x' })
      ).status,
    ).toBe(401)
  })
})

describe('infra', () => {
  it('GET /api/health responde com ping de banco', async () => {
    const res = await request().get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', db: 'ok' })
  })

  it('GET /api/specialties lista o lookup global', async () => {
    const res = await request().get('/api/specialties')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(30)
    expect(res.body[0]).toHaveProperty('name')
  })
})
