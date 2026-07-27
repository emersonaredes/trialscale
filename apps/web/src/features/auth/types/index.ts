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

export type OrgType = 'cpc' | 'orpc'
export type ModeloServico = 'full_service' | 'servicos_funcionais' | 'aro' | 'outro'
export type OrpcFaixa = '0_5' | '6_15' | '16_40' | '41_100' | '100_mais'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  tenant: {
    name: string
    orgType: OrgType
    cidade: string
    estado: string
    specialtyIds: number[]
    // Perfil CPC
    tipoInstituicao?: 'publica' | 'privada' | 'terceiro_setor'
    protocolosAtivosFaixa?: '0_10' | '11_30' | '31_50' | '51_100' | '101_200' | '200_mais'
    // Perfil ORPC
    modeloServico?: ModeloServico
    assumeAtribuicoesAnvisa?: boolean
    assumeFarmacovigilancia?: boolean
    perfilFomento?: boolean
    prestaMonitoria?: boolean
    selecionaCentros?: boolean
    prestaGestaoDados?: boolean
    ativaCentros?: boolean
    centrosGeridosFaixa?: OrpcFaixa
    estudosAtivosFaixa?: OrpcFaixa
  }
  consent: { version: string; accepted: true }
}

export const MODELOS_SERVICO: Array<{ valor: ModeloServico; rotulo: string }> = [
  { valor: 'full_service', rotulo: 'Full service (do regulatório ao encerramento)' },
  { valor: 'servicos_funcionais', rotulo: 'Serviços funcionais (monitoria, dados, regulatório…)' },
  { valor: 'aro', rotulo: 'ARO (organização acadêmica de pesquisa)' },
  { valor: 'outro', rotulo: 'Outro modelo' },
]

export const ORPC_FAIXAS: Array<{ valor: OrpcFaixa; rotulo: string }> = [
  { valor: '0_5', rotulo: '0 a 5' },
  { valor: '6_15', rotulo: '6 a 15' },
  { valor: '16_40', rotulo: '16 a 40' },
  { valor: '41_100', rotulo: '41 a 100' },
  { valor: '100_mais', rotulo: 'Mais de 100' },
]

export const SERVICOS_ORPC: Array<{ campo: keyof RegisterPayload['tenant']; rotulo: string }> = [
  { campo: 'prestaMonitoria', rotulo: 'Monitoria de estudos' },
  { campo: 'selecionaCentros', rotulo: 'Seleção e qualificação de centros' },
  { campo: 'ativaCentros', rotulo: 'Start-up / ativação de centros' },
  { campo: 'prestaGestaoDados', rotulo: 'Gestão de dados' },
  { campo: 'assumeAtribuicoesAnvisa', rotulo: 'Atribuições regulatórias perante a Anvisa' },
  { campo: 'assumeFarmacovigilancia', rotulo: 'Farmacovigilância / segurança delegada' },
  { campo: 'perfilFomento', rotulo: 'Captação via fomento / editais' },
]

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
