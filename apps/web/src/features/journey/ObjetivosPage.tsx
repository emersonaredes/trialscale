import { useEffect, useState, type DragEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { journeyApi } from './api'
import { ProximoPasso } from '../../shared/components/ProximoPasso'
import { useAuth } from '../auth/hooks/use-auth'

/** Fase 1 (leve): o coração é a lista de objetivos PRIORIZADOS — a ordem
 *  importa (alimenta a ponderação da priorização na Fase 2).
 *  Máximo de 8 (foco); reordenação por DRAG AND DROP nativo. */
const MAX_OBJETIVOS = 8

export function ObjetivosPage() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const { data: menu } = useQuery({ queryKey: ['objectives'], queryFn: journeyApi.objectives })
  const { data: meus } = useQuery({ queryKey: ['my-objectives'], queryFn: journeyApi.myObjectives })

  const [selecionados, setSelecionados] = useState<number[]>([])
  const [arrastando, setArrastando] = useState<number | null>(null) // índice sendo arrastado
  const [sobre, setSobre] = useState<number | null>(null) // índice sob o cursor
  const [salvo, setSalvo] = useState<string | null>(null)
  const podeEditar = session?.role === 'administrador' || session?.role === 'coordenador'
  const atingiuLimite = selecionados.length >= MAX_OBJETIVOS

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
    setSelecionados((atual) => {
      if (atual.includes(id)) return atual.filter((x) => x !== id)
      if (atual.length >= MAX_OBJETIVOS) return atual // limite: não adiciona
      return [...atual, id]
    })
  }

  // ---- drag and drop nativo (lista pequena — sem lib) ----
  function aoIniciarArrasto(e: DragEvent, indice: number) {
    setArrastando(indice)
    e.dataTransfer.effectAllowed = 'move'
  }

  function aoPassarSobre(e: DragEvent, indice: number) {
    e.preventDefault() // necessário para permitir o drop
    e.dataTransfer.dropEffect = 'move'
    if (indice !== sobre) setSobre(indice)
  }

  function aoSoltar(indice: number) {
    if (arrastando === null || arrastando === indice) {
      limparArrasto()
      return
    }
    setSalvo(null)
    setSelecionados((atual) => {
      const novo = [...atual]
      const [movido] = novo.splice(arrastando, 1)
      novo.splice(indice, 0, movido!)
      return novo
    })
    limparArrasto()
  }

  function limparArrasto() {
    setArrastando(null)
    setSobre(null)
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
          Aonde o seu centro quer chegar? Escolha até {MAX_OBJETIVOS} objetivos que fazem sentido
          para a sua realidade e <b>arraste para ordenar</b> — os mais importantes primeiro. Isso
          vai guiar a priorização dos seus processos.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="pilha" style={{ gap: 12 }}>
          {(menu ?? []).map((tema) => (
            <section key={tema.theme} className="cartao" style={{ padding: 16 }}>
              <h2 style={{ fontSize: 15 }}>{tema.theme}</h2>
              {tema.objectives.map((o) => {
                const marcado = selecionados.includes(o.id)
                const bloqueado = !podeEditar || (!marcado && atingiuLimite)
                return (
                  <label
                    key={o.id}
                    className="checkbox"
                    style={{ padding: '3px 0', opacity: bloqueado && !marcado ? 0.45 : 1 }}
                    title={!marcado && atingiuLimite ? `Máximo de ${MAX_OBJETIVOS} objetivos — remova um para trocar` : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => alternar(o.id)}
                      disabled={bloqueado}
                    />
                    {o.name}
                  </label>
                )
              })}
            </section>
          ))}
        </div>

        <section className="cartao" style={{ position: 'sticky', top: 16 }}>
          <h2>
            Suas prioridades{' '}
            <span className="apoio" style={{ fontWeight: 400 }}>
              ({selecionados.length}/{MAX_OBJETIVOS})
            </span>
          </h2>
          {atingiuLimite && (
            <p className="hint">
              Limite de {MAX_OBJETIVOS} atingido — foco é parte do método. Remova um para trocar.
            </p>
          )}
          {selecionados.length === 0 && (
            <p className="apoio">Escolha objetivos no menu ao lado — arraste para priorizar.</p>
          )}
          {selecionados.map((id, i) => (
            <div
              key={id}
              className={`artefato prioridade ${arrastando === i ? 'arrastando' : ''} ${sobre === i && arrastando !== null && arrastando !== i ? 'alvo-drop' : ''}`}
              style={{ alignItems: 'center' }}
              draggable={podeEditar}
              onDragStart={(e) => aoIniciarArrasto(e, i)}
              onDragOver={(e) => aoPassarSobre(e, i)}
              onDrop={() => aoSoltar(i)}
              onDragEnd={limparArrasto}
            >
              {podeEditar && <span className="alca-arrasto" title="Arraste para reordenar">⠿</span>}
              <b className="mono" style={{ width: 24 }}>{i + 1}º</b>
              <div className="info">
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
                  {nomePorId.get(id)?.name}
                </div>
                <div className="apoio">{nomePorId.get(id)?.theme}</div>
              </div>
              {podeEditar && (
                <button className="ghost pequeno" onClick={() => alternar(id)} title="Remover">
                  ×
                </button>
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

      {(meus?.length ?? 0) > 0 && (
        <ProximoPasso
          titulo="Agora meça a dor: quanto cada um dos 28 processos incomoda o seu centro?"
          cta="Ir para o termômetro"
          rota="/termometro"
        />
      )}
    </div>
  )
}
