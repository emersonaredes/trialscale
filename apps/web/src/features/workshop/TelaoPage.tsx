import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import QRCode from 'qrcode'
import { ApiError, getAccessToken } from '../../shared/lib/api-client'
import { openStream } from '../../shared/lib/sse'
import { LogoSymbol, Wordmark } from '../../shared/components/Logo'
import { LevelBadge, SealBadge, ClassMark } from '../../shared/components/badges'
import { SecaoColapsavel } from '../../shared/components/SecaoColapsavel'
import { workshopAdminApi, type Snapshot, type WorkshopStep } from './api'

/**
 * TELÃO do apresentador (Workshop ao vivo, spec 006) — tela cheia para
 * projetar. Recebe o estado da sala por SSE e conduz os passos.
 */
const ORDEM: WorkshopStep[] = [
  'entrada',
  'objetivos',
  'ranking_objetivos',
  'ranking_processos',
  'avaliacao',
  'distribuicao',
]
const ROTULO: Record<WorkshopStep, string> = {
  entrada: 'Entrada',
  objetivos: 'Objetivos',
  ranking_objetivos: 'Objetivos da plateia',
  ranking_processos: 'Processos prioritários',
  avaliacao: 'Autoavaliação',
  distribuicao: 'Resultado da sala',
}

export function TelaoPage() {
  const roomId = Number(useParams().id)
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [conectado, setConectado] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [detalhe, setDetalhe] = useState<number | null>(null)
  const [qr, setQr] = useState<string | null>(null)

  useEffect(() => {
    const stream = openStream(`/api/workshops/${roomId}/events`, {
      headers: () => {
        const token = getAccessToken()
        return token ? { Authorization: `Bearer ${token}` } : {}
      },
      onStatus: setConectado,
      onDenied: (status) => {
        if (status === 404) {
          setErro('Sala não encontrada.')
          return false
        }
        return true // 401: o token é renovado em segundo plano — tenta de novo
      },
      onEvent: (evento, dados) => {
        if (evento === 'snapshot') setSnap(dados as Snapshot)
      },
    })
    return () => stream.close()
  }, [roomId])

  const code = snap?.room.code
  const link = code ? `${window.location.origin}/w/${code}` : ''
  useEffect(() => {
    if (!link) return
    QRCode.toDataURL(link, { width: 720, margin: 1, color: { dark: '#0a3a4e', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(null))
  }, [link])

  /** Ações do apresentador: a resposta já traz o snapshot novo. */
  const agir = async (fn: () => Promise<Snapshot>) => {
    setOcupado(true)
    setErro(null)
    try {
      setSnap(await fn())
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Sem conexão com o servidor.')
    } finally {
      setOcupado(false)
    }
  }
  const irPara = (step: WorkshopStep) => agir(() => workshopAdminApi.setStep(roomId, step))

  if (!snap) {
    return (
      <div className="ws-telao">
        <div className="ws-telao-vazio">{erro ?? 'Abrindo a sala…'}</div>
      </div>
    )
  }

  const { room, participants, objectives, processes, assessment } = snap
  const encerrada = room.status === 'encerrada'
  const passo = room.step
  const indice = ORDEM.indexOf(passo)
  const anterior: WorkshopStep | null =
    passo === 'avaliacao' ? 'ranking_processos' : indice > 0 ? ORDEM[indice - 1]! : null

  // Ação principal de cada passo (uma por tela — DS v2).
  let principal: { rotulo: string; acao: () => void } | null = null
  if (!encerrada) {
    if (passo === 'entrada') principal = { rotulo: 'Começar: abrir votação de objetivos', acao: () => void irPara('objetivos') }
    if (passo === 'objetivos') principal = { rotulo: 'Encerrar votação e mostrar resultado', acao: () => void irPara('ranking_objetivos') }
    if (passo === 'ranking_objetivos') principal = { rotulo: 'Ver processos prioritários', acao: () => void irPara('ranking_processos') }
    if (passo === 'avaliacao') principal = { rotulo: 'Mostrar resultado da sala', acao: () => void irPara('distribuicao') }
    if (passo === 'distribuicao') principal = { rotulo: 'Avaliar outro processo', acao: () => void irPara('ranking_processos') }
  }

  const telaCheia = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen().catch(() => undefined)
  }
  const encerrar = () => {
    if (window.confirm('Encerrar a sala? Ninguém mais poderá entrar ou responder.')) {
      void agir(() => workshopAdminApi.close(roomId))
    }
  }
  const remover = (id: number, apelido: string) => {
    if (window.confirm(`Remover ${apelido} da sala?`)) {
      void agir(() => workshopAdminApi.removeParticipant(roomId, id))
    }
  }

  return (
    <div className="ws-telao">
      <header className="ws-telao-topo">
        <span className="ws-telao-marca">
          <LogoSymbol size={30} />
          <Wordmark />
        </span>
        <span className="ws-telao-sala">{room.name}</span>
        <ol className="ws-trilha">
          {ORDEM.map((s, i) => (
            <li key={s} className={i === indice ? 'atual' : i < indice ? 'feito' : ''}>
              {ROTULO[s]}
            </li>
          ))}
        </ol>
        {passo !== 'entrada' && qr && !encerrada && (
          <span className="ws-mini-qr" title="Quem chegou agora ainda pode entrar">
            <img src={qr} alt="" />
            <span>
              Entre pelo QR
              <b>{room.code}</b>
            </span>
          </span>
        )}
        <span className="ws-contador-topo">
          <b>{participants.total}</b> na sala
        </span>
      </header>

      <main className="ws-telao-palco">
        {encerrada ? (
          <div className="ws-centro">
            <h1>Workshop encerrado</h1>
            <p>Obrigado pela participação!</p>
            {assessment && assessment.finished > 0 && (
              <Distribuicao assessment={assessment} processo={room.process?.name ?? ''} />
            )}
          </div>
        ) : passo === 'entrada' ? (
          <div className="ws-entrada">
            <div className="ws-qr">
              {qr && <img src={qr} alt={`QR code para entrar: ${link}`} />}
              <div className="ws-qr-legenda">
                Aponte a câmera do celular
                <span className="ws-link">{link.replace(/^https?:\/\//, '')}</span>
              </div>
            </div>
            <div className="ws-entrada-lado">
              <div className="ws-numero">
                <b>{participants.total}</b>
                <span>{participants.total === 1 ? 'pessoa na sala' : 'pessoas na sala'}</span>
              </div>
              <div className="ws-apelidos">
                {[...participants.list]
                  .reverse()
                  .slice(0, 72)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="ws-chip-apelido"
                      title="Clique para remover da sala"
                      onClick={() => remover(p.id, p.nickname)}
                    >
                      {p.nickname}
                    </button>
                  ))}
                {participants.total > 72 && <span className="ws-chip-mais">+{participants.total - 72}</span>}
              </div>
            </div>
          </div>
        ) : passo === 'objetivos' ? (
          <div className="ws-centro">
            <h1>O que o seu centro mais quer alcançar?</h1>
            <p>Escolha até {room.maxObjectives} objetivos estratégicos no seu celular.</p>
            <Progresso feito={objectives.respondents} total={participants.total} rotulo="responderam" />
          </div>
        ) : passo === 'ranking_objetivos' ? (
          <div className="ws-ranking">
            <h1>Objetivos da plateia</h1>
            <p className="ws-sub">
              {objectives.respondents} {objectives.respondents === 1 ? 'pessoa respondeu' : 'pessoas responderam'}
            </p>
            <Barras
              itens={objectives.ranking
                .filter((o) => o.votes > 0)
                .slice(0, 7)
                .map((o) => ({
                  id: o.id,
                  titulo: o.name,
                  sub: o.theme,
                  valor: o.votes,
                  rotuloValor: `${o.votes} ${o.votes === 1 ? 'voto' : 'votos'}`,
                }))}
              vazio="Ninguém votou ainda."
            />
          </div>
        ) : passo === 'ranking_processos' ? (
          <div className="ws-ranking">
            <h1>Processos prioritários para esta plateia</h1>
            <p className="ws-sub">
              Calculado pela ligação entre os objetivos votados e os processos — clique em um processo para ver o detalhe.
            </p>
            <Barras
              itens={processes
                .filter((p) => p.points > 0)
                .slice(0, 7)
                .map((p) => ({
                  id: p.id,
                  titulo: `${p.code ?? ''} ${p.name}`.trim(),
                  sub: p.drivers.length
                    ? `Ligado a: ${p.drivers.map((d) => d.name).join(' · ')}`
                    : '',
                  valor: p.points,
                  rotuloValor: String(p.score),
                }))}
              vazio="Sem votos de objetivos ainda — todos os processos estão empatados."
              onClick={setDetalhe}
            />
            {processes.every((p) => p.points === 0) && (
              <div className="ws-lista-processos">
                {processes.map((p) => (
                  <button key={p.id} type="button" className="secundario" onClick={() => setDetalhe(p.id)}>
                    {p.code} {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : passo === 'avaliacao' ? (
          <div className="ws-centro">
            <span className="ws-sub">Processo em avaliação</span>
            <h1>
              {room.process?.code && <span className="mono">{room.process.code} </span>}
              {room.process?.name}
            </h1>
            <p>No celular: marque os artefatos que o seu centro já possui.</p>
            <Progresso feito={assessment?.finished ?? 0} total={participants.total} rotulo="finalizaram" />
          </div>
        ) : (
          <div className="ws-centro">
            {assessment && <Distribuicao assessment={assessment} processo={room.process?.name ?? ''} />}
          </div>
        )}
      </main>

      <footer className="ws-telao-controles">
        <Link to="/workshops" className="ws-sair">
          ← Salas
        </Link>
        {anterior && !encerrada && (
          <button type="button" className="ghost" disabled={ocupado} onClick={() => void irPara(anterior)}>
            ← Voltar
          </button>
        )}
        <span className="ws-status">
          {erro ? <span className="erro">{erro}</span> : !conectado ? 'Reconectando…' : ''}
        </span>
        <button type="button" className="ghost" onClick={telaCheia}>
          Tela cheia
        </button>
        {!encerrada && (
          <button type="button" className="ghost" disabled={ocupado} onClick={encerrar}>
            Encerrar sala
          </button>
        )}
        {principal && (
          <button type="button" className="ws-principal" disabled={ocupado} onClick={principal.acao}>
            {principal.rotulo} →
          </button>
        )}
      </footer>

      {detalhe != null && (
        <DetalheProcesso
          roomId={roomId}
          processId={detalhe}
          podeEnviar={!encerrada && (processes.find((p) => p.id === detalhe)?.published ?? false)}
          ocupado={ocupado}
          onFechar={() => setDetalhe(null)}
          onEnviar={() => {
            const id = detalhe
            setDetalhe(null)
            void agir(() => workshopAdminApi.setProcess(roomId, id))
          }}
        />
      )}
    </div>
  )
}

function Progresso({ feito, total, rotulo }: { feito: number; total: number; rotulo: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((feito / total) * 100)) : 0
  return (
    <div className="ws-progresso">
      <div className="ws-numero">
        <b>{feito}</b>
        <span>
          de {total} {rotulo}
        </span>
      </div>
      <div className="ws-barra-grande">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

interface ItemBarra {
  id: number
  titulo: string
  sub: string
  valor: number
  rotuloValor: string
}
function Barras({
  itens,
  vazio,
  onClick,
}: {
  itens: ItemBarra[]
  vazio: string
  onClick?: (id: number) => void
}) {
  const max = Math.max(1, ...itens.map((i) => i.valor))
  if (itens.length === 0) return <p className="ws-vazio">{vazio}</p>
  return (
    <ol className="ws-barras">
      {itens.map((i, posicao) => {
        const conteudo = (
          <>
            <span className="ws-pos">{posicao + 1}</span>
            <span className="ws-barra-texto">
              <span className="ws-barra-titulo">{i.titulo}</span>
              {i.sub && <span className="ws-barra-sub">{i.sub}</span>}
              <span className="ws-barra-trilho">
                <span style={{ width: `${(i.valor / max) * 100}%` }} />
              </span>
            </span>
            <span className="ws-barra-valor">{i.rotuloValor}</span>
          </>
        )
        return (
          <li key={i.id}>
            {onClick ? (
              <button type="button" className="ws-barra-item clicavel" onClick={() => onClick(i.id)}>
                {conteudo}
              </button>
            ) : (
              <div className="ws-barra-item">{conteudo}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

const NOME_NIVEL = ['Inicial', 'Informal', 'Definido', 'Gerenciado', 'Otimizado']

function Distribuicao({
  assessment,
  processo,
}: {
  assessment: NonNullable<Snapshot['assessment']>
  processo: string
}) {
  const max = Math.max(1, ...assessment.distribution)
  const nome = (n: number) => assessment.levels.find((l) => l.number === n)?.name ?? NOME_NIVEL[n - 1]
  return (
    <div className="ws-distribuicao">
      <span className="ws-sub">{processo}</span>
      <h1>Onde está a maturidade desta sala</h1>
      <div className="ws-colunas">
        {assessment.distribution.map((qtd, i) => {
          const pct = assessment.finished > 0 ? Math.round((qtd / assessment.finished) * 100) : 0
          return (
            <div key={i} className="ws-coluna">
              <span className="ws-coluna-valor">
                <b>{qtd}</b>
                <small>{pct}%</small>
              </span>
              <span className="ws-coluna-trilho">
                <span
                  style={{ height: `${(qtd / max) * 100}%`, background: `var(--nivel-${i + 1})` }}
                />
              </span>
              <span className="ws-coluna-rotulo">
                <b>Nível {i + 1}</b>
                {nome(i + 1)}
              </span>
            </div>
          )
        })}
      </div>
      <p className="ws-sub">
        {assessment.finished} {assessment.finished === 1 ? 'centro avaliado' : 'centros avaliados'} ·
        autodeclarado, não é certificação
      </p>
    </div>
  )
}

function DetalheProcesso({
  roomId,
  processId,
  podeEnviar,
  ocupado,
  onFechar,
  onEnviar,
}: {
  roomId: number
  processId: number
  podeEnviar: boolean
  ocupado: boolean
  onFechar: () => void
  onEnviar: () => void
}) {
  const { data, error } = useQuery({
    queryKey: ['workshop-processo', roomId, processId],
    queryFn: () => workshopAdminApi.processDetail(roomId, processId),
    retry: false,
  })
  const niveis = useMemo(
    () =>
      (data?.levels ?? [])
        .map((l) => ({ ...l, artefatos: (data?.artifacts ?? []).filter((a) => a.level === l.number) }))
        .filter((l) => l.artefatos.length > 0),
    [data],
  )

  return (
    <div className="ws-overlay" onClick={onFechar}>
      <div className="ws-detalhe" onClick={(e) => e.stopPropagation()}>
        <div className="ws-detalhe-topo">
          <div>
            <h1>
              {data?.process.code && <span className="mono">{data.process.code} </span>}
              {data?.process.name ?? (error ? 'Conteúdo indisponível' : 'Carregando…')}
            </h1>
            {data?.process.objectiveText && <p className="apoio">{data.process.objectiveText}</p>}
          </div>
          <div className="linha-acoes">
            <button type="button" className="ghost" onClick={onFechar}>
              Fechar
            </button>
            <button type="button" disabled={!podeEnviar || ocupado || !data} onClick={onEnviar}>
              Enviar para os celulares →
            </button>
          </div>
        </div>
        {error && <p className="erro">Este processo ainda não tem conteúdo publicado.</p>}
        {data && (
          <div className="ws-detalhe-corpo pilha">
            {data.guide && (
              <div className="porque-importa-cartao">
                <h2 style={{ margin: 0 }}>Por que este processo importa</h2>
                {data.guide.purposeMd.split(/\n\n+/).map((paragrafo, i) => (
                  <p key={i}>{paragrafo}</p>
                ))}
              </div>
            )}
            {data.guide && (data.guide.flow.inputs.length > 0 || data.guide.flow.activities.length > 0) && (
              <SecaoColapsavel titulo="Como o processo funciona" aberta>
                <div className="fluxo-colunas">
                  <div>
                    <h4>Entradas</h4>
                    {data.guide.flow.inputs.map((c) => (
                      <span key={c} className="chip">{c}</span>
                    ))}
                  </div>
                  <div>
                    <h4>Atividades</h4>
                    {data.guide.flow.activities.map((c) => (
                      <span key={c} className="chip atividade">{c}</span>
                    ))}
                  </div>
                  <div>
                    <h4>Saídas</h4>
                    {data.guide.flow.outputs.map((c) => (
                      <span key={c} className="chip saida">{c}</span>
                    ))}
                  </div>
                </div>
              </SecaoColapsavel>
            )}
            {niveis.map((nivel) => (
              <section key={nivel.number} className="cartao secao-nivel">
                <div className="cabecalho">
                  <LevelBadge level={nivel.number} />
                  <span className="apoio">{nivel.artefatos.length} artefatos</span>
                </div>
                {nivel.artefatos.map((a) => (
                  <div key={a.id} className="artefato">
                    <ClassMark classification={a.classification} />
                    <div className="info">
                      <div className="titulo">
                        {a.title}
                        {(a.seals ?? []).map((s) => (
                          <SealBadge key={s} code={s} />
                        ))}
                        {a.conditional && <span className="tag-compartilhado">se aplicável</span>}
                      </div>
                      <p className="dod">{a.dodText}</p>
                      {a.whyItMatters && (
                        <p className="porque-importa">
                          <b>Por que importa:</b> {a.whyItMatters}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            ))}
            {data.guide && data.guide.risks.length > 0 && (
              <SecaoColapsavel titulo="Riscos da execução inadequada">
                <ul className="lista-riscos">
                  {data.guide.risks.map((risco, i) => (
                    <li key={i}>{risco}</li>
                  ))}
                </ul>
              </SecaoColapsavel>
            )}
            {data.guide && data.guide.practices.length > 0 && (
              <SecaoColapsavel titulo="Boas práticas recomendadas">
                <div className="grade-praticas">
                  {data.guide.practices.map((pratica, i) => (
                    <div key={i} className="mini-cartao">
                      <b>{pratica.title}</b>
                      <span>{pratica.text}</span>
                    </div>
                  ))}
                </div>
              </SecaoColapsavel>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
