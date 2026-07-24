import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { journeyApi } from './api'
import { useAuth } from '../auth/hooks/use-auth'

/** Fase 1 (leve): o coração é a lista de objetivos PRIORIZADOS — a ordem
 *  importa (alimenta a ponderação da priorização na Fase 2). */
export function ObjetivosPage() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const { data: menu } = useQuery({ queryKey: ['objectives'], queryFn: journeyApi.objectives })
  const { data: meus } = useQuery({ queryKey: ['my-objectives'], queryFn: journeyApi.myObjectives })

  const [selecionados, setSelecionados] = useState<number[]>([])
  const [salvo, setSalvo] = useState<string | null>(null)
  const podeEditar = session?.role === 'administrador' || session?.role === 'coordenador'

  useEffect(() => {
    // Hidrata a seleção local a partir do servidor (uma vez por carga).
    if (meus) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelecionados(meus.map((m) => m.objectiveId))
    }
  }, [meus])

  const nomePorId = new Map(
    (menu ?? []).flatMap((t) => t.objectives.map((o) => [o.id, { name: o.name, theme: t.theme }])),
  )

  function alternar(id: number) {
    setSalvo(null)
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    )
  }

  function mover(indice: number, delta: number) {
    setSalvo(null)
    setSelecionados((atual) => {
      const novo = [...atual]
      const alvo = indice + delta
      if (alvo < 0 || alvo >= novo.length) return atual
      ;[novo[indice], novo[alvo]] = [novo[alvo]!, novo[indice]!]
      return novo
    })
  }

  async function salvar() {
    await journeyApi.saveMyObjectives(selecionados)
    setSalvo('Prioridades salvas! Elas vão guiar a sua jornada. 🎉')
    void queryClient.invalidateQueries({ queryKey: ['my-objectives'] })
  }

  return (
    <div className="pilha">
      <div>
        <h1>Objetivos estratégicos</h1>
        <p className="apoio">
          Aonde o seu centro quer chegar? Escolha os objetivos que fazem sentido para a sua
          realidade e ordene por importância — os mais importantes primeiro. Isso vai guiar a
          priorização dos seus processos.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="pilha" style={{ gap: 12 }}>
          {(menu ?? []).map((tema) => (
            <section key={tema.theme} className="cartao" style={{ padding: 16 }}>
              <h2 style={{ fontSize: 15 }}>{tema.theme}</h2>
              {tema.objectives.map((o) => (
                <label key={o.id} className="checkbox" style={{ padding: '3px 0' }}>
                  <input
                    type="checkbox"
                    checked={selecionados.includes(o.id)}
                    onChange={() => alternar(o.id)}
                    disabled={!podeEditar}
                  />
                  {o.name}
                </label>
              ))}
            </section>
          ))}
        </div>

        <section className="cartao" style={{ position: 'sticky', top: 16 }}>
          <h2>Suas prioridades ({selecionados.length})</h2>
          {selecionados.length === 0 && (
            <p className="apoio">Escolha objetivos no menu ao lado — a ordem aqui é a prioridade.</p>
          )}
          {selecionados.map((id, i) => (
            <div key={id} className="artefato" style={{ alignItems: 'center' }}>
              <b className="mono" style={{ width: 24 }}>{i + 1}º</b>
              <div className="info">
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
                  {nomePorId.get(id)?.name}
                </div>
                <div className="apoio">{nomePorId.get(id)?.theme}</div>
              </div>
              {podeEditar && (
                <span className="linha-acoes" style={{ gap: 2 }}>
                  <button className="ghost pequeno" onClick={() => mover(i, -1)} disabled={i === 0}>↑</button>
                  <button className="ghost pequeno" onClick={() => mover(i, 1)} disabled={i === selecionados.length - 1}>↓</button>
                  <button className="ghost pequeno" onClick={() => alternar(id)}>×</button>
                </span>
              )}
            </div>
          ))}
          {podeEditar && (
            <div style={{ marginTop: 14 }}>
              <button onClick={() => void salvar()} disabled={selecionados.length === 0}>
                Salvar prioridades
              </button>
              {salvo && <p className="apoio" style={{ color: 'var(--verde-700)' }}>{salvo}</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
