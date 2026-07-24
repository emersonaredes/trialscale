import { z } from 'zod'

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export const registerSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(255).toLowerCase(),
  password: z.string().min(8, 'Senha precisa de ao menos 8 caracteres').max(128),
  tenant: z.object({
    name: z.string().min(2).max(200),
    tipoInstituicao: z.enum(['publica', 'privada', 'terceiro_setor']),
    cidade: z.string().min(2).max(120),
    estado: z.enum(UFS),
    protocolosAtivosFaixa: z.enum(['0_10', '11_30', '31_50', '51_100', '101_200', '200_mais']),
    specialtyIds: z.array(z.number().int().positive()).min(1, 'Selecione ao menos uma especialidade'),
  }),
  consent: z.object({
    version: z.string().min(1),
    accepted: z.literal(true), // consentimento LGPD é obrigatório e versionado
  }),
})
export type RegisterDto = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
})
export type LoginDto = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8).max(128),
})
