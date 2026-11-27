import crypto from 'node:crypto'
import { getContext, runWithContext, type RequestContext } from '../context/request-context'
import { isTest } from '../config/env'
import { contentRepository } from '../repositories/content-repository'
import { guideRepository } from '../repositories/guide-repository'
import { objectiveRepository } from '../repositories/journey-repository'
import { priorityLookupRepository } from '../repositories/paid-journey-repository'
import { workshopRepository } from '../repositories/workshop-repository'
import { WORKSHOP_STEPS, type WorkshopStep } from '../types/domain'
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationFailedError,
} from '../errors/domain-errors'
import { computeLevel } from './level-calculator'
import { compareCodes, rankObjectives, rankProcesses } from './workshop-ranking'
import { workshopHub } from './workshop-hub'

/**
 * WORKSHOP AO VIVO (spec 006). Sala de demonstração À PARTE dos centros:
 * lê só o catálogo GLOBAL PUBLICADO de CPC e grava apenas nas tabelas
 * workshop_* — nunca em dados de tenant.
 */

export const MAX_OBJECTIVES = 3

// ------------------------------------------------------------------ contexto
/** Contexto de leitura do catálogo: sem tenant (só global) e org_type CPC —
 *  os hooks das zonas 'catalog'/'org-lookup' aplicam o filtro (ADR 001). */
export function workshopContext(): RequestContext {
  return {
    requestId: crypto.randomUUID(),
    userId: null,
    tenantId: null,
    role: null,
    isStaff: false,
    orgType: 'cpc',
  }
}
function comCatalogoCpc<T>(fn: () => Promise<T>): Promise<T> {
  return runWithContext(workshopContext(), fn) as Promise<T>
}

// ------------------------------------------------------------------ cache
// O catálogo não muda durante o evento: cache curto evita que 200 celulares
// disparem as mesmas consultas ao mesmo tempo (a Promise é compartilhada).
const TTL_MS = isTest ? 0 : 30_000
const cache = new Map<string, { at: number; value: Promise<unknown> }>()
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as Promise<T>
  const value = load()
  cache.set(key, { at: Date.now(), value })
  value.catch(() => cache.delete(key))
  return value
}

// ------------------------------------------------------------------ catálogo
interface CatalogProcess {
  id: number
  code: string | null
  name: string
  group: string
  oneLine: string | null
  published: boolean
}
interface Catalog {
  objectives: Array<{ id: number; theme: string; name: string }>
  processes: CatalogProcess[]
  weights: Array<{ objectiveId: number; processId: number; weight: number }>
}

function loadCatalog(): Promise<Catalog> {
  return cached('catalog', () =>
    comCatalogoCpc(async () => {
      const [objetivos, processos, publicados, pesos] = await Promise.all([
        objectiveRepository.listAll(),
        contentRepository.listProcesses(),
        contentRepository.listPublishedVersions(),
        priorityLookupRepository.listWeights(),
      ])
      const publicadoIds = new Set(publicados.map((v) => Number(v.get('process_id'))))
      const processes = processos
        .map((p) => ({
          id: Number(p.get('id')),
          code: p.get('code') as string | null,
          name: p.get('name') as string,
          group: p.get('process_group') as string,
          oneLine: p.get('one_line_description') as string | null,
          published: publicadoIds.has(Number(p.get('id'))),
        }))
        .sort((a, b) => compareCodes(a.code, b.code))
      const processIds = new Set(processes.map((p) => p.id))
      const objectives = objetivos.map((o) => ({
        id: Number(o.get('id')),
        theme: o.get('theme') as string,
        name: o.get('name') as string,
      }))
      const objectiveIds = new Set(objectives.map((o) => o.id))
      const weights = pesos
        .map((w) => ({
          objectiveId: Number(w.get('objective_id')),
          processId: Number(w.get('process_id')),
          weight: Number(w.get('weight')),
        }))
        .filter((w) => objectiveIds.has(w.objectiveId) && processIds.has(w.processId))
      return { objectives, processes, weights }
    }),
  )
}

export interface WorkshopArtifact {
  id: number
  title: string
  dodText: string
  whyItMatters: string | null
  typeName: string
  seals: string[]
  level: number
  classification: 'essencial' | 'complementar'
  /** Condicional ("se aplicável"): o participante pode marcar "não se aplica". */
  conditional: boolean
  conditionLabel: string | null
}
interface ProcessContent {
  process: CatalogProcess & { objectiveText: string | null }
  levels: Array<{ number: number; name: string; description: string | null }>
  artifacts: WorkshopArtifact[]
  guide: Record<string, unknown> | null
}

function loadProcessContent(processId: number): Promise<ProcessContent> {
  return cached(`process:${processId}`, () =>
    comCatalogoCpc(async () => {
      const [row, version] = await Promise.all([
        contentRepository.findProcessById(processId),
        contentRepository.findPublishedVersion(processId),
      ])
      if (!row || !version) throw new NotFoundError('Processo não encontrado.')
      const [placements, levelRows, types, conditions, guideRow] = await Promise.all([
        contentRepository.findEffectivePlacementsForProcess(processId),
        contentRepository.findLevelsByVersion(Number(version.get('id'))),
        contentRepository.listArtifactTypes(),
        contentRepository.listConditions(),
        guideRepository.findByProcessId(processId),
      ])
      const typeById = new Map(types.map((t) => [Number(t.get('id')), t.get('name') as string]))
      const condById = new Map(
        conditions.map((c) => [Number(c.get('id')), c.get('description') as string]),
      )
      const ids = placements.map(({ artifact }) => Number(artifact.get('id')))
      const seals = await contentRepository.findSealsByArtifactIds(ids)
      const artifacts: WorkshopArtifact[] = placements
        .map(({ placement, artifact }) => {
          const id = Number(artifact.get('id'))
          const condId = artifact.get('applicability_condition_id') as number | null
          return {
            id,
            title: artifact.get('title') as string,
            dodText: artifact.get('dod_text') as string,
            whyItMatters: artifact.get('why_it_matters') as string | null,
            typeName: typeById.get(Number(artifact.get('artifact_type_id'))) ?? '',
            seals: seals
              .filter((s) => Number(s.get('artifact_id')) === id)
              .map((s) => s.get('seal_code') as string),
            level: Number(placement.get('level_number')),
            classification: placement.get('classification') as 'essencial' | 'complementar',
            conditional: condId != null,
            conditionLabel: condId != null ? (condById.get(Number(condId)) ?? null) : null,
          }
        })
        .sort(
          (a, b) =>
            a.level - b.level ||
            (a.classification === b.classification ? 0 : a.classification === 'essencial' ? -1 : 1) ||
            a.title.localeCompare(b.title),
        )
      const guide = guideRow
        ? {
            purposeMd: guideRow.get('purpose_md'),
            flowMd: guideRow.get('flow_md'),
            flow: {
              inputs: guideRow.get('flow_inputs') ?? [],
              activities: guideRow.get('flow_activities') ?? [],
              outputs: guideRow.get('flow_outputs') ?? [],
            },
            indicators: guideRow.get('indicators') ?? [],
            risks: guideRow.get('risks') ?? [],
            practices: guideRow.get('practices') ?? [],
            regulatory: guideRow.get('regulatory') ?? [],
            gettingStarted: guideRow.get('getting_started') ?? [],
            sourceCitation: guideRow.get('source_citation') ?? null,
          }
        : null
      return {
        process: {
          id: processId,
          code: row.get('code') as string | null,
          name: row.get('name') as string,
          group: row.get('process_group') as string,
          oneLine: row.get('one_line_description') as string | null,
          objectiveText: row.get('objective_text') as string | null,
          published: true,
        },
        levels: levelRows.map((l) => ({
          number: Number(l.get('number')),
          name: l.get('name') as string,
          description: l.get('description') as string | null,
        })),
        artifacts,
        guide,
      }
    }),
  )
}

// ------------------------------------------------------------------ apelidos
// Identificador SORTEADO (decisão 2026-11-27): ninguém digita nada ao entrar.
const BICHOS = [
  'Arara', 'Tucano', 'Capivara', 'Onça', 'Tamanduá', 'Jabuti', 'Sabiá', 'Boto', 'Lobo-guará',
  'Quati', 'Tatu', 'Preguiça', 'Mico', 'Jacaré', 'Coruja', 'Beija-flor', 'Garça', 'Ema',
  'Anta', 'Cutia', 'Paca', 'Jaguatirica', 'Gavião', 'Papagaio', 'Periquito', 'Bem-te-vi',
  'Canário', 'Curió', 'Seriema', 'Tuiuiú', 'Pirarucu', 'Tambaqui', 'Peixe-boi', 'Golfinho',
  'Baleia', 'Tartaruga', 'Sagui', 'Bugio', 'Ariranha', 'Lontra', 'Gambá', 'Ouriço',
  'Suçuarana', 'Veado', 'Cervo', 'Harpia', 'Urubu-rei', 'Maritaca', 'Pica-pau', 'João-de-barro',
]
function sortearApelido(): string {
  const bicho = BICHOS[crypto.randomInt(BICHOS.length)]
  return `${bicho} ${crypto.randomInt(1, 100)}`
}

const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // sem 0/O, 1/I/L
function sortearCodigo(): string {
  let s = ''
  for (let i = 0; i < 6; i++) s += ALFABETO_CODIGO[crypto.randomInt(ALFABETO_CODIGO.length)]
  return s
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// ------------------------------------------------------------------ sala
export interface RoomRow {
  id: number
  code: string
  name: string
  status: 'aberta' | 'encerrada'
  step: WorkshopStep
  currentProcessId: number | null
  createdAt: Date | null
}
type RoomModel = NonNullable<Awaited<ReturnType<typeof workshopRepository.findRoomById>>>
export function toRoomRow(m: RoomModel): RoomRow {
  return {
    id: Number(m.get('id')),
    code: m.get('code') as string,
    name: m.get('name') as string,
    status: m.get('status') as 'aberta' | 'encerrada',
    step: m.get('step') as WorkshopStep,
    currentProcessId:
      m.get('current_process_id') != null ? Number(m.get('current_process_id')) : null,
    createdAt: (m.get('created_at') as Date | undefined) ?? null,
  }
}

async function publicRoom(room: RoomRow) {
  const catalog = await loadCatalog()
  const p = room.currentProcessId
    ? (catalog.processes.find((x) => x.id === room.currentProcessId) ?? null)
    : null
  return {
    code: room.code,
    name: room.name,
    status: room.status,
    step: room.step,
    process: p ? { id: p.id, code: p.code, name: p.name, oneLine: p.oneLine } : null,
    maxObjectives: MAX_OBJECTIVES,
  }
}

async function loadRoom(roomId: number): Promise<RoomRow> {
  const m = await workshopRepository.findRoomById(roomId)
  if (!m) throw new NotFoundError('Sala não encontrada.')
  return toRoomRow(m)
}

function exigirAberta(room: RoomRow): void {
  if (room.status !== 'aberta') throw new ConflictError('Esta sala já foi encerrada.')
}

/** Estado agregado da sala para o TELÃO. */
async function buildSnapshot(roomId: number) {
  const room = await loadRoom(roomId)
  const [catalog, participants, votes] = await Promise.all([
    loadCatalog(),
    workshopRepository.listActiveParticipants(roomId),
    workshopRepository.listVotes(roomId),
  ])
  const objectives = rankObjectives(catalog.objectives, votes)
  const ranking = rankProcesses(catalog.processes, objectives, catalog.weights)

  let assessment: {
    finished: number
    distribution: number[]
    levels: Array<{ number: number; name: string }>
  } | null = null
  if (room.currentProcessId) {
    const [levels, content] = await Promise.all([
      workshopRepository.listLevels(roomId, room.currentProcessId),
      loadProcessContent(room.currentProcessId),
    ])
    const distribution = [0, 0, 0, 0, 0]
    for (const l of levels) if (l >= 1 && l <= 5) distribution[l - 1]! += 1
    assessment = {
      finished: levels.length,
      distribution,
      levels: content.levels.map((l) => ({ number: l.number, name: l.name })),
    }
  }

  return {
    room: await publicRoom(room),
    roomId: room.id,
    participants: {
      total: participants.length,
      online: workshopHub.onlineCount(roomId),
      list: participants.map((p) => ({ id: Number(p.id), nickname: p.nickname })),
    },
    objectives: {
      respondents: new Set(votes.map((v) => v.participantId)).size,
      ranking: objectives,
    },
    processes: ranking.map((r) => ({
      id: r.process.id,
      code: r.process.code,
      name: r.process.name,
      group: r.process.group,
      published: r.process.published,
      points: r.points,
      score: r.score,
      drivers: r.drivers.slice(0, 3),
    })),
    assessment,
  }
}

function refreshAdmins(roomId: number): void {
  workshopHub.scheduleAdminRefresh(roomId, () => buildSnapshot(roomId))
}

async function notifyPlayers(roomId: number): Promise<void> {
  const room = await loadRoom(roomId)
  workshopHub.broadcastPlayers(roomId, 'room', await publicRoom(room))
}

// ------------------------------------------------------------------ service
export const workshopService = {
  // ======== APRESENTADOR (staff) ========
  async createRoom(name: string) {
    const ctx = getContext()
    if (!ctx?.userId) throw new UnauthorizedError()
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      try {
        const m = await workshopRepository.createRoom({
          code: sortearCodigo(),
          name,
          createdByUserId: ctx.userId,
        })
        return toRoomRow((await workshopRepository.findRoomById(Number(m.get('id'))))!)
      } catch (err) {
        if ((err as { name?: string }).name !== 'SequelizeUniqueConstraintError') throw err
      }
    }
    throw new ConflictError('Não foi possível gerar o código da sala. Tente de novo.')
  },

  async listRooms() {
    const rooms = (await workshopRepository.listRooms()).map(toRoomRow)
    const counts = await workshopRepository.countParticipantsByRoom(rooms.map((r) => r.id))
    const porSala = new Map(counts.map((c) => [Number(c.room_id), Number(c.total)]))
    return rooms.map((r) => ({ ...r, participants: porSala.get(r.id) ?? 0 }))
  },

  snapshot(roomId: number) {
    return buildSnapshot(roomId)
  },

  async setStep(roomId: number, step: WorkshopStep) {
    const room = await loadRoom(roomId)
    exigirAberta(room)
    if (!WORKSHOP_STEPS.includes(step)) throw new ValidationFailedError({ step: 'passo inválido' })
    if ((step === 'avaliacao' || step === 'distribuicao') && !room.currentProcessId) {
      throw new ConflictError('Escolha um processo antes de abrir a autoavaliação.')
    }
    await workshopRepository.updateRoom(roomId, { step })
    await notifyPlayers(roomId)
    return buildSnapshot(roomId)
  },

  /** Passo 5: o apresentador envia um processo para os celulares. */
  async setProcess(roomId: number, processId: number) {
    const room = await loadRoom(roomId)
    exigirAberta(room)
    const catalog = await loadCatalog()
    const p = catalog.processes.find((x) => x.id === processId)
    if (!p) throw new NotFoundError('Processo não encontrado.')
    if (!p.published) throw new ConflictError('Este processo ainda não tem conteúdo publicado.')
    await workshopRepository.updateRoom(roomId, { current_process_id: processId, step: 'avaliacao' })
    await notifyPlayers(roomId)
    return buildSnapshot(roomId)
  },

  async removeParticipant(roomId: number, participantId: number) {
    await loadRoom(roomId)
    const removed = await workshopRepository.removeParticipant(roomId, participantId)
    if (!removed) throw new NotFoundError('Participante não encontrado nesta sala.')
    workshopHub.kickPlayer(roomId, participantId)
    return buildSnapshot(roomId)
  },

  async closeRoom(roomId: number) {
    await loadRoom(roomId)
    await workshopRepository.updateRoom(roomId, { status: 'encerrada', closed_at: new Date() })
    await notifyPlayers(roomId)
    return buildSnapshot(roomId)
  },

  /** Detalhe do processo para o telão (mesmo conteúdo do produto, sem centro). */
  async processDetail(roomId: number, processId: number) {
    await loadRoom(roomId)
    const catalog = await loadCatalog()
    if (!catalog.processes.some((p) => p.id === processId)) {
      throw new NotFoundError('Processo não encontrado.')
    }
    return loadProcessContent(processId)
  },

  // ======== PARTICIPANTE (celular, sem conta) ========
  async join(room: RoomRow) {
    exigirAberta(room)
    const token = crypto.randomBytes(24).toString('base64url')
    for (let tentativa = 0; tentativa < 30; tentativa++) {
      // Depois de muitas colisões (sala cheia), alarga a faixa de números.
      const nickname =
        tentativa < 20 ? sortearApelido() : `${sortearApelido()}${crypto.randomInt(10, 100)}`
      try {
        const p = await workshopRepository.createParticipant(room.id, nickname, hashToken(token))
        refreshAdmins(room.id)
        return { token, nickname, participantId: Number(p.get('id')), room: await publicRoom(room) }
      } catch (err) {
        if ((err as { name?: string }).name !== 'SequelizeUniqueConstraintError') throw err
      }
    }
    throw new ConflictError('Não foi possível entrar na sala. Tente de novo.')
  },

  async state(room: RoomRow, participant: { id: number; nickname: string }) {
    const [votes, assessment] = await Promise.all([
      workshopRepository.findVotesOfParticipant(room.id, participant.id),
      room.currentProcessId
        ? workshopRepository.findAssessment(room.id, participant.id, room.currentProcessId)
        : null,
    ])
    return {
      room: await publicRoom(room),
      me: { nickname: participant.nickname },
      votes,
      result:
        assessment && room.currentProcessId
          ? await this.resultFor(
              room.currentProcessId,
              asIdArray(assessment.get('artifact_ids')),
              asIdArray(assessment.get('not_applicable_ids')),
            )
          : null,
    }
  },

  publicRoom,

  async objectives() {
    const catalog = await loadCatalog()
    const temas = new Map<string, Array<{ id: number; name: string }>>()
    for (const o of catalog.objectives) {
      const lista = temas.get(o.theme) ?? []
      lista.push({ id: o.id, name: o.name })
      temas.set(o.theme, lista)
    }
    return {
      maxObjectives: MAX_OBJECTIVES,
      themes: [...temas.entries()].map(([theme, items]) => ({ theme, items })),
    }
  },

  async saveVotes(room: RoomRow, participantId: number, objectiveIds: number[]) {
    exigirAberta(room)
    if (room.step !== 'objetivos') throw new ConflictError('A votação de objetivos não está aberta.')
    const unicos = [...new Set(objectiveIds)]
    if (unicos.length > MAX_OBJECTIVES) {
      throw new ValidationFailedError({ objectiveIds: `escolha até ${MAX_OBJECTIVES} objetivos` })
    }
    const catalog = await loadCatalog()
    const validos = new Set(catalog.objectives.map((o) => o.id))
    if (unicos.some((id) => !validos.has(id))) {
      throw new ValidationFailedError({ objectiveIds: 'objetivo inexistente' })
    }
    await workshopRepository.replaceVotes(room.id, participantId, unicos)
    refreshAdmins(room.id)
    return { votes: unicos }
  },

  /** Passo 6: conteúdo do processo atual para o celular. */
  async currentProcess(room: RoomRow, participantId: number) {
    if (!room.currentProcessId) throw new ConflictError('Nenhum processo foi enviado ainda.')
    const [content, previous] = await Promise.all([
      loadProcessContent(room.currentProcessId),
      workshopRepository.findAssessment(room.id, participantId, room.currentProcessId),
    ])
    return {
      process: content.process,
      levels: content.levels,
      artifacts: content.artifacts.map((a) => ({
        id: a.id,
        title: a.title,
        dodText: a.dodText,
        typeName: a.typeName,
        level: a.level,
        classification: a.classification,
        conditional: a.conditional,
        conditionLabel: a.conditionLabel,
      })),
      mine: previous
        ? {
            artifactIds: asIdArray(previous.get('artifact_ids')),
            notApplicableIds: asIdArray(previous.get('not_applicable_ids')),
          }
        : null,
    }
  },

  /** Nível + o que falta para o próximo (RN-3: mesma regra do produto). */
  async resultFor(processId: number, artifactIds: number[], notApplicableIds: number[]) {
    const content = await loadProcessContent(processId)
    const possui = new Set(artifactIds)
    const na = new Set(notApplicableIds)
    const itens = content.artifacts.map((a) => ({
      ...a,
      done: possui.has(a.id) || (a.conditional && na.has(a.id)),
    }))
    const { level } = computeLevel(itens)
    const nome = (n: number) => content.levels.find((l) => l.number === n)?.name ?? `Nível ${n}`
    return {
      processId,
      level,
      levelName: nome(level),
      nextLevel: level < 5 ? { number: level + 1, name: nome(level + 1) } : null,
      missing:
        level < 5
          ? itens
              .filter((a) => a.classification === 'essencial' && a.level <= level + 1 && !a.done)
              .map((a) => ({ id: a.id, title: a.title, level: a.level }))
          : [],
      essentialsDone: itens.filter((a) => a.classification === 'essencial' && a.done).length,
      essentialsTotal: itens.filter((a) => a.classification === 'essencial').length,
    }
  },

  async saveAssessment(
    room: RoomRow,
    participantId: number,
    artifactIds: number[],
    notApplicableIds: number[],
  ) {
    exigirAberta(room)
    if (!room.currentProcessId || (room.step !== 'avaliacao' && room.step !== 'distribuicao')) {
      throw new ConflictError('A autoavaliação não está aberta.')
    }
    const content = await loadProcessContent(room.currentProcessId)
    const doProcesso = new Set(content.artifacts.map((a) => a.id))
    const condicionais = new Set(content.artifacts.filter((a) => a.conditional).map((a) => a.id))
    const possui = [...new Set(artifactIds)]
    const na = [...new Set(notApplicableIds)]
    if (possui.some((id) => !doProcesso.has(id))) {
      throw new ValidationFailedError({ artifactIds: 'artefato não pertence ao processo atual' })
    }
    if (na.some((id) => !condicionais.has(id))) {
      throw new ValidationFailedError({
        notApplicableIds: '"não se aplica" só vale para artefatos condicionais',
      })
    }
    const result = await this.resultFor(room.currentProcessId, possui, na)
    await workshopRepository.saveAssessment({
      roomId: room.id,
      participantId,
      processId: room.currentProcessId,
      artifactIds: possui,
      notApplicableIds: na.filter((id) => !possui.includes(id)),
      level: result.level,
    })
    refreshAdmins(room.id)
    return result
  },
}

/** Coluna JSON: o driver pode devolver array ou string, conforme o servidor. */
function asIdArray(value: unknown): number[] {
  const v = typeof value === 'string' ? (JSON.parse(value) as unknown) : value
  return Array.isArray(v) ? v.map(Number) : []
}
