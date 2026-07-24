import { z } from 'zod'

/** Máximo de 8 prioridades (decisão do usuário 2026-07-24): foco > exaustividade. */
export const MAX_OBJETIVOS = 8

export const saveObjectivesSchema = z.object({
  objectiveIds: z
    .array(z.number().int().positive())
    .max(MAX_OBJETIVOS, `escolha no máximo ${MAX_OBJETIVOS} objetivos`),
})

export const scorePainSchema = z.object({
  score: z.number().int().min(1, 'nota de 1 a 5').max(5, 'nota de 1 a 5'),
})
