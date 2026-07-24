import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { paidApi, type PriorityItem } from '../paid/api'
import { LevelBadge } from '../../shared/components/badges'
import { Paywall, isPlanRequired } from '../../shared/components/Paywall'
import { ProximoPasso } from '../../shared/components/ProximoPasso'
import { compareProcessCode } from '../../shared/lib/cores'

/** Tela UNIFICADA "Processos" (decisão 2026-07-24): a antiga lista Raio-X e a
 *  Priorização viraram uma só — score (dor × estratégia) + nível + progresso
 *  de essenciais na mesma linha, com COLUNAS ORDENÁVEIS. O Raio-X de marcação
 *  continua no detalhe de cada processo. */

type Coluna = 'processo' | 'score' | 'pain' | 'relevance' | 'level' | 'essenciais'

const COLUNAS: Array<{ chave: Coluna; titulo: string }> = [
  { chave: 'processo', titulo: 'Processo' },
  { chave: 'score', titulo: 'Score' },
  { chave: 'pain', titulo: 'Dor' },
  { chave: 'relevance', titulo: 'Estratégia' },
  { chave: 'level', titulo: 'Nível' },
  { chave: 'essenciais', titulo: 'Essenciais' },
]

function valorParaOrdenar(item: PriorityItem, coluna: Coluna): number | null {
  switch (coluna) {
    case 'processo':
      return null // tratado à parte (código)
    case 'score':
      return item.score
    case 'pain':
      return item.pain
    case 'relevance':
      return item.relevance
    case 'level':
      return item.level
    case 'essenciais':
      return item.essentialsTotal ? (item.essentialsComplete ?? 0) / item.essentialsTotal : null
  }
}

export function ProcessosPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['priorities'],
    queryFn: paidApi.priorities,
    retry: false,
  })
  const [ordem, setOrdem] = useState<{ coluna: Coluna; desc: boolean }>({ coluna: 'score', desc: true })

  const itens = useMemo(() => {
    const lista = [...(data?.items ?? [])]
    if (ordem.coluna === 'processo') {
      lista.sort((a, b) => compareProcessCode(a.code, b.code) * (ordem.desc ? -1 : 1))
      return lista
    }
    lista.sort((a, b) => {
      const va = valorParaOrdenar(a, ordem.coluna)
      const vb = valorParaOrdenar(b, ordem.coluna)
      if (va == null && vb == null) return compareProcessCode(a.code, b.code)
      if (va == null) return 1 // nulls sempre por último
      if (vb == null) return -1
      return (vb - va) * (ordem.desc ? 1 : -1) || compareProcessCode(a.code, b.code)
    })
    return lista
  }, [data, ordem])

  if (isPlanRequired(error)) return <Paywall />
  if (isLoading || !data) return <p className="carregando">Cruzando dor, estratégia e maturidade…</p>

  function clicarColuna(coluna: Coluna) {
    setOrdem((atual) =>
      atual.coluna === coluna ? { coluna, desc: !atual.desc } : { coluna, desc: coluna !== 'processo' },
    )
  }

  return (
    <div className="pilha">
      <div className="cabecalho-pagina">
        <div>
          <h1>Processos</h1>
          <p className="apoio">
            Score = 60% dor declarada + 40% relevância para os seus objetivos. As linhas âmbar são
            o <b>risco silencioso</b> (dói pouco, maturidade baixa). Clique nas colunas para
            reordenar; clique no processo para abrir o Raio-X de artefatos.
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
              {COLUNAS.map((c) => (
                <th
                  key={c.chave}
                  className="ordenavel"
                  onClick={() => clicarColuna(c.chave)}
                  title="Clique para ordenar"
                >
                  {c.titulo}
                  {ordem.coluna === c.chave && <span className="seta">{ordem.desc ? ' ▼' : ' ▲'}</span>}
                </th>
              ))}
              <th>Sinais</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.processId} className={item.silentRisk ? 'risco-silencioso' : ''}>
                <td>
                  {item.published ? (
                    <Link to={`/processos/${item.processId}`}>
                      <span className="mono">{item.code}</span> <b>{item.name}</b>
                    </Link>
                  ) : (
                    <>
                      <span className="mono">{item.code}</span> {item.name}
                    </>
                  )}
                </td>
                <td>
                  <b style={{ color: 'var(--ink)' }}>{item.score}</b>
                </td>
                <td>{item.pain ?? <span className="apoio">—</span>}</td>
                <td>{item.relevance}</td>
                <td>
                  {item.level != null ? <LevelBadge level={item.level} /> : <span className="apoio">—</span>}
                </td>
                <td>
                  {item.essentialsTotal != null ? (
                    <>
                      <div className="apoio">
                        {item.essentialsComplete}/{item.essentialsTotal}
                        {item.level != null && item.level < 5 && item.nextLevelMissing != null && (
                          <> · faltam {item.nextLevelMissing}</>
                        )}
                      </div>
                      <div
                        className={`progresso ${
                          item.essentialsTotal > 0 &&
                          (item.essentialsComplete ?? 0) / item.essentialsTotal >= 0.8
                            ? 'quase'
                            : ''
                        }`}
                        style={{ width: 100 }}
                      >
                        <span
                          style={{
                            width: `${item.essentialsTotal ? Math.round((100 * (item.essentialsComplete ?? 0)) / item.essentialsTotal) : 0}%`,
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <span className="apoio">—</span>
                  )}
                </td>
                <td>
                  <span className="linha-acoes" style={{ gap: 4 }}>
                    {item.silentRisk && <span className="tag-risco">risco silencioso</span>}
                    {item.suggested && <span className="tag-compartilhado">sugerido p/ rodada</span>}
                    {!item.published && <span className="apoio">trilha em breve</span>}
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
