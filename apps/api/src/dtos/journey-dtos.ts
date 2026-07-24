import { z } from 'zod'

export const saveObjectivesSchema = z.object({
  objectiveIds: z.array(z.number().int().positive()).max(40),
})

export const scorePainSchema = z.object({
  score: z.number().int().min(1, 'nota de 1 a 5').max(5, 'nota de 1 a 5'),
})
