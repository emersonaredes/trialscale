export interface Session {
  accessToken: string
  user: { id: number; name: string; email: string }
  tenant: { id: number; name: string; planCode: string | null } | null
  role: 'administrador' | 'coordenador' | 'membro' | null
  isStaff: boolean
}

export interface Specialty {
  id: number
  code: string
  name: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  tenant: {
    name: string
    tipoInstituicao: 'publica' | 'privada' | 'terceiro_setor'
    cidade: string
    estado: string
    protocolosAtivosFaixa: '0_10' | '11_30' | '31_50' | '51_100' | '101_200' | '200_mais'
    specialtyIds: number[]
  }
  consent: { version: string; accepted: true }
}

export const FAIXAS: Array<{ valor: RegisterPayload['tenant']['protocolosAtivosFaixa']; rotulo: string }> = [
  { valor: '0_10', rotulo: '0 a 10' },
  { valor: '11_30', rotulo: '11 a 30' },
  { valor: '31_50', rotulo: '31 a 50' },
  { valor: '51_100', rotulo: '51 a 100' },
  { valor: '101_200', rotulo: '101 a 200' },
  { valor: '200_mais', rotulo: 'Mais de 200' },
]

export const TIPOS_INSTITUICAO = [
  { valor: 'publica', rotulo: 'Pública' },
  { valor: 'privada', rotulo: 'Privada' },
  { valor: 'terceiro_setor', rotulo: 'Terceiro setor' },
] as const

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]
