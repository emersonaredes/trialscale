import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { processesApi, type ArtifactStatus } from './api'
import { LevelBadge, StatePill, SealBadge, ClassMark } from '../../shared/components/badges'
import { apiDownload } from '../../shared/lib/api-client'
import { useAuth } from '../auth/hooks/use-auth'

const PROXIMO_ESTADO: Record<string, ArtifactStatus['state']> = {
  nao_iniciado: 'em_elaboracao',
  em_elaboracao: 'completo',
  completo: 'nao_iniciado',
}

export function ProcessoDetailPage() {
  const { id } = useParams()
  const processId = Number(id)
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [justificativa, setJustificativa] = useState('')
  const [dueDates, setDueDates] = useState<Record<number, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['processo', processId],
    queryFn: () => processesApi.detail(processId),
  })

  const recarregar = () => {
    void queryClient.invalidateQueries({ queryKey: ['processo', processId] })
    void queryClient.invalidateQueries({ queryKey: ['overview'] })
  }

  const marcar = useMutation({
    mutationFn: ({ artifact, state }: { artifact: ArtifactStatus; state: string }) =>
      processesApi.mark(
        artifact.artifactId,
        state,
        state === 'em_elaboracao' ? (dueDates[artifact.artifactId] ?? null) : null,
      ),
    onSettled: recarregar,
  })

  const aplicabilidade = useMutation({
    mutationFn: ({ applies, j }: { applies: boolean; j?: string }) =>
      processesApi.setApplicability(processId, applies, j),
    onSettled: recarregar,
  })

  if (isLoading || !data) return <p className="carregando">Carregando o Raio-X…</p>

  const { process, levels, maturity } = data
  const podeGerirNA = session?.role === 'administrador' || session?.role === 'coordenador'

  return (
    <div className="pilha">
      <p>
        <Link to="/processos">← Todos os processos</Link>
      </p>
      <div className="cabecalho-pagina">
        <div>
          <h1>
            {process.code && <span className="mono">{process.code}</span>} {process.name}
          </h1>
          {process.objectiveText && <p className="apoio">{process.objectiveText}</p>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="apoio">Nível atual</span>
          <div>
            <LevelBadge level={maturity.level} />
          </div>
          <div className="apoio">
            {maturity.essentialsComplete}/{maturity.essentialsTotal} essenciais ·{' '}
            {maturity.complementaryComplete}/{maturity.complementaryTotal} complementares
          </div>
        </div>
      </div>

      {!maturity.applies && (
        <div className="aviso">
          Este processo está marcado como <b>não se aplica</b>
          {maturity.naJustification ? ` — “${maturity.naJustification}”` : ''}. Ele fica fora do
          nível geral (a justificativa aparece no relatório).
          {podeGerirNA && (
            <div className="linha-acoes" style={{ marginTop: 8 }}>
              <button
                className="pequeno secundario"
                onClick={() => aplicabilidade.mutate({ applies: true })}
              >
                Voltar a considerar este processo
              </button>
            </div>
          )}
        </div>
      )}

      {maturity.excludedByCondition.length > 0 && (
        <div className="aviso">
          Fora do seu cálculo pelo perfil do centro (transparência da régua):{' '}
          {maturity.excludedByCondition.map((e) => e.title).join(' · ')}
        </div>
      )}

      {levels
        .filter((l) => l.number >= 1)
        .map((nivel) => {
          const artefatos = maturity.artifacts.filter((a) => a.level === nivel.number)
          if (nivel.number === 1) {
            return (
              <section key={nivel.number} className="cartao secao-nivel">
                <div className="cabecalho">
                  <LevelBadge level={1} />
                </div>
                <p className="apoio">{nivel.description ?? 'Ponto de partida da jornada.'}</p>
              </section>
            )
          }
          if (artefatos.length === 0) return null
          return (
            <section key={nivel.number} className="cartao secao-nivel">
              <div className="cabecalho">
                <LevelBadge level={nivel.number} />
                <span className="apoio">
                  {artefatos.filter((a) => a.state === 'completo').length}/{artefatos.length}{' '}
                  completos
                </span>
              </div>
              {artefatos.map((a) => (
                <div key={a.artifactId} className="artefato">
                  <ClassMark classification={a.classification} />
                  <div className="info">
                    <div className="titulo">
                      {a.title}
                      {a.seals.map((s) => (
                        <SealBadge key={s} code={s} />
                      ))}
                      {a.shared && <span className="tag-compartilhado">compartilhado</span>}
                    </div>
                    <p className="dod">{a.dodText}</p>
                    {a.templates.length > 0 && (
                      <div className="linha-acoes">
                        {a.templates.map((t) => (
                          <button
                            key={t.id}
                            className="ghost pequeno"
                            onClick={() => void apiDownload(`/api/templates/${t.id}/download`, t.filename)}
                          >
                            ⬇ {t.filename}
                          </button>
                        ))}
                      </div>
                    )}
                    {a.state === 'em_elaboracao' && (
                      <div className="linha-acoes" style={{ marginTop: 6 }}>
                        <span className="hint">Data-limite esperada:</span>
                        <input
                          type="date"
                          value={dueDates[a.artifactId] ?? a.expectedDueDate ?? ''}
                          onChange={(e) => {
                            setDueDates((d) => ({ ...d, [a.artifactId]: e.target.value }))
                            void processesApi
                              .mark(a.artifactId, 'em_elaboracao', e.target.value)
                              .then(recarregar)
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <StatePill
                    state={a.state}
                    onClick={() => marcar.mutate({ artifact: a, state: PROXIMO_ESTADO[a.state]! })}
                  />
                </div>
              ))}
            </section>
          )
        })}

      {maturity.applies && podeGerirNA && (
        <section className="cartao">
          <h2>Este processo não faz parte da realidade do seu centro?</h2>
          <p className="apoio">
            Processos “não se aplica” saem do cálculo do nível geral. A justificativa fica visível
            no relatório — transparência é o que mantém a régua honesta.
          </p>
          <div className="linha-acoes">
            <input
              placeholder="Justificativa (obrigatória)"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="destrutivo pequeno"
              disabled={justificativa.trim().length < 5}
              onClick={() => aplicabilidade.mutate({ applies: false, j: justificativa })}
            >
              Marcar “não se aplica”
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
