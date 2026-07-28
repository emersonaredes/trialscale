import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paidApi } from './api'
import { processesApi } from '../processes/api'
import { LevelBadge, StatePill, SealBadge, ClassMark } from '../../shared/components/badges'
import { apiDownload } from '../../shared/lib/api-client'
import { Paywall, isPlanRequired } from '../../shared/components/Paywall'

const PROXIMO_ESTADO: Record<string, string> = {
  nao_iniciado: 'em_elaboracao',
  em_elaboracao: 'completo',
  completo: 'nao_iniciado',
}

/** Página do card do kanban (PT-0068): detalhes do artefato, templates,
 *  data-limite e responsáveis. */
export function RodadaArtefatoPage() {
  const { id } = useParams()
  const artifactId = Number(id)
  const queryClient = useQueryClient()
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const { data, error, isLoading } = useQuery({
    queryKey: ['round-artifact', artifactId],
    queryFn: () => paidApi.artifactDetail(artifactId),
    retry: false,
  })
  const { data: equipe } = useQuery({ queryKey: ['tenant-users'], queryFn: paidApi.tenantUsers })

  const recarregar = () => {
    void queryClient.invalidateQueries({ queryKey: ['round-artifact', artifactId] })
    void queryClient.invalidateQueries({ queryKey: ['kanban'] })
    void queryClient.invalidateQueries({ queryKey: ['round'] })
  }

  const marcar = useMutation({
    mutationFn: (payload: { state: string; due: string | null }) =>
      processesApi.mark(artifactId, payload.state, payload.due),
    onSuccess: recarregar,
    onError: (e) => setErro(e instanceof Error ? e.message : 'Não foi possível marcar.'),
  })

  const salvarResponsaveis = useMutation({
    mutationFn: (userIds: number[]) => paidApi.setAssignees(artifactId, userIds),
    onSuccess: recarregar,
    onError: (e) => setErro(e instanceof Error ? e.message : 'Não foi possível salvar.'),
  })

  if (isPlanRequired(error)) return <Paywall />
  if (isLoading || !data) return <p className="carregando">Abrindo o artefato…</p>

  const { artifact: a, process, assignees } = data
  const responsaveisIds = new Set(assignees.map((r) => r.id))

  function alternarResponsavel(userId: number) {
    const novo = new Set(responsaveisIds)
    if (novo.has(userId)) novo.delete(userId)
    else novo.add(userId)
    salvarResponsaveis.mutate([...novo])
  }

  return (
    <div className="pilha">
      <p>
        <Link to="/rodada">← Voltar à rodada</Link>
      </p>

      <div className="cabecalho-pagina">
        <div>
          <h1>{a.title}</h1>
          <p className="apoio">
            <span className="mono">{process.code}</span> {process.name} · Nível {a.level}
          </p>
        </div>
        <StatePill
          state={a.state}
          onClick={() =>
            marcar.mutate({ state: PROXIMO_ESTADO[a.state]!, due: null })
          }
        />
      </div>

      <section className="cartao">
        <div className="linha-acoes" style={{ marginBottom: 8 }}>
          <ClassMark classification={a.classification} />
          <LevelBadge level={a.level} />
          {a.seals.map((s) => (
            <SealBadge key={s} code={s} />
          ))}
          {a.shared && <span className="tag-compartilhado">compartilhado</span>}
          {a.custom && <span className="tag-compartilhado">personalizado</span>}
        </div>
        <h2>Definição de pronto</h2>
        <p>{a.dodText}</p>
        {a.whyItMatters && (
          <p className="porque-importa">
            <b>Por que importa:</b> {a.whyItMatters}
          </p>
        )}
      </section>

      <section className="cartao">
        <h2>Data-limite</h2>
        {a.state === 'em_elaboracao' ? (
          <div className="linha-acoes">
            <span className="hint">Esperada para:</span>
            <input
              type="date"
              value={dueDate ?? a.expectedDueDate ?? ''}
              onChange={(e) => {
                setDueDate(e.target.value)
                marcar.mutate({ state: 'em_elaboracao', due: e.target.value })
              }}
            />
          </div>
        ) : (
          <p className="apoio">
            {a.expectedDueDate
              ? `Prevista: ${new Date(a.expectedDueDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
              : 'A data-limite é definida quando o artefato entra em elaboração.'}
          </p>
        )}
      </section>

      <section className="cartao">
        <h2>Responsáveis</h2>
        <p className="apoio">Quem do centro responde por este artefato (pode ser mais de uma pessoa).</p>
        <div className="grade-especialidades">
          {(equipe?.users ?? []).map((u) => (
            <label key={u.id} className="checkbox">
              <input
                type="checkbox"
                checked={responsaveisIds.has(u.id)}
                disabled={salvarResponsaveis.isPending}
                onChange={() => alternarResponsavel(u.id)}
              />
              {u.name}
              {u.role && <span className="hint"> · {u.role}</span>}
            </label>
          ))}
        </div>
      </section>

      <section className="cartao">
        <h2>Templates para download</h2>
        {a.templates.length === 0 ? (
          <p className="apoio">Nenhum template anexado pela equipe TrialScale para este artefato.</p>
        ) : (
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
      </section>

      {erro && <p className="erro-msg">{erro}</p>}
    </div>
  )
}
