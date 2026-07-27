import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { cmsApi } from './api'

export function CmsListPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: processos, isLoading } = useQuery({
    queryKey: ['cms-processes'],
    queryFn: cmsApi.listProcesses,
  })
  const [novo, setNovo] = useState({ code: '', name: '', processGroup: 'central' })

  const criar = useMutation({
    mutationFn: () =>
      cmsApi.createProcess({
        code: novo.code || null,
        name: novo.name,
        processGroup: novo.processGroup,
      }),
    onSuccess: () => {
      setNovo({ code: '', name: '', processGroup: 'central' })
      void queryClient.invalidateQueries({ queryKey: ['cms-processes'] })
    },
  })

  const abrirRascunho = useMutation({
    mutationFn: async (p: { id: number; draftVersionId: number | null }) => {
      if (p.draftVersionId) return { versionId: p.draftVersionId }
      return cmsApi.createDraft(p.id)
    },
    onSuccess: ({ versionId }) => navigate(`/cms/versao/${versionId}`),
  })

  if (isLoading) return <p className="carregando">Carregando catálogo…</p>

  return (
    <div className="pilha">
      <div className="cabecalho-pagina">
        <div>
          <h1>CMS — Catálogo de processos</h1>
          <p className="apoio">
            Rascunho → edição → publicação. Centros só veem conteúdo publicado; publicar migra as
            marcações automaticamente (ADR 002).
          </p>
        </div>
        <Link to="/cms/pesos">
          <button className="secundario">Pesos da priorização</button>
        </Link>
      </div>

      <div className="cartao" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Processo</th>
              <th>Grupo</th>
              <th>Publicada</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(processos ?? []).map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.code ?? '—'}</td>
                <td>
                  <b>{p.name}</b>
                  {p.oneLineDescription && <div className="apoio">{p.oneLineDescription}</div>}
                </td>
                <td>{p.processGroup}</td>
                <td>{p.publishedVersion ? `v${p.publishedVersion}` : <span className="apoio">nunca</span>}</td>
                <td>
                  <button
                    className="pequeno secundario"
                    onClick={() => abrirRascunho.mutate({ id: p.id, draftVersionId: p.draftVersionId })}
                  >
                    {p.draftVersionId ? 'Abrir rascunho' : 'Novo rascunho'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="cartao">
        <h2>Novo processo</h2>
        <div className="linha-acoes">
          <input
            placeholder="Código (ex.: 2.3)"
            value={novo.code}
            onChange={(e) => setNovo({ ...novo, code: e.target.value })}
            style={{ width: 130 }}
          />
          <input
            placeholder="Nome do processo"
            value={novo.name}
            onChange={(e) => setNovo({ ...novo, name: e.target.value })}
            style={{ flex: 1 }}
          />
          <select
            value={novo.processGroup}
            onChange={(e) => setNovo({ ...novo, processGroup: e.target.value })}
          >
            <option value="central">Central</option>
            <option value="suporte">Suporte</option>
            <option value="gestao">Gestão</option>
          </select>
          <button className="pequeno" disabled={novo.name.length < 2} onClick={() => criar.mutate()}>
            Criar
          </button>
        </div>
      </section>
      <p>
        <Link to="/">← Voltar ao início</Link>
      </p>
    </div>
  )
}
