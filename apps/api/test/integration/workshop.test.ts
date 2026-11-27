/**
 * Workshop ao vivo (spec 006) — fluxo de ponta a ponta pela API:
 * staff cria sala → celulares entram (apelido sorteado) → votam objetivos →
 * ranking pela matriz → processo enviado → autoavaliação → distribuição.
 * Cobre CA-1..CA-7 (CA-8, carga, é script à parte).
 */
import { contentService, type DraftGraphInput } from '../../src/services/content-service'
import { objectiveRepository } from '../../src/repositories/journey-repository'
import { priorityLookupRepository } from '../../src/repositories/paid-journey-repository'
import { identityRepository } from '../../src/repositories/identity-repository'
import { sequelize } from '../../src/db/sequelize'
import { request, registerAndLogin } from '../helpers/http'
import { truncateAll, closeDb } from '../helpers/db'

beforeEach(truncateAll)
afterAll(closeDb)

async function loginStaff() {
  const hash = (await import('../../src/adapters/password-hasher')).passwordHasher
  await identityRepository.createUser({
    email: 'staff-ws@t.dev',
    password_hash: await hash.hash('SenhaStaff#123'),
    name: 'Staff',
    is_staff: true,
  })
  const login = await request()
    .post('/api/auth/login')
    .send({ email: 'staff-ws@t.dev', password: 'SenhaStaff#123' })
  return { Authorization: `Bearer ${login.body.accessToken as string}` }
}

/** Catálogo mínimo: 2 processos publicados, 3 objetivos, matriz conhecida. */
async function montarCatalogo() {
  const pa = await contentService.createProcess({ code: '2.5', name: 'Processo A', processGroup: 'central' })
  const pb = await contentService.createProcess({ code: '7', name: 'Processo B', processGroup: 'suporte' })
  const graph = (prefixo: string): DraftGraphInput => ({
    levels: [{ number: 1, description: 'inicial' }],
    artifacts: [
      { logicalKey: `${prefixo}-e2`, typeCode: 'pop', title: 'Essencial N2', dodText: 'dod', seals: ['T'], ownLevel: 2, ownClassification: 'essencial' },
      { logicalKey: `${prefixo}-c2`, typeCode: 'registro', title: 'Complementar N2', dodText: 'dod', seals: ['D'], ownLevel: 2, ownClassification: 'complementar' },
      { logicalKey: `${prefixo}-e3`, typeCode: 'pop', title: 'Essencial N3', dodText: 'dod', seals: ['T'], ownLevel: 3, ownClassification: 'essencial' },
      { logicalKey: `${prefixo}-cond3`, typeCode: 'pop', title: 'Condicional N3', dodText: 'dod', seals: ['A'], conditionCode: 'centro_publico', ownLevel: 3, ownClassification: 'essencial' },
      { logicalKey: `${prefixo}-e4`, typeCode: 'indicador', title: 'Essencial N4', dodText: 'dod', seals: ['T'], ownLevel: 4, ownClassification: 'essencial' },
    ],
  })
  for (const [p, prefixo] of [[pa, 'a'], [pb, 'b']] as const) {
    const draft = await contentService.createDraft(p.id, null)
    await contentService.saveDraft(draft.versionId, graph(prefixo))
    await contentService.publish(draft.versionId, null)
  }
  const [o1] = await objectiveRepository.findOrCreate('Tema 1', 'Objetivo 1')
  const [o2] = await objectiveRepository.findOrCreate('Tema 1', 'Objetivo 2')
  const [o3] = await objectiveRepository.findOrCreate('Tema 2', 'Objetivo 3')
  const [o4] = await objectiveRepository.findOrCreate('Tema 2', 'Objetivo 4')
  const ids = [o1, o2, o3, o4].map((o) => Number(o.get('id')))
  await priorityLookupRepository.setWeight(ids[0]!, pa.id, 3)
  await priorityLookupRepository.setWeight(ids[1]!, pb.id, 2)
  await priorityLookupRepository.setWeight(ids[2]!, pb.id, 1)
  return { pa: pa.id, pb: pb.id, objetivos: ids }
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

describe('Workshop ao vivo', () => {
  it('CA-1: só staff cria sala; código único de 6 caracteres', async () => {
    const centro = await registerAndLogin('ws')
    const negado = await request()
      .post('/api/workshops')
      .set(bearer(centro.accessToken))
      .send({ name: 'Sala do centro' })
    expect(negado.status).toBe(403)

    const staff = await loginStaff()
    const criada = await request().post('/api/workshops').set(staff).send({ name: 'Workshop Teste' })
    expect(criada.status).toBe(201)
    expect(criada.body.code).toMatch(/^[A-Z2-9]{6}$/)
    expect(criada.body.step).toBe('entrada')

    const lista = await request().get('/api/workshops').set(staff)
    expect(lista.body).toHaveLength(1)
  })

  it('fluxo completo: entrar → votar → rankings → avaliar → distribuição', async () => {
    const cat = await montarCatalogo()
    const staff = await loginStaff()
    const sala = (await request().post('/api/workshops').set(staff).send({ name: 'Workshop Fluxo' })).body
    const base = `/api/w/${sala.code as string}`

    // CA-2: entrar sem digitar nada — apelido sorteado e único
    const p1 = (await request().post(`${base}/join`)).body
    const p2 = (await request().post(`${base}/join`)).body
    const p3 = (await request().post(`${base}/join`)).body
    expect(p1.nickname).toMatch(/\S+ \d+/)
    expect(new Set([p1.nickname, p2.nickname, p3.nickname]).size).toBe(3)
    expect((await request().get(`${base}/state`)).status).toBe(401)
    expect((await request().post('/api/w/ZZZZZZ/join')).status).toBe(404)

    // CA-3: votar só no passo de objetivos; até 3; revotar substitui
    const [o1, o2, o3, o4] = cat.objetivos as [number, number, number, number]
    const cedo = await request().put(`${base}/votes`).set(bearer(p1.token)).send({ objectiveIds: [o1] })
    expect(cedo.status).toBe(409)
    await request().post(`/api/workshops/${sala.id}/step`).set(staff).send({ step: 'objetivos' })
    const demais = await request()
      .put(`${base}/votes`)
      .set(bearer(p1.token))
      .send({ objectiveIds: [o1, o2, o3, o4] })
    expect(demais.status).toBe(400)
    expect(
      (await request().put(`${base}/votes`).set(bearer(p1.token)).send({ objectiveIds: [99999] })).status,
    ).toBe(400)
    await request().put(`${base}/votes`).set(bearer(p1.token)).send({ objectiveIds: [o2, o3] })
    await request().put(`${base}/votes`).set(bearer(p1.token)).send({ objectiveIds: [o1] }) // substitui
    await request().put(`${base}/votes`).set(bearer(p2.token)).send({ objectiveIds: [o1, o2] })
    await request().put(`${base}/votes`).set(bearer(p3.token)).send({ objectiveIds: [o2, o3] })

    // CA-4: ranking pela matriz — A: 2×3 = 6 · B: 2×2 + 1×1 = 5
    let snap = (
      await request().post(`/api/workshops/${sala.id}/step`).set(staff).send({ step: 'ranking_processos' })
    ).body
    expect(snap.participants.total).toBe(3)
    expect(snap.objectives.respondents).toBe(3)
    expect(snap.objectives.ranking.slice(0, 3).map((o: { id: number; votes: number }) => [o.id, o.votes])).toEqual([
      [o1, 2],
      [o2, 2],
      [o3, 1],
    ])
    expect(snap.processes.map((p: { id: number; points: number; score: number }) => [p.id, p.points, p.score])).toEqual([
      [cat.pa, 6, 100],
      [cat.pb, 5, 83],
    ])
    const tarde = await request().put(`${base}/votes`).set(bearer(p1.token)).send({ objectiveIds: [o1] })
    expect(tarde.status).toBe(409)

    // Detalhe do processo no telão
    const detalhe = await request().get(`/api/workshops/${sala.id}/processes/${cat.pa}`).set(staff)
    expect(detalhe.status).toBe(200)
    expect(detalhe.body.artifacts).toHaveLength(5)

    // Passo 5: enviar processo; antes disso não há autoavaliação
    expect((await request().get(`${base}/process`).set(bearer(p1.token))).status).toBe(409)
    snap = (await request().post(`/api/workshops/${sala.id}/process`).set(staff).send({ processId: cat.pa })).body
    expect(snap.room.step).toBe('avaliacao')
    expect(snap.room.process.id).toBe(cat.pa)

    // Passo 6: conteúdo no celular
    const proc = (await request().get(`${base}/process`).set(bearer(p1.token))).body
    const art = (titulo: string) =>
      (proc.artifacts as Array<{ id: number; title: string; conditional: boolean }>).find((a) => a.title === titulo)!
    expect(art('Condicional N3').conditional).toBe(true)

    // CA-5: nível pela regra do produto
    // p1: nada → nível 1
    const r1 = await request().put(`${base}/assessment`).set(bearer(p1.token)).send({ artifactIds: [] })
    expect(r1.body.level).toBe(1)
    expect(r1.body.missing.map((m: { title: string }) => m.title)).toEqual(['Essencial N2'])
    // p2: essenciais N2 e N3, condicional "não se aplica" → nível 3 (complementar não trava)
    const r2 = await request()
      .put(`${base}/assessment`)
      .set(bearer(p2.token))
      .send({
        artifactIds: [art('Essencial N2').id, art('Essencial N3').id],
        notApplicableIds: [art('Condicional N3').id],
      })
    expect(r2.body.level).toBe(3)
    expect(r2.body.nextLevel.number).toBe(4)
    // p3: N2 e N3 SEM tratar o condicional → fica no nível 2
    const r3 = await request()
      .put(`${base}/assessment`)
      .set(bearer(p3.token))
      .send({ artifactIds: [art('Essencial N2').id, art('Essencial N3').id] })
    expect(r3.body.level).toBe(2)
    // "não se aplica" só vale para condicional; artefato de outro processo é recusado
    expect(
      (
        await request()
          .put(`${base}/assessment`)
          .set(bearer(p3.token))
          .send({ artifactIds: [], notApplicableIds: [art('Essencial N2').id] })
      ).status,
    ).toBe(400)
    expect(
      (await request().put(`${base}/assessment`).set(bearer(p3.token)).send({ artifactIds: [999999] })).status,
    ).toBe(400)
    // reenviar substitui (não duplica)
    await request().put(`${base}/assessment`).set(bearer(p1.token)).send({ artifactIds: [art('Essencial N2').id] })

    // CA-6: distribuição conta quem finalizou o processo atual
    snap = (
      await request().post(`/api/workshops/${sala.id}/step`).set(staff).send({ step: 'distribuicao' })
    ).body
    expect(snap.assessment.finished).toBe(3)
    expect(snap.assessment.distribution).toEqual([0, 2, 1, 0, 0])

    // Reconectar: o celular recupera apelido, votos e resultado
    const estado = (await request().get(`${base}/state`).set(bearer(p2.token))).body
    expect(estado.me.nickname).toBe(p2.nickname)
    expect(estado.result.level).toBe(3)
    expect(estado.room.step).toBe('distribuicao')

    // Remover participante: sai da contagem e perde o acesso
    const lista = snap.participants.list as Array<{ id: number; nickname: string }>
    const alvo = lista.find((x) => x.nickname === p3.nickname)!
    snap = (await request().delete(`/api/workshops/${sala.id}/participants/${alvo.id}`).set(staff)).body
    expect(snap.participants.total).toBe(2)
    expect(snap.assessment.distribution).toEqual([0, 1, 1, 0, 0])
    expect((await request().get(`${base}/state`).set(bearer(p3.token))).status).toBe(401)

    // Encerrar: ninguém entra nem responde
    await request().post(`/api/workshops/${sala.id}/close`).set(staff)
    expect((await request().post(`${base}/join`)).status).toBe(409)
    expect(
      (await request().put(`${base}/assessment`).set(bearer(p1.token)).send({ artifactIds: [] })).status,
    ).toBe(409)
  })

  it('CA-7: salas isoladas entre si e dos dados reais dos centros', async () => {
    const cat = await montarCatalogo()
    const staff = await loginStaff()
    const a = (await request().post('/api/workshops').set(staff).send({ name: 'Sala A' })).body
    const b = (await request().post('/api/workshops').set(staff).send({ name: 'Sala B' })).body
    const pa = (await request().post(`/api/w/${a.code}/join`)).body
    await request().post(`/api/w/${b.code}/join`)

    // token da sala A não vale na sala B
    expect((await request().get(`/api/w/${b.code}/state`).set(bearer(pa.token))).status).toBe(401)

    await request().post(`/api/workshops/${a.id}/step`).set(staff).send({ step: 'objetivos' })
    await request().put(`/api/w/${a.code}/votes`).set(bearer(pa.token)).send({ objectiveIds: [cat.objetivos[0]] })
    await request().post(`/api/workshops/${a.id}/process`).set(staff).send({ processId: cat.pa })
    await request().put(`/api/w/${a.code}/assessment`).set(bearer(pa.token)).send({ artifactIds: [] })

    const snapB = (await request().get(`/api/workshops/${b.id}`).set(staff)).body
    expect(snapB.participants.total).toBe(1)
    expect(snapB.objectives.respondents).toBe(0)
    expect(snapB.assessment).toBeNull()

    // Nada do workshop vaza para as tabelas de centro
    for (const tabela of ['assessment', 'pain_score', 'tenant_objective']) {
      const [rows] = await sequelize.query(`SELECT COUNT(*) AS n FROM \`${tabela}\``)
      expect(Number((rows as Array<{ n: number }>)[0]!.n)).toBe(0)
    }
  })

  it('catálogo do workshop é só o GLOBAL de CPC', async () => {
    const cat = await montarCatalogo()
    await contentService.createProcess({ code: 'O1', name: 'Processo ORPC', processGroup: 'central', orgType: 'orpc' })
    await objectiveRepository.findOrCreate('Tema ORPC', 'Objetivo ORPC', 'orpc')
    const staff = await loginStaff()
    const sala = (await request().post('/api/workshops').set(staff).send({ name: 'Sala CPC' })).body
    const p = (await request().post(`/api/w/${sala.code}/join`)).body

    const objetivos = (await request().get(`/api/w/${sala.code}/objectives`).set(bearer(p.token))).body
    const nomes = (objetivos.themes as Array<{ items: Array<{ name: string }> }>).flatMap((t) => t.items.map((i) => i.name))
    expect(nomes).toHaveLength(4)
    expect(nomes).not.toContain('Objetivo ORPC')

    const snap = (await request().get(`/api/workshops/${sala.id}`).set(staff)).body
    expect((snap.processes as Array<{ id: number }>).map((x) => x.id).sort()).toEqual([cat.pa, cat.pb].sort())
  })
})
