/**
 * Models do WORKSHOP AO VIVO (spec 006) — zona À PARTE da zona de centro.
 * Sala de demonstração não é tenant: nenhuma tabela tem tenant_id e nada
 * aqui se mistura com assessment/pain_score/tenant_objective dos centros.
 * Tenancy 'global' (sem hooks de tenant): o escopo é POR SALA, aplicado em
 * um único lugar — o workshop-repository, cujos métodos de dados exigem
 * roomId vindo do token do participante ou da rota de staff.
 */
import { DataTypes, type ModelDefined, type Optional } from 'sequelize'
import { sequelize } from '../db/sequelize'
import { registerTenancy } from '../db/tenancy'
import { WORKSHOP_STEPS, type WorkshopStep } from '../types/domain'

// ---------------------------------------------------------------- workshop_room
export interface WorkshopRoomAttrs {
  id: number
  code: string
  name: string
  status: 'aberta' | 'encerrada'
  step: WorkshopStep
  current_process_id: number | null
  created_by_user_id: number
  created_at?: Date
  closed_at: Date | null
}
export type WorkshopRoomCreation = Optional<
  WorkshopRoomAttrs,
  'id' | 'status' | 'step' | 'current_process_id' | 'created_at' | 'closed_at'
>
export const WorkshopRoom: ModelDefined<WorkshopRoomAttrs, WorkshopRoomCreation> = sequelize.define(
  'workshop_room',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(8), allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    status: { type: DataTypes.ENUM('aberta', 'encerrada'), allowNull: false, defaultValue: 'aberta' },
    step: { type: DataTypes.ENUM(...WORKSHOP_STEPS), allowNull: false, defaultValue: 'entrada' },
    current_process_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    created_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: true },
    closed_at: { type: DataTypes.DATE, allowNull: true },
  },
)

// ---------------------------------------------------------------- workshop_participant
export interface WorkshopParticipantAttrs {
  id: number
  room_id: number
  nickname: string
  token_hash: string
  joined_at?: Date
  removed_at: Date | null
}
export type WorkshopParticipantCreation = Optional<
  WorkshopParticipantAttrs,
  'id' | 'joined_at' | 'removed_at'
>
export const WorkshopParticipant: ModelDefined<WorkshopParticipantAttrs, WorkshopParticipantCreation> =
  sequelize.define('workshop_participant', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    room_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    nickname: { type: DataTypes.STRING(40), allowNull: false },
    token_hash: { type: DataTypes.CHAR(64), allowNull: false },
    joined_at: { type: DataTypes.DATE, allowNull: true },
    removed_at: { type: DataTypes.DATE, allowNull: true },
  })

// ---------------------------------------------------------------- workshop_objective_vote
export interface WorkshopObjectiveVoteAttrs {
  id: number
  room_id: number
  participant_id: number
  objective_id: number
}
export type WorkshopObjectiveVoteCreation = Optional<WorkshopObjectiveVoteAttrs, 'id'>
export const WorkshopObjectiveVote: ModelDefined<
  WorkshopObjectiveVoteAttrs,
  WorkshopObjectiveVoteCreation
> = sequelize.define('workshop_objective_vote', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  room_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  participant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  objective_id: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
})

// ---------------------------------------------------------------- workshop_assessment
export interface WorkshopAssessmentAttrs {
  id: number
  room_id: number
  participant_id: number
  process_id: number
  artifact_ids: number[]
  not_applicable_ids: number[]
  level: number
  finished_at?: Date
}
export type WorkshopAssessmentCreation = Optional<WorkshopAssessmentAttrs, 'id' | 'finished_at'>
export const WorkshopAssessment: ModelDefined<WorkshopAssessmentAttrs, WorkshopAssessmentCreation> =
  sequelize.define('workshop_assessment', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    room_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    participant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    process_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    artifact_ids: { type: DataTypes.JSON, allowNull: false },
    not_applicable_ids: { type: DataTypes.JSON, allowNull: false },
    level: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    finished_at: { type: DataTypes.DATE, allowNull: true },
  })

registerTenancy(WorkshopRoom, 'global')
registerTenancy(WorkshopParticipant, 'global')
registerTenancy(WorkshopObjectiveVote, 'global')
registerTenancy(WorkshopAssessment, 'global')
