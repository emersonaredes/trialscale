import { useQuery } from '@tanstack/react-query'
import { journeyApi } from './api'
import { paidApi } from '../paid/api'
import { useAuth } from '../auth/hooks/use-auth'

export type EstadoPasso = 'feito' | 'atual' | 'aberto' | 'bloqueado'

export interface Passo {
  n: number
  nome: string
  rota: string
  estado: EstadoPasso
  meta: string
}

/** Estado da jornada sequencial (v3, unificada em 2026-07-24): Objetivos →
 *  Termômetro → Fotografia → Processos → Rodada. Calculado dos mesmos dados
 *  já buscados (cacheados pelo react-query). */
export function useJourneySteps(): { passos: Passo[]; pago: boolean; progresso: number } {
  const { session } = useAuth()
  const pago = Boolean(session?.isStaff || session?.tenant?.planCode != null)

  const { data: meusObjetivos } = useQuery({
    queryKey: ['my-objectives'],
    queryFn: journeyApi.myObjectives,
  })
  const { data: termometro } = useQuery({
    queryKey: ['thermometer'],
    queryFn: journeyApi.thermometer,
  })
  const { data: rodada } = useQuery({
    queryKey: ['round'],
    queryFn: paidApi.currentRound,
    retry: false,
    enabled: pago,
  })

  const objetivosOk = (meusObjetivos?.length ?? 0) > 0
  const termometroOk =
    termometro != null && termometro.total > 0 && termometro.answered === termometro.total

  // Passos 1–3 (gratuitos) em cadeia: primeiro não-feito é o "atual".
  const feitos = [objetivosOk, termometroOk, termometroOk] // fotografia "feita" quando revelável
  const indiceAtual = feitos.findIndex((f) => !f)
  const estadoLivre = (i: number): EstadoPasso =>
    feitos[i] ? 'feito' : i === indiceAtual ? 'atual' : 'aberto'

  const passos: Passo[] = [
    {
      n: 1,
      nome: 'Objetivos',
      rota: '/objetivos',
      estado: estadoLivre(0),
      meta: objetivosOk ? `${meusObjetivos!.length} priorizados` : 'defina até 8',
    },
    {
      n: 2,
      nome: 'Termômetro',
      rota: '/termometro',
      estado: estadoLivre(1),
      meta: termometro ? `${termometro.answered}/${termometro.total} respondidos` : '—',
    },
    {
      n: 3,
      nome: 'Fotografia',
      rota: '/fotografia',
      estado: estadoLivre(2),
      meta: termometroOk ? 'pronta para revelar' : 'parcial',
    },
    {
      // Tela unificada (2026-07-24): a antiga lista Raio-X fundiu-se aqui;
      // o Raio-X de marcação vive no detalhe de cada processo.
      n: 4,
      nome: 'Processos',
      rota: '/processos',
      estado: pago ? 'aberto' : 'bloqueado',
      meta: pago ? 'dor × estratégia × nível' : 'jornada paga',
    },
    {
      n: 5,
      nome: 'Rodada',
      rota: '/rodada',
      estado: pago ? 'aberto' : 'bloqueado',
      meta: !pago
        ? 'jornada paga'
        : rodada?.round
          ? `Rodada ${rodada.round.sequenceNo} ativa`
          : 'monte a sua',
    },
  ]

  const progresso = Math.round((passos.filter((p) => p.estado === 'feito').length / passos.length) * 100)
  return { passos, pago, progresso }
}
