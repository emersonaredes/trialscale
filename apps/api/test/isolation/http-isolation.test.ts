/**
 * SUÍTE DE ISOLAMENTO — nível HTTP (constituição §1). Dois tenants reais
 * criados pela API; provamos que a fronteira segura é o TOKEN + membership.
 */
import jwt from 'jsonwebtoken'
import { request, registerAndLogin } from '../helpers/http'
import { truncateAll, closeDb } from '../helpers/db'
import { env } from '../../src/config/env'

beforeEach(truncateAll)
afterAll(closeDb)

describe('isolamento entre tenants via HTTP', () => {
  it('sessões de A e B enxergam apenas o próprio tenant', async () => {
    const a = await registerAndLogin('tenantA')
    const b = await registerAndLogin('tenantB')

    const meA = await request().get('/api/me').set('Authorization', `Bearer ${a.accessToken}`)
    const meB = await request().get('/api/me').set('Authorization', `Bearer ${b.accessToken}`)
    expect(meA.body.tenant.id).toBe(a.tenantId)
    expect(meB.body.tenant.id).toBe(b.tenantId)
    expect(meA.body.tenant.id).not.toBe(meB.body.tenant.id)
  })

  it('token com tenant de OUTRO centro (sem membership) → 401', async () => {
    const a = await registerAndLogin('semvinculo-a')
    const b = await registerAndLogin('semvinculo-b')

    // Forja um token VÁLIDO (assinado com o segredo real) do user A apontando
    // para o tenant B: o authenticate revalida membership no banco e nega.
    const forjado = jwt.sign(
      { tenantId: b.tenantId, role: 'administrador', isStaff: false },
      env.JWT_SECRET,
      { subject: String(a.userId), expiresIn: 900, algorithm: 'HS256' },
    )
    const res = await request().get('/api/me').set('Authorization', `Bearer ${forjado}`)
    expect(res.status).toBe(401)
  })

  it('token adulterado ou com segredo errado → 401', async () => {
    const a = await registerAndLogin('adulterado')
    const adulterado = a.accessToken.slice(0, -6) + 'xxxxxx'
    expect(
      (await request().get('/api/me').set('Authorization', `Bearer ${adulterado}`)).status,
    ).toBe(401)

    const chaveErrada = jwt.sign(
      { tenantId: a.tenantId, role: 'administrador', isStaff: false },
      'segredo-falso-de-32-caracteres-xx',
      { subject: String(a.userId), expiresIn: 900 },
    )
    expect(
      (await request().get('/api/me').set('Authorization', `Bearer ${chaveErrada}`)).status,
    ).toBe(401)
  })

  it('token expirado → 401', async () => {
    const a = await registerAndLogin('expirado')
    const vencido = jwt.sign(
      { tenantId: a.tenantId, role: 'administrador', isStaff: false },
      env.JWT_SECRET,
      { subject: String(a.userId), expiresIn: -10 },
    )
    expect((await request().get('/api/me').set('Authorization', `Bearer ${vencido}`)).status).toBe(401)
  })

  it('tenantId em body/query é IGNORADO — a fonte do escopo é o token', async () => {
    const a = await registerAndLogin('fonteescopo-a')
    const b = await registerAndLogin('fonteescopo-b')

    // login de A tentando "pedir" o tenant de B no body → sessão continua de A
    const login = await request()
      .post('/api/auth/login')
      .send({ email: a.email, password: a.password, tenantId: b.tenantId })
    expect(login.status).toBe(200)
    expect(login.body.tenant.id).toBe(a.tenantId)

    // query string também não muda nada
    const me = await request()
      .get(`/api/me?tenantId=${b.tenantId}`)
      .set('Authorization', `Bearer ${a.accessToken}`)
    expect(me.body.tenant.id).toBe(a.tenantId)
  })

  it('papel do BANCO vence o do token (papel revogado cai em <=1 request)', async () => {
    const a = await registerAndLogin('papel')
    // Token afirma 'administrador', mas rebaixamos o membership no banco:
    const { Membership } = await import('../../src/models')
    await Membership.update({ role: 'membro' }, { where: { user_id: a.userId } })

    const me = await request().get('/api/me').set('Authorization', `Bearer ${a.accessToken}`)
    expect(me.status).toBe(200)
    expect(me.body.role).toBe('membro') // banco venceu
  })
})
