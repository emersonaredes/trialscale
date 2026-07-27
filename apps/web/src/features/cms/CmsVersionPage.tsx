import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { cmsApi, type CmsArtifact } from './api'
import { LevelBadge, SealBadge } from '../../shared/components/badges'
import { ApiError } from '../../shared/lib/api-client'

const SELOS = ['T', 'G', 'A', 'P', 'D'] as const

function novoArtefato(): CmsArtifact {
  return {
    logicalKey: '',
    typeCode: 'pop',
    title: '',
    dodText: '',
    seals: ['T'],
    conditionCode: null,
    ownLevel: 2,
    ownClassification: 'essencial',
    extraPlacements: [],
  }
}

/** Editor de rascunho do CMS: edita o graph localmente e salva inteiro. */
export function CmsVersionPage() {
  const { id } = useParams()
  const versionId = Number(id)
  const navigate = useNavigate()

  const { data: lookups } = useQuery({ queryKey: ['cms-lookups'], queryFn: cmsApi.lookups })
  const { data: versao, refetch } = useQuery({
    queryKey: ['cms-version', versionId],
    queryFn: () => cmsApi.getVersion(versionId),
  })

  const [artefatos, setArtefatos] = useState<CmsArtifact[]>([])
  const [descricaoN1, setDescricaoN1] = useState('')
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    // Sincronização deliberada: o editor trabalha numa CÓPIA local do graph e
    // re-hidrata quando o servidor responde (save/refetch renova ids).
    if (versao) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArtefatos(versao.artifacts)
      setDescricaoN1(versao.levels.find((l) => l.number === 1)?.description ?? '')
    }
  }, [versao])

  if (!versao || !lookups) return <p className="carregando">Carregando rascunho…</p>
  const somenteLeitura = versao.status !== 'rascunho'

  function atualizar(i: number, patch: Partial<CmsArtifact>) {
    setArtefatos((atual) => atual.map((a, idx) => (idx === i ? { ...a, ...patch } : a)))
  }

  async function salvar(): Promise<boolean> {
    setErro(null)
    setMensagem(null)
    setSalvando(true)
    try {
      await cmsApi.saveDraft(versionId, {
        levels: [
          { number: 1, name: 'Inicial', description: descricaoN1 || null },
          { number: 2, name: 'Informal', description: null },
          { number: 3, name: 'Definido', description: null },
          { number: 4, name: 'Gerenciado', description: null },
          { number: 5, name: 'Otimizado', description: null },
        ],
        artifacts: artefatos.map(({ id: _id, templates: _t, ...resto }) => ({
          ...resto,
          logicalKey: resto.logicalKey || undefined,
        })) as CmsArtifact[],
      })
      setMensagem('Rascunho salvo.')
      await refetch()
      return true
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? [e.message, e.details ? JSON.stringify(e.details) : null].filter(Boolean).join(' ')
          : 'Erro ao salvar.',
      )
      return false
    } finally {
      setSalvando(false)
    }
  }

  async function publicar() {
    if (!(await salvar())) return
    try {
      const r = await cmsApi.publish(versionId)
      setMensagem(`Publicado! Marcações migradas: ${r.migratedAssessments}. 🎉`)
      setTimeout(() => navigate('/cms'), 1200)
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao publicar.')
    }
  }

  return (
    <div className="pilha">
      <p>
        <Link to="/cms">← Catálogo</Link>
      </p>
      <div className="cabecalho-pagina">
        <div>
          <h1>
            Rascunho v{versao.versionNo} <span className="mono">({versao.status})</span>
          </h1>
          <p className="apoio">
            Edite os artefatos e salve; publique quando o conteúdo estiver curado. Selo NORMA exige
            validação humana antes de publicar (constituição §6).
          </p>
        </div>
        {!somenteLeitura && (
          <div className="linha-acoes">
            <button className="secundario" onClick={() => void salvar()} disabled={salvando}>
              Salvar rascunho
            </button>
            <button className="completar" onClick={() => void publicar()} disabled={salvando}>
              Publicar
            </button>
          </div>
        )}
      </div>

      {mensagem && <div className="aviso" style={{ background: 'var(--verde-50)', borderColor: 'var(--verde-300)', color: 'var(--verde-700)' }}>{mensagem}</div>}
      {erro && <p className="erro-msg">{erro}</p>}

      <section className="cartao">
        <label>
          Descrição do nível 1 (Inicial) — como é o processo sem gestão
          <textarea rows={2} value={descricaoN1} onChange={(e) => setDescricaoN1(e.target.value)} disabled={somenteLeitura} />
        </label>
      </section>

      {artefatos.map((a, i) => (
        <section key={i} className="cartao">
          <div className="cabecalho-pagina" style={{ marginBottom: 8 }}>
            <div className="linha-acoes">
              <LevelBadge level={a.ownLevel} />
              {a.seals.map((s) => (
                <SealBadge key={s} code={s} />
              ))}
            </div>
            {!somenteLeitura && (
              <button
                className="destrutivo pequeno"
                onClick={() => setArtefatos((x) => x.filter((_, idx) => idx !== i))}
              >
                Remover
              </button>
            )}
          </div>
          <div className="pilha" style={{ gap: 10 }}>
            <div className="linha">
              <label style={{ flex: 2 }}>
                Título
                <input value={a.title} onChange={(e) => atualizar(i, { title: e.target.value })} disabled={somenteLeitura} />
              </label>
              <label>
                Chave estável (logical key)
                <input
                  value={a.logicalKey}
                  placeholder="gerada do título"
                  onChange={(e) => atualizar(i, { logicalKey: e.target.value })}
                  disabled={somenteLeitura}
                />
              </label>
            </div>
            <label>
              Definição de pronto (frase completa)
              <textarea rows={2} value={a.dodText} onChange={(e) => atualizar(i, { dodText: e.target.value })} disabled={somenteLeitura} />
            </label>
            <div className="linha">
              <label>
                Tipo
                <select value={a.typeCode} onChange={(e) => atualizar(i, { typeCode: e.target.value })} disabled={somenteLeitura}>
                  {lookups.artifactTypes.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Nível
                <select value={a.ownLevel} onChange={(e) => atualizar(i, { ownLevel: Number(e.target.value) })} disabled={somenteLeitura}>
                  {[2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Classificação
                <select
                  value={a.ownClassification}
                  onChange={(e) => atualizar(i, { ownClassification: e.target.value as CmsArtifact['ownClassification'] })}
                  disabled={somenteLeitura}
                >
                  <option value="essencial">Essencial</option>
                  <option value="complementar">Complementar</option>
                </select>
              </label>
              <label>
                Condição de perfil
                <select
                  value={a.conditionCode ?? ''}
                  onChange={(e) => atualizar(i, { conditionCode: e.target.value || null })}
                  disabled={somenteLeitura}
                >
                  <option value="">— sempre aplicável —</option>
                  {lookups.conditions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="linha-acoes">
              <span className="hint">Selos:</span>
              {SELOS.map((s) => (
                <label key={s} className="checkbox" style={{ fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={a.seals.includes(s)}
                    disabled={somenteLeitura}
                    onChange={(e) =>
                      atualizar(i, {
                        seals: e.target.checked ? [...a.seals, s] : a.seals.filter((x) => x !== s),
                      })
                    }
                  />
                  {s}
                </label>
              ))}
            </div>
            <div className="linha-acoes">
              <span className="hint">Também conta em:</span>
              {a.extraPlacements.map((ep, j) => {
                const proc = lookups.processes.find((p) => p.id === ep.processId)
                return (
                  <span key={j} className="tag-compartilhado">
                    {proc?.code ?? proc?.name} · N{ep.level} · {ep.classification}
                    {!somenteLeitura && (
                      <button
                        className="ghost pequeno"
                        style={{ padding: '0 4px' }}
                        onClick={() =>
                          atualizar(i, { extraPlacements: a.extraPlacements.filter((_, k) => k !== j) })
                        }
                      >
                        ×
                      </button>
                    )}
                  </span>
                )
              })}
              {!somenteLeitura && (
                <AddPlacement
                  processes={lookups.processes.filter((p) => p.id !== versao.processId)}
                  onAdd={(ep) => atualizar(i, { extraPlacements: [...a.extraPlacements, ep] })}
                />
              )}
            </div>
            {a.id && (
              <div className="linha-acoes">
                <span className="hint">Templates:</span>
                {(a.templates ?? []).map((t) => (
                  <span key={t.id} className="tag-compartilhado">
                    {t.filename}
                    {!somenteLeitura && (
                      <button
                        className="ghost pequeno"
                        style={{ padding: '0 4px' }}
                        title="Remover template"
                        onClick={() => void cmsApi.deleteTemplate(t.id).then(() => refetch())}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {!somenteLeitura && (
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file && a.id) {
                        void cmsApi.uploadTemplate(a.id, file).then(() => refetch())
                      }
                    }}
                  />
                )}
                <span className="hint">(salve o rascunho antes de anexar a artefatos novos)</span>
              </div>
            )}
          </div>
        </section>
      ))}

      {!somenteLeitura && (
        <button className="secundario" onClick={() => setArtefatos((x) => [...x, novoArtefato()])}>
          + Adicionar artefato
        </button>
      )}
    </div>
  )
}

function AddPlacement({
  processes,
  onAdd,
}: {
  processes: Array<{ id: number; code: string | null; name: string }>
  onAdd: (ep: { processId: number; level: number; classification: 'essencial' | 'complementar' }) => void
}) {
  const [processId, setProcessId] = useState<number>(0)
  return (
    <>
      <select value={processId} onChange={(e) => setProcessId(Number(e.target.value))}>
        <option value={0}>+ processo…</option>
        {processes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.code ? `${p.code} ` : ''}{p.name}
          </option>
        ))}
      </select>
      <button
        className="ghost pequeno"
        disabled={!processId}
        onClick={() => {
          onAdd({ processId, level: 2, classification: 'essencial' })
          setProcessId(0)
        }}
      >
        adicionar (N2, essencial)
      </button>
    </>
  )
}
