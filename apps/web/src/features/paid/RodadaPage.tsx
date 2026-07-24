import { useEffect, useRef, useState, type DragEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paidApi, type KanbanCard, type PriorityItem } from './api'
import { processesApi } from '../processes/api'
import { LevelBadge, ClassMark } from '../../shared/components/badges'
import { Paywall, isPlanRequired } from '../../shared/components/Paywall'
import { ProximoPasso } from '../../shared/components/ProximoPasso'
import { useAuth } from '../auth/hooks/use-auth'

const COLUNAS: Array<{ chave: string; titulo: string }> = [
  { chave: 'nao_iniciado', titulo: 'Não iniciado' },
  { chave: 'em_elaboracao', titulo: 'Em elaboração' },
  { chave: 'completo', titulo: 'Completo' },
]

export function RodadaPage() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const podeGerir = session?.role === 'administrador' || session?.role === 'coordenador'
  const [celebracao, setCelebracao] = useState<Awaited<ReturnType<typeof paidApi.conclude>> | null>(null)

  const { data, error, isLoading } = useQuery({
    queryKey: ['round'],
    queryFn: paidApi.currentRound,
    retry: false,
  })

  if (isPlanRequired(error)) return <Paywall />
  if (isLoading || !data) return <p className="carregando">Preparando sua rodada…</p>

  return (
    <div className="pilha">
      {celebracao && (
        <Celebracao resultado={celebracao} aoFechar={() => setCelebracao(null)} />
      )}
      {data.round ? (
        <RodadaAtiva
          podeGerir={podeGerir}
          aoConcluir={async () => {
            const resultado = await paidApi.conclude()
            setCelebracao(resultado)
            void queryClient.invalidateQueries({ queryKey: ['round'] })
            void queryClient.invalidateQueries({ queryKey: ['kanban'] })
          }}
        />
      ) : (
        <NovaRodada podeGerir={podeGerir} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------- nova rodada
function NovaRodada({ podeGerir }: { podeGerir: boolean }) {
  const queryClient = useQueryClient()
  const location = useLocation()
  const { data } = useQuery({ queryKey: ['priorities'], queryFn: paidApi.priorities, retry: false })
  const [selecionados, setSelecionados] = useState<number[] | null>(null)
  const [semanas, setSemanas] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const elegiveis: PriorityItem[] = (data?.items ?? []).filter(
    (i) => i.published && i.applies && (i.level ?? 1) < 5,
  )
  // Seleção pode chegar da tela Processos (checkboxes); senão, a sugestão.
  const daNavegacao = (location.state as { processIds?: number[] } | null)?.processIds
  const escolhidos =
    selecionados ?? daNavegacao ?? elegiveis.filter((i) => i.suggested).map((i) => i.processId)

  function alternar(id: number) {
    setErro(null)
    setSelecionados((_) => {
      const atual = escolhidos
      if (atual.includes(id)) return atual.filter((x) => x !== id)
      if (atual.length >= 4) return atual
      return [...atual, id]
    })
  }

  const criar = useMutation({
    mutationFn: () => paidApi.createRound(escolhidos, semanas),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['round'] }),
    onError: (e) => setErro(e instanceof Error ? e.message : 'Erro ao criar a rodada.'),
  })

  return (
    <>
      <div>
        <h1>Monte a sua rodada</h1>
        <p className="apoio">
          Foco vence volume: escolha <b>3 ou 4 processos</b> para melhorar agora. A sugestão vem
          dos seus <Link to="/processos">processos priorizados</Link> — ajuste à vontade.
        </p>
      </div>

      <section className="cartao">
        {elegiveis.length === 0 && (
          <p className="apoio">
            Nenhum processo elegível ainda — as trilhas dependem de conteúdo publicado.
          </p>
        )}
        {elegiveis.map((i) => (
          <label key={i.processId} className="checkbox artefato" style={{ alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={escolhidos.includes(i.processId)}
              onChange={() => alternar(i.processId)}
              disabled={!podeGerir || (!escolhidos.includes(i.processId) && escolhidos.length >= 4)}
            />
            <div className="info">
              <span className="mono">{i.code}</span> <b>{i.name}</b>
              {i.suggested && <span className="tag-compartilhado" style={{ marginLeft: 6 }}>sugerido</span>}
              {i.silentRisk && <span className="tag-risco" style={{ marginLeft: 6 }}>risco silencioso</span>}
            </div>
            <span className="apoio">score {i.score}</span>
            {i.level != null && <LevelBadge level={i.level} />}
          </label>
        ))}
      </section>

      {podeGerir && (
        <section className="cartao">
          <div className="linha-acoes">
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              Desafio de ritmo (opcional):
              <select
                value={semanas ?? ''}
                onChange={(e) => setSemanas(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">sem prazo</option>
                <option value="4">4 semanas</option>
                <option value="6">6 semanas</option>
                <option value="8">8 semanas</option>
                <option value="12">12 semanas</option>
              </select>
            </label>
            <button
              disabled={escolhidos.length < 3 || criar.isPending}
              onClick={() => criar.mutate()}
            >
              Começar rodada ({escolhidos.length}/4)
            </button>
          </div>
          {erro && <p className="erro-msg">{erro}</p>}
        </section>
      )}
    </>
  )
}

// ---------------------------------------------------------------- rodada ativa
function RodadaAtiva({ podeGerir, aoConcluir }: { podeGerir: boolean; aoConcluir: () => Promise<void> }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['kanban'], queryFn: paidApi.kanban, retry: false })
  const [arrastando, setArrastando] = useState<KanbanCard | null>(null)
  const [colunaAlvo, setColunaAlvo] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Toast de conquista: detecta SUBIDA de nível comparando com o snapshot
  // anterior (celebra de verdade — DS: cor e movimento só na vitória).
  const niveisAnteriores = useRef<Map<number, number>>(new Map())
  useEffect(() => {
    if (!data) return
    for (const p of data.round.processes) {
      const anterior = niveisAnteriores.current.get(p.processId)
      if (anterior != null && p.currentLevel > anterior) {
        setToast(`Aê! Nível ${p.currentLevel} em ${p.name} 🎉`)
        const timer = setTimeout(() => setToast(null), 5000)
        niveisAnteriores.current.set(p.processId, p.currentLevel)
        return () => clearTimeout(timer)
      }
      niveisAnteriores.current.set(p.processId, p.currentLevel)
    }
  }, [data])

  const mover = useMutation({
    mutationFn: ({ card, estado }: { card: KanbanCard; estado: string }) =>
      processesApi.mark(card.artifactId, estado, null),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['kanban'] })
      void queryClient.invalidateQueries({ queryKey: ['round'] })
      void queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
    onError: (e) => setErro(e instanceof Error ? e.message : 'Não foi possível mover.'),
  })

  function aoSoltar(estado: string) {
    if (arrastando) mover.mutate({ card: arrastando, estado })
    setArrastando(null)
    setColunaAlvo(null)
  }

  if (isLoading || !data) return <p className="carregando">Abrindo o kanban…</p>
  const { round, columns } = data

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Rodada {round.sequenceNo}</h1>
          <p className="apoio">
            Arraste os artefatos entre as colunas — só o <b>Completo</b> conta para o nível.
            {round.challengeDeadline &&
              ` Desafio: até ${new Date(round.challengeDeadline).toLocaleDateString('pt-BR')}.`}
          </p>
        </div>
        {podeGerir && (
          <button
            className={round.canConclude ? 'celebracao' : 'secundario'}
            disabled={!round.canConclude}
            title={round.canConclude ? 'Todos subiram de nível!' : 'Habilita quando cada processo subir 1 nível'}
            onClick={() => void aoConcluir().catch((e) => setErro(e.message))}
          >
            {round.canConclude ? 'Celebrar e encerrar 🎉' : 'Celebrar e encerrar'}
          </button>
        )}
      </div>

      {/* Progresso da rodada (v3 §7): uma linha por processo, acima do kanban */}
      <section className="cartao">
        <h2>Progresso da rodada</h2>
        {round.processes.map((p) => (
          <div key={p.processId} className="artefato" style={{ alignItems: 'center' }}>
            <span className="mono" style={{ width: 30 }}>{p.code}</span>
            <Link
              to={`/processos/${p.processId}`}
              style={{ fontWeight: 700, fontSize: 12.5, width: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={`${p.name} — abrir o Raio-X`}
            >
              {p.name}
            </Link>
            <span style={{ opacity: 0.55 }}>
              <LevelBadge level={p.baselineLevel} />
            </span>
            <span className="apoio">→</span>
            <LevelBadge level={p.currentLevel} />
            <div style={{ flex: 1, maxWidth: 190 }}>
              <div className="apoio" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>artefatos {p.artifactsComplete}/{p.artifactsTotal}</span>
                <span>{p.artifactsTotal - p.artifactsComplete} pendentes</span>
              </div>
              <div className={`progresso ${p.artifactsTotal > 0 && p.artifactsComplete / p.artifactsTotal >= 0.8 ? 'quase' : ''}`}>
                <span
                  style={{
                    width: `${p.artifactsTotal ? Math.round((100 * p.artifactsComplete) / p.artifactsTotal) : 0}%`,
                  }}
                />
              </div>
            </div>
            {p.leveledUp ? (
              <span style={{ color: 'var(--verde-700)', fontWeight: 700, fontSize: 12.5 }}>
                ✓ subiu de nível!
              </span>
            ) : (
              <span className="apoio">faltam {p.nextLevelMissing} essenciais</span>
            )}
          </div>
        ))}
      </section>

      {erro && <p className="erro-msg">{erro}</p>}

      <div className="kanban">
        {COLUNAS.map((coluna) => (
          <div
            key={coluna.chave}
            className={`kanban-coluna ${colunaAlvo === coluna.chave ? 'alvo-drop' : ''}`}
            onDragOver={(e: DragEvent) => {
              e.preventDefault()
              if (colunaAlvo !== coluna.chave) setColunaAlvo(coluna.chave)
            }}
            onDragLeave={() => setColunaAlvo(null)}
            onDrop={() => aoSoltar(coluna.chave)}
          >
            <h3>
              {coluna.titulo} ({(columns[coluna.chave] ?? []).length})
            </h3>
            {(columns[coluna.chave] ?? []).map((card) => (
              <div
                key={card.artifactId}
                className={`kanban-cartao ${arrastando?.artifactId === card.artifactId ? 'arrastando' : ''}`}
                draggable
                onDragStart={() => setArrastando(card)}
                onDragEnd={() => {
                  setArrastando(null)
                  setColunaAlvo(null)
                }}
                title={card.dodText}
              >
                <b style={{ color: 'var(--ink)' }}>{card.title}</b>
                <div className="meta">
                  <ClassMark classification={card.classification} />
                  <span className="apoio" title={card.processName}>
                    <span className="mono">{card.processCode}</span>{' '}
                    {card.processName.length > 28 ? `${card.processName.slice(0, 28)}…` : card.processName}
                  </span>
                  <span className="apoio">N{card.level}</span>
                  {card.shared && <span className="tag-compartilhado">compartilhado</span>}
                  {card.expectedDueDate && (
                    <span className="apoio">até {new Date(card.expectedDueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <ProximoPasso
        eyebrow="Enquanto a rodada avança"
        titulo="Veja suas conquistas e baixe o Mapa de Maturidade para mostrar o progresso"
        cta="Ver conquistas"
        rota="/conquistas"
      />

      {toast && (
        <div className="toast" role="status">
          <span className="icone">✓</span>
          <span>
            <b>{toast}</b>
            <span className="sub">Só o essencial completo sobe o nível — e subiu.</span>
          </span>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------- celebração
function Celebracao({
  resultado,
  aoFechar,
}: {
  resultado: { sequenceNo: number; processes: Array<{ name: string; code: string | null; from: number; to: number }> }
  aoFechar: () => void
}) {
  return (
    <div className="overlay-celebracao" onClick={aoFechar}>
      <div className="modal-celebracao" onClick={(e) => e.stopPropagation()}>
        <div className="topo">
          <h2>Aê! Rodada {resultado.sequenceNo} concluída 🎉</h2>
          <p style={{ margin: 0, opacity: 0.9 }}>Cada processo subiu de nível — isso é maturidade de verdade.</p>
        </div>
        <div className="corpo pilha">
          {resultado.processes.map((p) => (
            <div key={p.code} className="linha-acoes">
              <span className="mono">{p.code}</span>
              <b style={{ flex: 1, color: 'var(--ink)' }}>{p.name}</b>
              <LevelBadge level={p.from} />
              <span className="apoio">→</span>
              <LevelBadge level={p.to} />
            </div>
          ))}
          <button className="celebracao" onClick={aoFechar}>
            Escolher a próxima rodada
          </button>
        </div>
      </div>
    </div>
  )
}
