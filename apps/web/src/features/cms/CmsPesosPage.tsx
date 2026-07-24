import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../shared/lib/api-client'

interface Matrix {
  objectives: Array<{ id: number; theme: string; name: string }>
  processes: Array<{ id: number; code: string | null; name: string }>
  weights: Array<{ objectiveId: number; processId: number; weight: number }>
}

const pesosApi = {
  matrix: () => apiFetch<Matrix>('/api/cms/priority-weights'),
  set: (objectiveId: number, processId: number, weight: number) =>
    apiFetch<void>('/api/cms/priority-weights', {
      method: 'PUT',
      body: JSON.stringify({ objectiveId, processId, weight }),
    }),
}

/** Curadoria do mapa objetivo→processo (rascunho [D] do seed → validado aqui).
 *  O peso (1–3) × rank do objetivo do centro = relevância estratégica
 *  (40% do score da priorização). Peso 0 remove o vínculo. */
export function CmsPesosPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['cms-weights'], queryFn: pesosApi.matrix })
  const [busca, setBusca] = useState('')
  const [adicionando, setAdicionando] = useState<Record<number, number>>({}) // objectiveId → processId

  const mudar = useMutation({
    mutationFn: ({ objectiveId, processId, weight }: { objectiveId: number; processId: number; weight: number }) =>
      pesosApi.set(objectiveId, processId, weight),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['cms-weights'] })
      void queryClient.invalidateQueries({ queryKey: ['priorities'] })
    },
  })

  if (isLoading || !data) return <p className="carregando">Carregando o mapa de priorização…</p>

  const processoPorId = new Map(data.processes.map((p) => [p.id, p]))
  const pesosDoObjetivo = (objectiveId: number) =>
    data.weights
      .filter((w) => w.objectiveId === objectiveId)
      .sort((a, b) => b.weight - a.weight)

  const filtro = busca.trim().toLowerCase()
  const objetivosVisiveis = filtro
    ? data.objectives.filter(
        (o) =>
          o.name.toLowerCase().includes(filtro) ||
          pesosDoObjetivo(o.id).some((w) => {
            const p = processoPorId.get(w.processId)
            return p && (`${p.code} ${p.name}`.toLowerCase().includes(filtro))
          }),
      )
    : data.objectives

  const temas = [...new Set(objetivosVisiveis.map((o) => o.theme))]

  return (
    <div className="pilha">
      <p>
        <Link to="/cms">← Catálogo</Link>
      </p>
      <div className="cabecalho-pagina">
        <div>
          <h1>Pesos da priorização</h1>
          <p className="apoio">
            Quais processos servem a cada objetivo, e com que força (1–3). Este mapa × o rank dos
            objetivos de cada centro = a relevância estratégica (40% do score). Mudanças valem na
            hora para todos os centros — o seed inicial é rascunho [D] a validar aqui.
          </p>
        </div>
        <input
          placeholder="Buscar objetivo ou processo…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ width: 260 }}
        />
      </div>

      {temas.map((tema) => (
        <section key={tema} className="cartao">
          <h2 style={{ fontSize: 14 }}>{tema}</h2>
          {objetivosVisiveis
            .filter((o) => o.theme === tema)
            .map((objetivo) => {
              const vinculos = pesosDoObjetivo(objetivo.id)
              const jaVinculados = new Set(vinculos.map((v) => v.processId))
              const disponiveis = data.processes.filter((p) => !jaVinculados.has(p.id))
              return (
                <div key={objetivo.id} className="artefato" style={{ alignItems: 'flex-start' }}>
                  <div className="info" style={{ maxWidth: 320 }}>
                    <div className="titulo">{objetivo.name}</div>
                    <p className="dod">
                      {vinculos.length === 1 ? '1 processo vinculado' : `${vinculos.length} processos vinculados`}
                    </p>
                  </div>
                  <div className="linha-acoes" style={{ flex: 1 }}>
                    {vinculos.map((v) => {
                      const p = processoPorId.get(v.processId)
                      if (!p) return null
                      return (
                        <span key={v.processId} className="tag-compartilhado" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px' }}>
                          <span className="mono">{p.code}</span> {p.name}
                          <select
                            value={v.weight}
                            title="Peso (0 remove)"
                            onChange={(e) =>
                              mudar.mutate({
                                objectiveId: objetivo.id,
                                processId: v.processId,
                                weight: Number(e.target.value),
                              })
                            }
                            style={{ padding: '1px 4px', fontSize: 12 }}
                          >
                            <option value={0}>× remover</option>
                            <option value={1}>peso 1</option>
                            <option value={2}>peso 2</option>
                            <option value={3}>peso 3</option>
                          </select>
                        </span>
                      )
                    })}
                    <select
                      value={adicionando[objetivo.id] ?? 0}
                      onChange={(e) => setAdicionando((a) => ({ ...a, [objetivo.id]: Number(e.target.value) }))}
                      style={{ fontSize: 12 }}
                    >
                      <option value={0}>+ vincular processo…</option>
                      {disponiveis.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code ? `${p.code} ` : ''}{p.name}
                        </option>
                      ))}
                    </select>
                    {(adicionando[objetivo.id] ?? 0) > 0 && (
                      <button
                        className="pequeno"
                        onClick={() => {
                          mudar.mutate({
                            objectiveId: objetivo.id,
                            processId: adicionando[objetivo.id]!,
                            weight: 2,
                          })
                          setAdicionando((a) => ({ ...a, [objetivo.id]: 0 }))
                        }}
                      >
                        Vincular (peso 2)
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
        </section>
      ))}
    </div>
  )
}
