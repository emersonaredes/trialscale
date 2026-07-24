import { z } from 'zod'

export const createProcessSchema = z.object({
  code: z.string().max(20).nullable(),
  name: z.string().min(2).max(200),
  processGroup: z.enum(['central', 'suporte', 'gestao']),
  oneLineDescription: z.string().max(2000).nullable().optional(),
  objectiveText: z.string().max(5000).nullable().optional(),
})

export const updateProcessSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  oneLineDescription: z.string().max(2000).nullable().optional(),
  objectiveText: z.string().max(5000).nullable().optional(),
})

const placementSchema = z.object({
  processId: z.number().int().positive(),
  level: z.number().int().min(2).max(5),
  classification: z.enum(['essencial', 'complementar']),
})

export const saveDraftSchema = z.object({
  levels: z
    .array(
      z.object({
        number: z.number().int().min(1).max(5),
        description: z.string().max(3000).nullable(),
      }),
    )
    .max(5),
  artifacts: z
    .array(
      z.object({
        logicalKey: z.string().max(80).optional(),
        typeCode: z.string().min(1),
        title: z.string().min(3).max(255),
        dodText: z.string().min(5),
        seals: z.array(z.enum(['T', 'G', 'A', 'P', 'D'])).max(5),
        conditionCode: z.string().nullable().optional(),
        ownLevel: z.number().int().min(2).max(5),
        ownClassification: z.enum(['essencial', 'complementar']),
        extraPlacements: z.array(placementSchema).max(10).optional(),
      }),
    )
    .max(100),
})

export const markAssessmentSchema = z.object({
  state: z.enum(['nao_iniciado', 'em_elaboracao', 'completo']),
  expectedDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'data no formato AAAA-MM-DD')
    .nullable()
    .optional(),
})

export const applicabilitySchema = z.object({
  applies: z.boolean(),
  justification: z.string().max(500).nullable().optional(),
})
