import { z } from 'zod'

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

const ORPC_FAIXAS = ['0_5', '6_15', '16_40', '41_100', '100_mais'] as const

export const registerSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(255).toLowerCase(),
  password: z.string().min(8, 'Senha precisa de ao menos 8 caracteres').max(128),
  tenant: z
    .object({
      name: z.string().min(2).max(200),
      // PT-0067: tipo de organização — imutável após o cadastro
      orgType: z.enum(['cpc', 'orpc']).default('cpc'),
      cidade: z.string().min(2).max(120),
      estado: z.enum(UFS),
      specialtyIds: z.array(z.number().int().positive()).min(1, 'Selecione ao menos uma área'),
      // Perfil CPC (obrigatório quando orgType=cpc)
      tipoInstituicao: z.enum(['publica', 'privada', 'terceiro_setor']).optional(),
      protocolosAtivosFaixa: z.enum(['0_10', '11_30', '31_50', '51_100', '101_200', '200_mais']).optional(),
      // Perfil ORPC (modeloServico obrigatório quando orgType=orpc)
      modeloServico: z.enum(['full_service', 'servicos_funcionais', 'aro', 'outro']).optional(),
      assumeAtribuicoesAnvisa: z.boolean().optional(),
      assumeFarmacovigilancia: z.boolean().optional(),
      perfilFomento: z.boolean().optional(),
      prestaMonitoria: z.boolean().optional(),
      selecionaCentros: z.boolean().optional(),
      prestaGestaoDados: z.boolean().optional(),
      ativaCentros: z.boolean().optional(),
      centrosGeridosFaixa: z.enum(ORPC_FAIXAS).optional(),
      estudosAtivosFaixa: z.enum(ORPC_FAIXAS).optional(),
    })
    .superRefine((t, ctx) => {
      if (t.orgType === 'cpc') {
        if (!t.tipoInstituicao)
          ctx.addIssue({ code: 'custom', path: ['tipoInstituicao'], message: 'obrigatório para centros' })
        if (!t.protocolosAtivosFaixa)
          ctx.addIssue({ code: 'custom', path: ['protocolosAtivosFaixa'], message: 'obrigatório para centros' })
      } else if (!t.modeloServico) {
        ctx.addIssue({ code: 'custom', path: ['modeloServico'], message: 'obrigatório para ORPCs' })
      }
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
