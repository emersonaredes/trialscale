import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { paidApi } from './api'
import { LevelBadge } from '../../shared/components/badges'
import { Paywall, isPlanRequired } from '../../shared/components/Paywall'
import { ProximoPasso } from '../../shared/components/ProximoPasso'

/** Priorização: dor (60%) × relevância estratégica (40%) + dependências como
 *  sinalização. Nunca trava a escolha — sugere. */
export function PriorizacaoPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['priorities'],
    queryFn: paidApi.priorities,
    retry: false,
  })

  if (isPlanRequired(error)) return <Paywall />
  if (isLoading || !data) return <p className="carregando">Cruzando dor, estratégia e dependências…</p>

  return (
    <div className="pilha">
      <div className="cabecalho-pagina">
        <div>
          <h1>Priorização</h1>
          <p className="apoio">
            Dor declarada (60%) + relevância para os seus objetivos (40%). As linhas âmbar são o{' '}
            <b>risco silencioso</b>: dói pouco, mas a maturidade é baixa — o que você não vê
            chegando.
          </p>
        </div>
        <Link to="/rodada">
          <button>Montar rodada com a sugestão</button>
        </Link>
      </div>

      {!data.hasObjectives && (
        <div className="aviso">
          Você ainda não priorizou <Link to="/objetivos">objetivos estratégicos</Link> — sem eles,
          o score usa só a dor.
        </div>
      )}
      {data.answeredPain === 0 && (
        <div className="aviso">
          Responda o <Link to="/termometro">termômetro</Link> para o score refletir a sua dor.
        </div>
      )}

      <div className="cartao" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Processo</th>
              <th>Score</th>
              <th>Dor</th>
              <th>Estratégia</th>
              <th>Nível</th>
              <th>Sinais</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={item.processId} className={item.silentRisk ? 'risco-silencioso' : ''}>
                <td className="mono">{i + 1}</td>
                <td>
                  {item.published ? (
                    <Link to={`/processos/${item.processId}`}>
                      <span className="mono">{item.code}</span> <b>{item.name}</b>
                    </Link>
                  ) : (
                    <>
                      <span className="mono">{item.code}</span> {item.name}{' '}
                      <span className="apoio">(trilha em breve)</span>
                    </>
                  )}
                </td>
                <td>
                  <b style={{ color: 'var(--ink)' }}>{item.score}</b>
                </td>
                <td>{item.pain ?? <span className="apoio">—</span>}</td>
                <td>{item.relevance}</td>
                <td>{item.level != null ? <LevelBadge level={item.level} /> : <span className="apoio">—</span>}</td>
                <td>
                  <span className="linha-acoes" style={{ gap: 4 }}>
                    {item.silentRisk && <span className="tag-risco">risco silencioso</span>}
                    {item.suggested && <span className="tag-compartilhado">sugerido p/ rodada</span>}
                    {item.unlocks > 0 && (
                      <span className="apoio" title="Dependências da arquitetura (ordem recomendada, nunca trava)">
                        destrava {item.unlocks}
                      </span>
                    )}
                    {!item.applies && <span className="apoio">não se aplica</span>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProximoPasso
        titulo="Transforme os processos sugeridos numa rodada de 3–4 com foco e prazo"
        cta="Montar rodada com a sugestão"
        rota="/rodada"
      />
    </div>
  )
}
