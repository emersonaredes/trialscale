import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../../shared/lib/api-client'
import { openStream } from '../../shared/lib/sse'
import { LogoSymbol, Wordmark } from '../../shared/components/Logo'
import {
  workshopPlayApi,
  type LevelResult,
  type PlayerProcess,
  type PublicRoom,
} from './api'

/**
 * Tela do PARTICIPANTE (celular) do Workshop ao vivo — rota pública /w/:code.
 * Sem conta e sem digitar nada: ao abrir o link do QR o sistema sorteia um
 * identificador ("Tucano 42") e guarda o token da sala neste aparelho.
 */

interface Credencial {
  token: string
  nickname: string
}
const chave = (code: string) => `trialscale-workshop-${code}`

function lerCredencial(code: string): Credencial | null {
  try {
    const bruto = localStorage.getItem(chave(code))
    return bruto ? (JSON.parse(bruto) as Credencial) : null
  } catch {
    return null
  }
}
function guardarCredencial(code: string, c: Credencial | null): void {
  try {
    if (c) localStorage.setItem(chave(code), JSON.stringify(c))
    else localStorage.removeItem(chave(code))
  } catch {
    // navegação privada sem storage: segue só em memória
  }
}

// Uma entrada por sala, mesmo que o efeito rode duas vezes (StrictMode).
const entradas = new Map<string, Promise<Credencial & { room: PublicRoom }>>()
function entrar(code: string) {
  let p = entradas.get(code)
  if (!p) {
    p = workshopPlayApi.join(code)
    entradas.set(code, p)
    p.catch(() => entradas.delete(code))
  }
  return p
}

type Sessao =
  | { cred: Credencial; room: PublicRoom; votes: number[]; result: LevelResult | null }
  | { erro: string }

/** Retoma a participação guardada neste aparelho ou entra na sala. */
async function carregarSessao(code: string): Promise<Sessao> {
  const falha = (e: unknown): Sessao => ({
    erro: e instanceof ApiError ? e.message : 'Sem conexão. Tentando de novo…',
  })
  const salva = lerCredencial(code)
  if (salva) {
    try {
      const estado = await workshopPlayApi.state(code, salva.token)
      return { cred: salva, room: estado.room, votes: estado.votes, result: estado.result }
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 401) return falha(e)
      guardarCredencial(code, null) // token antigo: entra de novo
    }
  }
  try {
    const nova = await entrar(code)
    const cred = { token: nova.token, nickname: nova.nickname }
    guardarCredencial(code, cred)
    return { cred, room: nova.room, votes: [], result: null }
  } catch (e) {
    return falha(e)
  }
}

export function PlayPage() {
  const code = (useParams().code ?? '').toUpperCase()
  const [cred, setCred] = useState<Credencial | null>(null)
  const [room, setRoom] = useState<PublicRoom | null>(null)
  const [votes, setVotes] = useState<number[]>([])
  const [result, setResult] = useState<LevelResult | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [removido, setRemovido] = useState(false)
  const [conectado, setConectado] = useState(true)

  // ---- entrada / retomada (tenta de novo sozinho se a rede falhar) ----------
  useEffect(() => {
    let vivo = true
    let espera: ReturnType<typeof setTimeout> | null = null
    const tentar = () => {
      void carregarSessao(code).then((r) => {
        if (!vivo) return
        if ('erro' in r) {
          setErro(r.erro)
          espera = setTimeout(tentar, 3000)
          return
        }
        setErro(null)
        setCred(r.cred)
        setRoom(r.room)
        setVotes(r.votes)
        setResult(r.result)
      })
    }
    tentar()
    return () => {
      vivo = false
      if (espera) clearTimeout(espera)
    }
  }, [code])

  // ---- tempo real: o apresentador muda o passo e o celular acompanha --------
  useEffect(() => {
    if (!cred) return
    const stream = openStream(`/api/w/${code}/events`, {
      headers: () => ({ Authorization: `Bearer ${cred.token}` }),
      onStatus: setConectado,
      onDenied: () => {
        setRemovido(true)
        return false
      },
      onEvent: (evento, dados) => {
        if (evento === 'room') setRoom(dados as PublicRoom)
        if (evento === 'removed') setRemovido(true)
      },
    })
    return () => stream.close()
  }, [cred, code])

  // ---- telas ----------------------------------------------------------------
  let corpo: React.ReactNode
  if (removido) {
    corpo = <Mensagem titulo="Você saiu da sala" texto="O apresentador encerrou a sua participação." />
  } else if (!cred || !room) {
    corpo = (
      <Mensagem
        titulo={erro ? 'Não deu para entrar' : 'Entrando na sala…'}
        texto={erro ?? 'Só um instante.'}
      />
    )
  } else if (room.status === 'encerrada') {
    corpo = (
      <>
        <Mensagem titulo="Workshop encerrado" texto="Obrigado por participar!" />
        {result && result.processId === room.process?.id && (
          <Resultado result={result} processo={room.process?.name ?? ''} />
        )}
      </>
    )
  } else if (room.step === 'entrada') {
    corpo = (
      <div className="ws-play-centro">
        <span className="apoio">Você entrou como</span>
        <div className="ws-apelido">{cred.nickname}</div>
        <p>Procure o seu nome no telão. Já vamos começar!</p>
      </div>
    )
  } else if (room.step === 'objetivos') {
    corpo = <Objetivos code={code} token={cred.token} votes={votes} onSaved={setVotes} max={room.maxObjectives} />
  } else if (room.step === 'ranking_objetivos' || room.step === 'ranking_processos') {
    corpo = (
      <Mensagem
        titulo="Olhe para o telão 👀"
        texto={
          votes.length > 0
            ? 'Suas escolhas entraram no resultado da sala.'
            : 'A votação de objetivos foi encerrada.'
        }
      />
    )
  } else if (result && result.processId === room.process?.id) {
    corpo = (
      <Resultado
        result={result}
        processo={room.process?.name ?? ''}
        onRevisar={() => setResult(null)}
      />
    )
  } else {
    corpo = (
      <Avaliacao
        key={room.process?.id ?? 0}
        code={code}
        token={cred.token}
        onResult={setResult}
      />
    )
  }

  return (
    <div className="ws-play">
      <header className="ws-play-topo">
        <span className="ws-play-marca">
          <LogoSymbol size={20} />
          <Wordmark />
        </span>
        {cred && <span className="ws-play-eu">{cred.nickname}</span>}
      </header>
      {room && <div className="ws-play-sala">{room.name}</div>}
      {!conectado && cred && <div className="ws-play-offline">Reconectando…</div>}
      <main className="ws-play-corpo">{corpo}</main>
      <footer className="ws-play-rodape">
        Demonstração com respostas anônimas e autodeclaradas — não é certificação. Não informe
        dados que identifiquem pessoas ou o seu centro.
      </footer>
    </div>
  )
}

function Mensagem({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="ws-play-centro">
      <h1>{titulo}</h1>
      <p>{texto}</p>
    </div>
  )
}

// ------------------------------------------------------------------ passo 2
function Objetivos({
  code,
  token,
  votes,
  onSaved,
  max,
}: {
  code: string
  token: string
  votes: number[]
  onSaved: (v: number[]) => void
  max: number
}) {
  const [temas, setTemas] = useState<Array<{ theme: string; items: Array<{ id: number; name: string }> }> | null>(null)
  const [sel, setSel] = useState<number[]>(votes)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(votes.length > 0)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    const carregar = () =>
      workshopPlayApi
        .objectives(code, token)
        .then((r) => vivo && setTemas(r.themes))
        .catch(() => vivo && setTimeout(carregar, 2000))
    void carregar()
    return () => {
      vivo = false
    }
  }, [code, token])

  const alternar = (id: number) => {
    setEnviado(false)
    setSel((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : atual.length < max ? [...atual, id] : atual,
    )
  }

  const enviar = async () => {
    setEnviando(true)
    setErro(null)
    try {
      const r = await workshopPlayApi.saveVotes(code, token, sel)
      onSaved(r.votes)
      setEnviado(true)
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Sem conexão. Toque em enviar de novo.')
    } finally {
      setEnviando(false)
    }
  }

  if (!temas) return <Mensagem titulo="Carregando objetivos…" texto="Só um instante." />

  return (
    <>
      <div className="ws-play-intro">
        <h1>O que o seu centro mais quer alcançar?</h1>
        <p>
          Escolha <b>até {max}</b> objetivos estratégicos.
        </p>
      </div>
      {temas.map((t) => (
        <section key={t.theme} className="ws-tema">
          <h2>{t.theme}</h2>
          {t.items.map((o) => {
            const marcado = sel.includes(o.id)
            const travado = !marcado && sel.length >= max
            return (
              <button
                key={o.id}
                type="button"
                className={`ws-opcao ${marcado ? 'marcada' : ''}`}
                disabled={travado}
                aria-pressed={marcado}
                onClick={() => alternar(o.id)}
              >
                <span className="ws-check">{marcado ? '✓' : ''}</span>
                <span>{o.name}</span>
              </button>
            )
          })}
        </section>
      ))}
      <div className="ws-play-acao">
        {erro && <div className="erro">{erro}</div>}
        {enviado ? (
          <div className="ws-enviado">
            ✓ Respostas enviadas. Você pode mudar enquanto a votação estiver aberta.
          </div>
        ) : (
          <button type="button" disabled={sel.length === 0 || enviando} onClick={() => void enviar()}>
            {enviando ? 'Enviando…' : `Enviar (${sel.length}/${max})`}
          </button>
        )}
      </div>
    </>
  )
}

// ------------------------------------------------------------------ passo 6
function Avaliacao({
  code,
  token,
  onResult,
}: {
  code: string
  token: string
  onResult: (r: LevelResult) => void
}) {
  const [dados, setDados] = useState<PlayerProcess | null>(null)
  const [possui, setPossui] = useState<Set<number>>(new Set())
  const [naoAplica, setNaoAplica] = useState<Set<number>>(new Set())
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    const carregar = () =>
      workshopPlayApi
        .process(code, token)
        .then((r) => {
          if (!vivo) return
          setDados(r)
          if (r.mine) {
            setPossui(new Set(r.mine.artifactIds))
            setNaoAplica(new Set(r.mine.notApplicableIds))
          }
        })
        .catch(() => vivo && setTimeout(carregar, 2000))
    void carregar()
    return () => {
      vivo = false
    }
  }, [code, token])

  const niveis = useMemo(() => {
    if (!dados) return []
    return dados.levels
      .filter((l) => l.number >= 2)
      .map((l) => ({ ...l, artefatos: dados.artifacts.filter((a) => a.level === l.number) }))
      .filter((l) => l.artefatos.length > 0)
  }, [dados])

  const alternar = (id: number, alvo: 'possui' | 'na') => {
    const [mexe, setMexe, outro, setOutro] =
      alvo === 'possui'
        ? [possui, setPossui, naoAplica, setNaoAplica]
        : [naoAplica, setNaoAplica, possui, setPossui]
    const novo = new Set(mexe)
    if (novo.has(id)) novo.delete(id)
    else {
      novo.add(id)
      if (outro.has(id)) {
        const o = new Set(outro)
        o.delete(id)
        setOutro(o)
      }
    }
    setMexe(novo)
  }

  const finalizar = async () => {
    setEnviando(true)
    setErro(null)
    try {
      onResult(await workshopPlayApi.saveAssessment(code, token, [...possui], [...naoAplica]))
      window.scrollTo({ top: 0 })
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Sem conexão. Toque em finalizar de novo.')
    } finally {
      setEnviando(false)
    }
  }

  if (!dados) return <Mensagem titulo="Carregando o processo…" texto="Só um instante." />

  return (
    <>
      <div className="ws-play-intro">
        <span className="apoio">Processo</span>
        <h1>
          {dados.process.code && <span className="mono">{dados.process.code} </span>}
          {dados.process.name}
        </h1>
        {dados.process.oneLine && <p>{dados.process.oneLine}</p>}
        <p>
          Marque o que o seu centro <b>já possui hoje</b>. Os itens com{' '}
          <span className="ws-essencial-tag">essencial</span> definem o nível.
        </p>
      </div>
      {niveis.map((n) => (
        <section key={n.number} className="ws-tema">
          <h2>
            <span className={`nivel nivel-${n.number}`}>
              <b>{n.number}</b> {n.name}
            </span>
          </h2>
          {n.artefatos.map((a) => {
            const tem = possui.has(a.id)
            const na = naoAplica.has(a.id)
            return (
              <div key={a.id} className={`ws-artefato ${tem ? 'marcada' : ''} ${na ? 'na' : ''}`}>
                <button
                  type="button"
                  className="ws-artefato-toque"
                  aria-pressed={tem}
                  onClick={() => alternar(a.id, 'possui')}
                >
                  <span className="ws-check">{tem ? '✓' : ''}</span>
                  <span className="ws-artefato-texto">
                    <span className="ws-artefato-titulo">
                      {a.title}
                      {a.classification === 'essencial' && (
                        <span className="ws-essencial-tag">essencial</span>
                      )}
                    </span>
                    <span className="ws-artefato-dod">{a.dodText}</span>
                  </span>
                </button>
                {a.conditional && (
                  <button
                    type="button"
                    className={`ws-na ${na ? 'ativo' : ''}`}
                    aria-pressed={na}
                    onClick={() => alternar(a.id, 'na')}
                  >
                    {na ? '✓ ' : ''}Não se aplica ao meu centro
                    {a.conditionLabel ? ` — ${a.conditionLabel.toLowerCase()}` : ''}
                  </button>
                )}
              </div>
            )
          })}
        </section>
      ))}
      <div className="ws-play-acao">
        {erro && <div className="erro">{erro}</div>}
        <button type="button" disabled={enviando} onClick={() => void finalizar()}>
          {enviando ? 'Calculando…' : 'Finalizar e ver meu nível'}
        </button>
      </div>
    </>
  )
}

// ------------------------------------------------------------------ passo 7
function Resultado({
  result,
  processo,
  onRevisar,
}: {
  result: LevelResult
  processo: string
  onRevisar?: () => void
}) {
  return (
    <div className="ws-resultado">
      <span className="apoio">{processo}</span>
      <div className="ws-resultado-cartao">
        <span>Seu centro está no</span>
        <div className="ws-resultado-nivel">Nível {result.level}</div>
        <div className="ws-resultado-nome">{result.levelName}</div>
      </div>
      <p className="apoio">
        {result.essentialsDone} de {result.essentialsTotal} artefatos essenciais
      </p>
      {result.nextLevel ? (
        <div className="cartao">
          <h2>
            Para chegar ao nível {result.nextLevel.number} — {result.nextLevel.name}
          </h2>
          <ul className="ws-faltam">
            {result.missing.map((m) => (
              <li key={m.id}>{m.title}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="cartao">
          <h2>Topo da escala 🎉</h2>
          <p>Todos os artefatos essenciais deste processo estão em dia.</p>
        </div>
      )}
      <p className="apoio">Agora olhe para o telão: vem aí o resultado da sala.</p>
      {onRevisar && (
        <button type="button" className="secundario" onClick={onRevisar}>
          Revisar minhas respostas
        </button>
      )}
    </div>
  )
}
