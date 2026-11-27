import { Op } from 'sequelize'
import { sequelize } from '../db/sequelize'
import {
  WorkshopRoom,
  WorkshopParticipant,
  WorkshopObjectiveVote,
  WorkshopAssessment,
} from '../models/workshop'
import type { WorkshopStep } from '../types/domain'

/**
 * Repository do WORKSHOP AO VIVO (spec 006). Zona à parte da zona de centro:
 * o escopo aqui é POR SALA. Todo método de dados de participante/voto/
 * avaliação exige `roomId` — que vem SEMPRE do token do participante ou da
 * sala carregada pela rota de staff, nunca do body.
 */
export const workshopRepository = {
  // ---- salas ----------------------------------------------------------------
  createRoom(data: { code: string; name: string; createdByUserId: number }) {
    return WorkshopRoom.create({
      code: data.code,
      name: data.name,
      created_by_user_id: data.createdByUserId,
    } as never)
  },
  findRoomById(id: number) {
    return WorkshopRoom.findByPk(id)
  },
  findRoomByCode(code: string) {
    return WorkshopRoom.findOne({ where: { code } })
  },
  listRooms() {
    return WorkshopRoom.findAll({ order: [['id', 'DESC']], limit: 100 })
  },
  async updateRoom(
    id: number,
    patch: Partial<{
      step: WorkshopStep
      current_process_id: number | null
      status: 'aberta' | 'encerrada'
      closed_at: Date | null
    }>,
  ) {
    await WorkshopRoom.update(patch as never, { where: { id } })
  },

  // ---- participantes ----------------------------------------------------------
  createParticipant(roomId: number, nickname: string, tokenHash: string) {
    return WorkshopParticipant.create({
      room_id: roomId,
      nickname,
      token_hash: tokenHash,
    } as never)
  },
  findParticipantByTokenHash(tokenHash: string) {
    return WorkshopParticipant.findOne({ where: { token_hash: tokenHash } })
  },
  listActiveParticipants(roomId: number) {
    return WorkshopParticipant.findAll({
      where: { room_id: roomId, removed_at: null },
      attributes: ['id', 'nickname'],
      order: [['id', 'ASC']],
      raw: true,
    }) as unknown as Promise<Array<{ id: number; nickname: string }>>
  },
  countParticipantsByRoom(roomIds: number[]) {
    if (roomIds.length === 0) return Promise.resolve([] as Array<{ room_id: number; total: number }>)
    return WorkshopParticipant.findAll({
      where: { room_id: { [Op.in]: roomIds }, removed_at: null },
      attributes: ['room_id', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      group: ['room_id'],
      raw: true,
    }) as unknown as Promise<Array<{ room_id: number; total: number }>>
  },
  async removeParticipant(roomId: number, participantId: number): Promise<boolean> {
    const [n] = await WorkshopParticipant.update({ removed_at: new Date() } as never, {
      where: { id: participantId, room_id: roomId, removed_at: null },
    })
    return n > 0
  },

  // ---- votos de objetivo -------------------------------------------------------
  /**
   * Substitui os votos do participante pelo conjunto informado, mexendo só na
   * DIFERENÇA (apaga por chave primária, insere o que falta). Sem "apagar
   * tudo e reinserir" em transação: com a plateia votando ao mesmo tempo isso
   * gera deadlock de gap lock no MySQL. Se ainda assim houver deadlock, repete.
   */
  async replaceVotes(roomId: number, participantId: number, objectiveIds: number[]): Promise<void> {
    for (let tentativa = 1; ; tentativa++) {
      try {
        const atuais = (await WorkshopObjectiveVote.findAll({
          where: { room_id: roomId, participant_id: participantId },
          attributes: ['id', 'objective_id'],
          raw: true,
        })) as unknown as Array<{ id: number; objective_id: number }>
        const desejados = new Set(objectiveIds)
        const jaTem = new Set(atuais.map((v) => Number(v.objective_id)))
        const sobrando = atuais.filter((v) => !desejados.has(Number(v.objective_id))).map((v) => v.id)
        const faltando = objectiveIds.filter((id) => !jaTem.has(id))
        if (sobrando.length > 0) {
          await WorkshopObjectiveVote.destroy({ where: { id: { [Op.in]: sobrando } } })
        }
        if (faltando.length > 0) {
          await WorkshopObjectiveVote.bulkCreate(
            faltando.map((objective_id) => ({
              room_id: roomId,
              participant_id: participantId,
              objective_id,
            })) as never,
            { ignoreDuplicates: true }, // duplo toque no botão: o segundo envio não falha
          )
        }
        return
      } catch (err) {
        const codigo = (err as { original?: { code?: string } }).original?.code
        if (codigo !== 'ER_LOCK_DEADLOCK' || tentativa >= 3) throw err
      }
    }
  },
  async findVotesOfParticipant(roomId: number, participantId: number): Promise<number[]> {
    const rows = (await WorkshopObjectiveVote.findAll({
      where: { room_id: roomId, participant_id: participantId },
      attributes: ['objective_id'],
      raw: true,
    })) as unknown as Array<{ objective_id: number }>
    return rows.map((r) => Number(r.objective_id))
  },
  /** Votos da sala (só de participantes ativos): [participant_id, objective_id]. */
  async listVotes(roomId: number): Promise<Array<{ participantId: number; objectiveId: number }>> {
    const [rows] = await sequelize.query(
      `SELECT v.participant_id AS participantId, v.objective_id AS objectiveId
         FROM workshop_objective_vote v
         JOIN workshop_participant p ON p.id = v.participant_id AND p.removed_at IS NULL
        WHERE v.room_id = :roomId`,
      { replacements: { roomId } },
    )
    return (rows as Array<{ participantId: number; objectiveId: number }>).map((r) => ({
      participantId: Number(r.participantId),
      objectiveId: Number(r.objectiveId),
    }))
  },

  // ---- autoavaliação -----------------------------------------------------------
  async saveAssessment(data: {
    roomId: number
    participantId: number
    processId: number
    artifactIds: number[]
    notApplicableIds: number[]
    level: number
  }): Promise<void> {
    const where = {
      room_id: data.roomId,
      participant_id: data.participantId,
      process_id: data.processId,
    }
    const valores = {
      artifact_ids: data.artifactIds,
      not_applicable_ids: data.notApplicableIds,
      level: data.level,
      finished_at: new Date(),
    }
    const [n] = await WorkshopAssessment.update(valores as never, { where })
    if (n > 0) return
    try {
      await WorkshopAssessment.create({ ...where, ...valores } as never)
    } catch (err) {
      // Corrida de duplo envio: a outra requisição criou primeiro — atualiza.
      if ((err as { name?: string }).name !== 'SequelizeUniqueConstraintError') throw err
      await WorkshopAssessment.update(valores as never, { where })
    }
  },
  findAssessment(roomId: number, participantId: number, processId: number) {
    return WorkshopAssessment.findOne({
      where: { room_id: roomId, participant_id: participantId, process_id: processId },
    })
  },
  /** Níveis finalizados de um processo na sala (só participantes ativos). */
  async listLevels(roomId: number, processId: number): Promise<number[]> {
    const [rows] = await sequelize.query(
      `SELECT a.level AS level
         FROM workshop_assessment a
         JOIN workshop_participant p ON p.id = a.participant_id AND p.removed_at IS NULL
        WHERE a.room_id = :roomId AND a.process_id = :processId`,
      { replacements: { roomId, processId } },
    )
    return (rows as Array<{ level: number }>).map((r) => Number(r.level))
  },
}
