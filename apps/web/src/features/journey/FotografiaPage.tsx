import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { journeyApi, type PhotoProcess } from './api'
import { corDaDor } from '../../shared/lib/cores'
import { useAuth } from '../auth/hooks/use-auth'

/** Fotografia v3: MATRIZ dor × estratégia em quadrantes (proposta v3 §5).
 *  Y = dor declarada (5 no topo) · X = relevância estratégica (dos seus
 *  objetivos priorizados). A entrega de valor do gratuito. */
export function FotografiaPage() {
  const { session } = useAuth()
  const pago = Boolean(session?.isStaff || session?.tenant?.planCode != null)
  const { data, isLoading } = useQuery({ queryKey: ['photo'], queryFn: journeyApi.photo })
  const [objetivoSelecionado, setObjetivoSelecionado] = useState<number | null>(null)

  const todos = useMemo(() => (data ? data.groups.flatMap((g) => g.processes) : []), [data])
  const naMatriz = todos.filter((p) => p.score != null)
  const foraDaMatriz = todos.filter((p) => p.score == null)

  if (isLoading || !data) return <p className="carregando">Revelando a fotografia…</p>

  const incompleta = data.answered < data.total

  function ligado(p: PhotoProcess): boolean {
    return objetivoSelecionado == null || p.objectiveIds.includes(objetivoSelecionado)
  }

  return (
    <div className="pilha">
      <div className="cartao cartao-destaque">
        <h1>Fotografia do seu centro</h1>
        <p className="apoio">
          Dor declarada × relevância para os seus objetivos, em {data.answered} de {data.total}{' '}
          processos. Autodeclarada — instrumento de gestão, não certificação.
        </p>
      </div>

      {incompleta && (
        <div className="aviso">
          Fotografia parcial: faltam {data.total - data.answered} processos no{' '}
          <Link to="/termometro">termômetro</Link> para o retrato completo.
        </div>
      )}

      <div className="matriz-wrap">
        {/* ---- Matriz em quadrantes ---- */}
        <div className="matriz">
          <div className="quadrante" style={{ right: 0, top: 0, background: 'rgba(253,231,225,.75)' }}>
            <span className="rotulo-q" style={{ top: 8, right: 10, color: '#b3402a', textAlign: 'right' }}>
              Atacar agora
            </span>
          </div>
          <div className="quadrante" style={{ left: 0, top: 0, background: 'rgba(253,231,225,.4)' }}>
            <span className="rotulo-q" style={{ top: 8, left: 10, color: '#c97b64' }}>
              Dói, fora dos objetivos
            </span>
          </div>
          <div className="quadrante" style={{ right: 0, bottom: 0, background: 'rgba(234,247,252,.6)' }}>
            <span className="rotulo-q" style={{ bottom: 8, right: 10, color: 'var(--azul-600)', textAlign: 'right' }}>
              Estratégico · dor baixa
            </span>
          </div>
          <div className="quadrante" style={{ left: 0, bottom: 0 }}>
            <span className="rotulo-q" style={{ bottom: 8, left: 10, color: 'var(--secundario)' }}>
              Observar
            </span>
          </div>
          <hr className="mediana-h" />
          <hr className="mediana-v" />

          {naMatriz.map((p) => (
            <span
              key={p.processId}
              className={`ponto ${ligado(p) ? '' : 'apagado'}`}
              style={{
                left: `${6 + ((p.relevance ?? 0) / 5) * 88}%`,
                top: `${94 - ((p.score ?? 0) / 5) * 82}%`,
                background: corDaDor(p.score ?? 0),
              }}
              title={`${p.name} — dor ${p.score}/5 · relevância ${p.relevance}/5${
                p.objectiveIds.length
                  ? ` · ligado a ${p.objectiveIds.length} objetivo${p.objectiveIds.length > 1 ? 's' : ''}`
                  : ''
              }`}
            >
              {p.code}
            </span>
          ))}
        </div>

        {/* ---- Painel lateral: seus objetivos ---- */}
        <aside className="cartao painel-objetivos" style={{ padding: 10 }}>
          <h2 style={{ margin: '4px 6px 6px' }}>Seus objetivos</h2>
          {data.objectives.length === 0 && (
            <p className="apoio" style={{ margin: 6 }}>
              <Link to="/objetivos">Priorize objetivos</Link> para ver a dimensão estratégica da
              matriz.
            </p>
          )}
          {data.objectives.map((o) => {
            const selecionado = objetivoSelecionado === o.objectiveId
            return (
              <div
                key={o.objectiveId}
                className={`item-objetivo ${selecionado ? 'selecionado' : ''}`}
                onClick={() => setObjetivoSelecionado(selecionado ? null : o.objectiveId)}
                title="Clique para destacar os processos ligados"
              >
                <b className="mono" style={{ width: 20, flex: 'none' }}>{o.rank}º</b>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>
                    {o.name}
                  </span>
                  <span className="apoio">
                    {o.processIds.length === 1 ? '1 processo' : `${o.processIds.length} processos`}
                    {o.averagePain != null && ` · dor média ${o.averagePain.toFixed(1).replace('.', ',')}`}
                  </span>
                </span>
              </div>
            )
          })}
        </aside>
      </div>

      {foraDaMatriz.length > 0 && (
        <p className="apoio">
          Fora da matriz (sem nota de dor): {foraDaMatriz.map((p) => p.code).join(', ')} —{' '}
          <Link to="/termometro">completar agora</Link>.
        </p>
      )}

      {/* ---- Próximo passo ---- */}
      <div className="proximo-passo">
        <span>
          <span className="eyebrow">Próximo passo</span>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
            Abrir o Raio-X das suas 3 maiores dores e transformá-las em plano
          </span>
        </span>
        <Link to={pago ? '/processos' : '/assinatura'}>
          <button className="avancar">{pago ? 'Abrir Raio-X' : 'Conhecer os planos'} →</button>
        </Link>
      </div>
    </div>
  )
}
