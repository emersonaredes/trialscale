import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { journeyApi } from './api'

const GRUPO_TITULO: Record<string, string> = {
  central: 'Processos centrais — do estudo entrar ao estudo encerrar',
  suporte: 'Processos de suporte — o que sustenta a operação',
  gestao: 'Processos de gestão — o rumo do centro',
}

const ROTULO_NOTA: Record<number, string> = {
  1: 'Não incomoda',
  2: 'Incomoda pouco',
  3: 'Incomoda',
  4: 'Incomoda muito',
  5: 'Dói todo dia',
}

/** Termômetro de dor: uma nota 1–5 por processo. Salva a cada clique
 *  (retomar é natural). NÃO se pergunta maturidade — ela virá do Raio-X. */
export function TermometroPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['thermometer'], queryFn: journeyApi.thermometer })

  const marcar = useMutation({
    mutationFn: ({ processId, score }: { processId: number; score: number }) =>
      journeyApi.scorePain(processId, score),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['thermometer'] })
      void queryClient.invalidateQueries({ queryKey: ['photo'] })
    },
  })

  if (isLoading || !data) return <p className="carregando">Preparando o termômetro…</p>

  const grupos = ['central', 'suporte', 'gestao']
  const completo = data.answered === data.total

  return (
    <div className="pilha">
      <div className="cabecalho-pagina">
        <div>
          <h1>Termômetro de dor</h1>
          <p className="apoio">
            Para cada processo: <b>quanto isso incomoda o seu centro hoje?</b> Não é sobre ter ou
            não ter o processo — é sobre a dor que ele causa.
          </p>
        </div>
        <div style={{ textAlign: 'right', minWidth: 180 }}>
          <span className="apoio">{data.answered} de {data.total} respondidos</span>
          <div className={`progresso ${data.answered / data.total >= 0.8 ? 'quase' : ''}`}>
            <span style={{ width: `${Math.round((100 * data.answered) / data.total)}%` }} />
          </div>
          {completo && (
            <Link to="/fotografia">
              <button className="completar pequeno" style={{ marginTop: 8 }}>
                Ver minha fotografia 🎉
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className="aviso">
        💡 <b>Recomendação:</b> responda em equipe, num workshop com todas as áreas — a dor da
        farmácia é invisível para quem cuida de recrutamento. Você pode parar e retomar quando
        quiser: cada resposta é salva na hora.
      </div>

      {grupos.map((grupo) => {
        const processos = data.processes.filter((p) => p.processGroup === grupo)
        if (processos.length === 0) return null
        return (
          <section key={grupo} className="cartao">
            <h2 style={{ fontSize: 15 }}>{GRUPO_TITULO[grupo]}</h2>
            {processos.map((p) => (
              <div key={p.processId} className="artefato" style={{ alignItems: 'center' }}>
                <div className="info">
                  <div className="titulo">
                    {p.code && <span className="mono">{p.code}</span>} {p.name}
                  </div>
                  {p.oneLineDescription && <p className="dod">{p.oneLineDescription}</p>}
                </div>
                <div className="linha-acoes" style={{ gap: 4, flexWrap: 'nowrap' }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      className={p.score === n ? 'pequeno' : 'secundario pequeno'}
                      style={
                        p.score === n
                          ? { background: n >= 4 ? 'var(--coral)' : n === 3 ? 'var(--ambar)' : 'var(--azul-500)' }
                          : { minWidth: 34 }
                      }
                      title={ROTULO_NOTA[n]}
                      onClick={() => marcar.mutate({ processId: p.processId, score: n })}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )
      })}

      <div className="linha-acoes">
        <Link to="/fotografia">
          <button className="secundario">Ver fotografia parcial</button>
        </Link>
      </div>
    </div>
  )
}
