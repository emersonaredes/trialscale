import { z } from 'zod'
import { WORKSHOP_STEPS } from '../types/domain'

const id = z.number().int().positive()

export const createRoomSchema = z.object({ name: z.string().trim().min(3).max(120) })
export const setStepSchema = z.object({
  step: z.enum(WORKSHOP_STEPS),
})
export const setProcessSchema = z.object({ processId: id })
export const saveVotesSchema = z.object({ objectiveIds: z.array(id).max(3) })
export const saveWorkshopAssessmentSchema = z.object({
  artifactIds: z.array(id).max(200),
  notApplicableIds: z.array(id).max(200).default([]),
})
