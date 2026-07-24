import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/hooks/use-auth'
import { journeyApi } from '../journey/api'
import { useJourneySteps } from '../journey/use-journey-steps'
import { paidApi } from '../paid/api'
import { apiFetch } from '../../shared/lib/api-client'
import { corDaDor } from '../../shared/lib/cores'

interface AchievementStatus {
  code: string
  name: string
  earnedAt: string | null
}

/** Home v3 = COCKPIT: um único próximo passo calculado do estado real. */
export function HomePage() {
  const { session } = useAuth()
  const { passos, pago } = useJourneySteps()

  const { data: termometro } = useQuery({ queryKey: ['thermometer'], queryFn: journeyApi.thermometer })
  const { data: foto } = useQuery({ queryKey: ['photo'], queryFn: journeyApi.photo })
  const { data: rodada } = useQuery({
    queryKey: ['round'],
    queryFn: paidApi.currentRound,
    retry: false,
    enabled: pago,
  })
  const { data: conquistas } = useQuery({
    queryKey: ['achievements'],
    queryFn: () =>
      apiFetch<{ achievements: AchievementStatus[]; newlyEarned: string[] }>('/api/achievements'),
    retry: false,
    enabled: pago,
  })

  // Cadeia de decisão do PRÓXIMO PASSO (proposta v3 §3a)
  const objetivosOk = passos[0]?.estado === 'feito'
  const termometroOk = passos[1]?.estado === 'feito'
  const faltam = termometro ? termometro.total - termometro.answered : null
  const proximo = (() => {
    if (pago && rodada?.round) {
      return {
        eyebrow: `Rodada ${rodada.round.sequenceNo} em andamento`,
        titulo: 'Continue a sua rodada — cada artefato completo é um degrau.',
        cta: `Continuar a Rodada ${rodada.round.sequenceNo}`,
        rota: '/rodada',
      }
    }
    if (!objetivosOk) {
      return {
        eyebrow: 'Comece por aqui',
        titulo: 'Aonde o seu centro quer chegar? Priorize até 8 objetivos.',
        cta: 'Definir objetivos',
        rota: '/objetivos',
      }
    }
    if (!termometroOk) {
      return {
        eyebrow: 'Seu próximo passo',
        titulo: `Termine o termômetro — ${faltam != null ? `faltam ${faltam} processos` : 'quase lá'}.`,
        cta: 'Continuar o termômetro',
        rota: '/termometro',
      }
    }
    if (!pago) {
      return {
        eyebrow: 'Fotografia pronta',
        titulo: 'Sua dor está mapeada. O plano abre o Raio-X e as rodadas de melhoria.',
        cta: 'Conhecer os planos',
        rota: '/assinatura',
      }
    }
    return {
      eyebrow: 'Fotografia revelada',
      titulo: 'Abra o Raio-X das suas maiores dores e monte a primeira rodada.',
      cta: 'Abrir o Raio-X',
      rota: '/processos',
    }
  })()

  const conquistasRecentes = (conquistas?.achievements ?? [])
    .filter((a) => a.earnedAt != null)
    .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())
    .slice(0, 4)

  return (
    <div className="pilha">
      {/* a) Hero do próximo passo */}
      <section className="hero-passo">
        <span className="eyebrow">{proximo.eyebrow}</span>
        <h1>{proximo.titulo}</h1>
        <Link to={proximo.rota}>
          <button className="avancar">{proximo.cta} →</button>
        </Link>
        <p className="apoio" style={{ margin: '10px 0 0', color: 'var(--azul-200)' }}>
          {session?.tenant?.name ?? 'Equipe TrialScale'} · jornada autodeclarada de maturidade
        </p>
      </section>

      {/* b) Mapa horizontal da jornada */}
      <section className="cartao">
        <div className="mapa-jornada">
          {passos.map((p, i) => (
            <>
              {i > 0 && <span key={`t${p.n}`} className={`tramo ${passos[i - 1]!.estado === 'feito' ? 'feito' : ''}`} />}
              <Link key={p.rota} to={p.rota} className={`no ${p.estado}`}>
                <span className="bola">{p.estado === 'feito' ? '✓' : p.n}</span>
                <span className="rotulo">{p.nome}</span>
              </Link>
            </>
          ))}
        </div>
      </section>

      {/* c) Grid: dores + conquistas recentes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, alignItems: 'start' }}>
        <section className="cartao">
          <h2>Onde mais dói hoje</h2>
          {(foto?.topPains ?? []).slice(0, 3).map((p) => (
            <div key={p.processId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <span className="mono" style={{ width: 30 }}>{p.code}</span>
              <span style={{ flex: 1, fontSize: 12.5, color: 'var(--ink)', fontWeight: 600 }}>{p.name}</span>
              <div className="progresso" style={{ width: 110 }}>
                <span style={{ width: `${((p.score ?? 0) / 5) * 100}%`, background: corDaDor(p.score ?? 0) }} />
              </div>
              <b style={{ width: 14, textAlign: 'right' }}>{p.score}</b>
            </div>
          ))}
          {(foto?.topPains ?? []).length === 0 && (
            <p className="apoio">
              Responda o <Link to="/termometro">termômetro</Link> para revelar as suas dores.
            </p>
          )}
        </section>

        <section className="cartao">
          <h2>Conquistas recentes</h2>
          {pago ? (
            conquistasRecentes.length > 0 ? (
              conquistasRecentes.map((a) => (
                <div key={a.code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--verde-500)', flex: 'none' }} />
                  <span style={{ flex: 1, fontSize: 12.5, color: 'var(--ink)', fontWeight: 600 }}>{a.name}</span>
                  <span className="apoio">{new Date(a.earnedAt!).toLocaleDateString('pt-BR')}</span>
                </div>
              ))
            ) : (
              <p className="apoio">
                Suas vitórias vão aparecer aqui — comece pela <Link to="/rodada">rodada</Link>.
              </p>
            )
          ) : (
            <p className="apoio">
              Conquistas fazem parte da jornada paga. <Link to="/assinatura">Conheça os planos</Link>.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
