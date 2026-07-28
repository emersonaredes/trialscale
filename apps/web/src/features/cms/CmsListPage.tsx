import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { cmsApi } from './api'
import { ApiError } from '../../shared/lib/api-client'

export function CmsListPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: processos, isLoading } = useQuery({
    queryKey: ['cms-processes'],
    queryFn: cmsApi.listProcesses,
  })
  const [novo, setNovo] = useState({ code: '', name: '', processGroup: 'central' })
  // Edição inline de código/nome (PT-0069)
  const [editando, setEditando] = useState<{ id: number; code: string; name: string } | null>(null)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)

  const salvarEdicao = useMutation({
    mutationFn: (e: { id: number; code: string; name: string }) =>
      cmsApi.updateProcess(e.id, { code: e.code.trim() || null, name: e.name.trim() }),
    onSuccess: () => {
      setEditando(null)
      setErroEdicao(null)
      void queryClient.invalidateQueries({ queryKey: ['cms-processes'] })
    },
    onError: (e) => setErroEdicao(e instanceof ApiError ? e.message : 'Erro ao salvar.'),
  })

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
            {(processos ?? []).map((p) =>
              editando?.id === p.id ? (
                <tr key={p.id}>
                  <td>
                    <input
                      className="mono"
                      value={editando.code}
                      placeholder="—"
                      onChange={(e) => setEditando({ ...editando, code: e.target.value })}
                      style={{ width: 70 }}
                      maxLength={20}
                    />
                  </td>
                  <td>
                    <input
                      value={editando.name}
                      onChange={(e) => setEditando({ ...editando, name: e.target.value })}
                      style={{ width: '100%' }}
                      minLength={2}
                    />
                    {erroEdicao && <div className="erro-msg">{erroEdicao}</div>}
                  </td>
                  <td>{p.processGroup}</td>
                  <td>{p.publishedVersion ? `v${p.publishedVersion}` : <span className="apoio">nunca</span>}</td>
                  <td>
                    <div className="linha-acoes">
                      <button
                        className="pequeno"
                        disabled={editando.name.trim().length < 2 || salvarEdicao.isPending}
                        onClick={() => salvarEdicao.mutate(editando)}
                      >
                        Salvar
                      </button>
                      <button
                        className="pequeno ghost"
                        onClick={() => {
                          setEditando(null)
                          setErroEdicao(null)
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={p.id}>
                  <td className="mono">{p.code ?? '—'}</td>
                  <td>
                    <b>{p.name}</b>
                    {p.oneLineDescription && <div className="apoio">{p.oneLineDescription}</div>}
                  </td>
                  <td>{p.processGroup}</td>
                  <td>{p.publishedVersion ? `v${p.publishedVersion}` : <span className="apoio">nunca</span>}</td>
                  <td>
                    <div className="linha-acoes">
                      <button
                        className="pequeno secundario"
                        onClick={() => abrirRascunho.mutate({ id: p.id, draftVersionId: p.draftVersionId })}
                      >
                        {p.draftVersionId ? 'Abrir rascunho' : 'Novo rascunho'}
                      </button>
                      <button
                        className="pequeno ghost"
                        title="Editar código e nome"
                        onClick={() => {
                          setErroEdicao(null)
                          setEditando({ id: p.id, code: p.code ?? '', name: p.name })
                        }}
                      >
                        ✎
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
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
