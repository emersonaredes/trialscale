import { z } from 'zod'

export const subscribeSchema = z.object({
  planCode: z.string().min(1).max(40),
})

export const createRoundSchema = z.object({
  processIds: z.array(z.number().int().positive()).min(3, 'a rodada tem 3 ou 4 processos').max(4),
  challengeWeeks: z.number().int().min(1).max(52).nullable().optional(),
})
