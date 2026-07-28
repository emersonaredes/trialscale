import { z } from 'zod'

export const subscribeSchema = z.object({
  planCode: z.string().min(1).max(40),
})

export const createRoundSchema = z.object({
  processIds: z.array(z.number().int().positive()).min(3, 'a rodada tem 3 ou 4 processos').max(4),
  challengeWeeks: z.number().int().min(1).max(52).nullable().optional(),
  startedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'data no formato AAAA-MM-DD')
    .nullable()
    .optional(),
})

export const assigneesSchema = z.object({
  userIds: z.array(z.number().int().positive()).max(20),
})

export const createCustomArtifactSchema = z.object({
  processId: z.number().int().positive(),
  title: z.string().min(3).max(255),
  dodText: z.string().min(5).max(3000),
  level: z.number().int().min(2).max(5),
})

export const setWeightSchema = z.object({
  objectiveId: z.number().int().positive(),
  processId: z.number().int().positive(),
  weight: z.number().int().min(0, 'peso de 0 (remover) a 3').max(3, 'peso de 0 (remover) a 3'),
})
