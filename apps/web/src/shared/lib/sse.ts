/**
 * Cliente de Server-Sent Events via fetch (o EventSource nativo não envia o
 * header Authorization). Reconecta sozinho com espera crescente e reabre se
 * o servidor ficar mudo (o servidor manda um "ping" a cada 20 s).
 */
export interface StreamHandle {
  close: () => void
}

interface StreamOptions {
  /** Montado a cada tentativa — pega sempre o token mais recente. */
  headers: () => Record<string, string>
  onEvent: (event: string, data: unknown) => void
  /** true = conectado; false = tentando reconectar. */
  onStatus?: (conectado: boolean) => void
  /** 401/403/404: o chamador decide (ex.: entrar de novo na sala). Devolver
   *  false encerra as tentativas. */
  onDenied?: (status: number) => boolean
}

const SILENCIO_MAXIMO_MS = 45_000

export function openStream(url: string, options: StreamOptions): StreamHandle {
  let fechado = false
  let tentativa = 0
  let controller: AbortController | null = null
  let espera: ReturnType<typeof setTimeout> | null = null

  const agendar = () => {
    if (fechado) return
    options.onStatus?.(false)
    const ms = Math.min(500 * 2 ** tentativa, 5000)
    tentativa += 1
    espera = setTimeout(() => void conectar(), ms)
  }

  async function conectar(): Promise<void> {
    if (fechado) return
    controller = new AbortController()
    let vigia: ReturnType<typeof setTimeout> | null = null
    const armarVigia = () => {
      if (vigia) clearTimeout(vigia)
      vigia = setTimeout(() => controller?.abort(), SILENCIO_MAXIMO_MS)
    }
    try {
      const res = await fetch(url, {
        headers: { Accept: 'text/event-stream', ...options.headers() },
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'same-origin',
      })
      if (!res.ok || !res.body) {
        if ([401, 403, 404].includes(res.status) && options.onDenied && !options.onDenied(res.status)) {
          fechado = true
          return
        }
        throw new Error(`stream ${res.status}`)
      }
      tentativa = 0
      options.onStatus?.(true)
      armarVigia()

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        armarVigia()
        buffer += decoder.decode(value, { stream: true })
        let fim: number
        while ((fim = buffer.indexOf('\n\n')) >= 0) {
          const bloco = buffer.slice(0, fim)
          buffer = buffer.slice(fim + 2)
          let evento = 'message'
          const dados: string[] = []
          for (const linha of bloco.split('\n')) {
            if (linha.startsWith('event:')) evento = linha.slice(6).trim()
            else if (linha.startsWith('data:')) dados.push(linha.slice(5).trim())
          }
          if (dados.length === 0) continue
          try {
            options.onEvent(evento, JSON.parse(dados.join('\n')))
          } catch {
            // bloco malformado: ignora e segue no stream
          }
        }
      }
    } catch {
      // queda de rede/abort: reconecta abaixo
    } finally {
      if (vigia) clearTimeout(vigia)
    }
    agendar()
  }

  // Celular voltou do bloqueio de tela / trocou de rede: reconecta já.
  const aoVoltar = () => {
    if (fechado || document.visibilityState !== 'visible') return
    if (espera) {
      clearTimeout(espera)
      espera = null
      tentativa = 0
      void conectar()
    }
  }
  document.addEventListener('visibilitychange', aoVoltar)
  window.addEventListener('online', aoVoltar)

  void conectar()

  return {
    close() {
      fechado = true
      if (espera) clearTimeout(espera)
      controller?.abort()
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('online', aoVoltar)
    },
  }
}
