/** Editor de pesos objetivo→processo (curadoria da priorização — staff). */
import { runWithContext } from '../../src/context/request-context'
import { priorityWeightsService } from '../../src/services/priority-weights-service'
import { priorityService } from '../../src/services/priority-service'
import { journeyService } from '../../src/services/journey-service'
import { contentService } from '../../src/services/content-service'
import { objectiveRepository } from '../../src/repositories/journey-repository'
import { identityRepository } from '../../src/repositories/identity-repository'
import { request, registerAndLogin } from '../helpers/http'
import { truncateAll, closeDb } from '../helpers/db'
import { NotFoundError } from '../../src/errors/domain-errors'

beforeEach(truncateAll)
afterAll(closeDb)

describe('priorityWeightsService', () => {
  it('setWeight faz UPSERT (cria, atualiza) e 0 remove; relevância reflete na hora', async () => {
    const p = await contentService.createProcess({ code: 'W1', name: 'Peso 1', processGroup: 'central' })
    const [obj] = await objectiveRepository.findOrCreate('Tema W', 'Objetivo W')
    const objectiveId = obj.get('id') as number

    // cria
    await priorityWeightsService.setWeight(objectiveId, p.id, 1)
    let matrix = await priorityWeightsService.getMatrix()
    expect(matrix.weights).toEqual([{ objectiveId, processId: p.id, weight: 1 }])

    // atualiza (upsert de verdade — antes findOrCreate não atualizava)
    await priorityWeightsService.setWeight(objectiveId, p.id, 3)
    matrix = await priorityWeightsService.getMatrix()
    expect(matrix.weights[0]!.weight).toBe(3)

    // relevância do processo muda para um centro que priorizou o objetivo
    const t = await identityRepository.createTenant({ name: 'Centro W' })
    const u = await identityRepository.createUser({ email: 'w@w.dev', password_hash: 'x', name: 'W' })
    await runWithContext(
      { requestId: 'w', userId: u.get('id') as number, tenantId: t.get('id') as number, role: 'administrador', isStaff: false },
      async () => {
        await journeyService.saveMyObjectives([objectiveId])
        const { items } = await priorityService.computePriorities()
        expect(items.find((i) => i.processId === p.id)?.relevance).toBe(100)
      },
    )

    // 0 remove o vínculo
    await priorityWeightsService.setWeight(objectiveId, p.id, 0)
    matrix = await priorityWeightsService.getMatrix()
    expect(matrix.weights).toHaveLength(0)
  })

  it('objetivo ou processo inexistente → NotFound', async () => {
    const p = await contentService.createProcess({ code: 'W2', name: 'Peso 2', processGroup: 'central' })
    await expect(priorityWeightsService.setWeight(9999, p.id, 2)).rejects.toThrow(NotFoundError)
    const [obj] = await objectiveRepository.findOrCreate('Tema W', 'Objetivo W2')
    await expect(
      priorityWeightsService.setWeight(obj.get('id') as number, 9999, 2),
    ).rejects.toThrow(NotFoundError)
  })
})

describe('rotas /cms/priority-weights (staff only)', () => {
  it('centro comum → 403; staff lê e grava', async () => {
    const sessao = await registerAndLogin('pesos')
    const h = { Authorization: `Bearer ${sessao.accessToken}` }
    expect((await request().get('/api/cms/priority-weights').set(h)).status).toBe(403)

    // staff
    const hash = (await import('../../src/adapters/password-hasher')).passwordHasher
    const staff = await identityRepository.createUser({
      email: 'staff-pesos@t.dev',
      password_hash: await hash.hash('SenhaStaff#123'),
      name: 'Staff',
      is_staff: true,
    })
    void staff
    const login = await request()
      .post('/api/auth/login')
      .send({ email: 'staff-pesos@t.dev', password: 'SenhaStaff#123' })
    const hs = { Authorization: `Bearer ${login.body.accessToken}` }

    const p = await contentService.createProcess({ code: 'W3', name: 'Peso 3', processGroup: 'gestao' })
    const [obj] = await objectiveRepository.findOrCreate('Tema W', 'Objetivo W3')

    const put = await request()
      .put('/api/cms/priority-weights')
      .set(hs)
      .send({ objectiveId: obj.get('id') as number, processId: p.id, weight: 2 })
    expect(put.status).toBe(204)

    const get = await request().get('/api/cms/priority-weights').set(hs)
    expect(get.status).toBe(200)
    expect(get.body.weights).toHaveLength(1)

    // peso fora de 0..3 → 400
    const invalido = await request()
      .put('/api/cms/priority-weights')
      .set(hs)
      .send({ objectiveId: obj.get('id') as number, processId: p.id, weight: 5 })
    expect(invalido.status).toBe(400)
  })
})
