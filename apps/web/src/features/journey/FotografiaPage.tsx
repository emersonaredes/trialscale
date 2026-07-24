import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { journeyApi } from './api'

const GRUPO_TITULO: Record<string, string> = {
  central: 'Processos centrais',
  suporte: 'Processos de suporte',
  gestao: 'Processos de gestão',
}

function corDaDor(score: number): string {
  if (score >= 4) return 'var(--coral)'
  if (score === 3) return 'var(--ambar)'
  return 'var(--azul-400)'
}

/** A entrega de valor do gratuito: a fotografia da dor do centro. */
export function FotografiaPage() {
  const { data, isLoading } = useQuery({ queryKey: ['photo'], queryFn: journeyApi.photo })

  if (isLoading || !data) return <p className="carregando">Revelando a fotografia…</p>

  const incompleta = data.answered < data.total

  return (
    <div className="pilha">
      <div className="cartao cartao-destaque">
        <h1>Fotografia do seu centro</h1>
        <p className="apoio">
          A dor declarada pela sua equipe em {data.answered} de {data.total} processos.
          Autodeclarada — é um instrumento de gestão, não uma certificação.
        </p>
        <div className="linha-acoes" style={{ marginTop: 8 }}>
          {data.groups.map((g) => (
            <div key={g.group} style={{ marginRight: 24 }}>
              <span className="apoio">{GRUPO_TITULO[g.group]}</span>
              <div className="display">{g.averagePain?.toFixed(1) ?? '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {incompleta && (
        <div className="aviso">
          Fotografia parcial: faltam {data.total - data.answered} processos no{' '}
          <Link to="/termometro">termômetro</Link> para o retrato completo.
        </div>
      )}

      {data.topPains.length > 0 && (
        <section className="cartao">
          <h2>Suas maiores dores</h2>
          {data.topPains.map((p, i) => (
            <div key={p.processId} className="artefato" style={{ alignItems: 'center' }}>
              <b className="mono" style={{ width: 24 }}>{i + 1}º</b>
              <div className="info">
                <div className="titulo">
                  {p.code && <span className="mono">{p.code}</span>} {p.name}
                </div>
              </div>
              <span
                className="nivel"
                style={{ background: corDaDor(p.score ?? 0), color: '#fff' }}
              >
                dor <b>{p.score}</b>
              </span>
            </div>
          ))}
          <p className="apoio" style={{ marginTop: 10 }}>
            O próximo passo natural: abrir o <Link to="/processos">Raio-X</Link> dos processos que
            mais doem e descobrir exatamente quais artefatos faltam para a dor diminuir.
          </p>
        </section>
      )}

      {data.groups.map((g) => (
        <section key={g.group} className="cartao">
          <h2 style={{ fontSize: 15 }}>
            {GRUPO_TITULO[g.group]} <span className="apoio">({g.answered}/{g.total} respondidos)</span>
          </h2>
          {g.processes.map((p) => (
            <div key={p.processId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
              <span className="mono" style={{ width: 34, flex: 'none' }}>{p.code}</span>
              <span style={{ width: 300, flex: 'none', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>
                {p.published ? <Link to={`/processos/${p.processId}`}>{p.name}</Link> : p.name}
              </span>
              <div className="progresso" style={{ flex: 1 }}>
                {p.score != null && (
                  <span style={{ width: `${(p.score / 5) * 100}%`, background: corDaDor(p.score) }} />
                )}
              </div>
              <b style={{ width: 20, textAlign: 'right', color: p.score != null ? 'var(--ink)' : 'var(--borda)' }}>
                {p.score ?? '—'}
              </b>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
