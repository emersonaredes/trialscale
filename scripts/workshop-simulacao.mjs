#!/usr/bin/env node
/**
 * Simulador de plateia do Workshop ao vivo (spec 006 — CA-8, ensaio).
 * Cria N "celulares" que entram na sala, ficam ouvindo o servidor (SSE) e
 * reagem aos passos conduzidos no telão: votam objetivos e fazem a
 * autoavaliação do processo enviado. Sem dependências (Node 20+).
 *
 * Uso:
 *   node scripts/workshop-simulacao.mjs <URL> <CODIGO_DA_SALA> [N=200] [ESPERA_MAX_S=8]
 * Ex.:
 *   node scripts/workshop-simulacao.mjs http://localhost:3333 QY9UZY 200
 *
 * Abra o telão no navegador e avance os passos: os robôs respondem sozinhos.
 * Ctrl+C encerra e imprime as latências medidas.
 */
const [base, code, nArg, esperaArg] = process.argv.slice(2)
if (!base || !code) {
  console.error('Uso: node scripts/workshop-simulacao.mjs <URL> <CODIGO> [N=200] [ESPERA_MAX_S=8]')
  process.exit(1)
}
const N = Number(nArg ?? 200)
const ESPERA_MAX_MS = Number(esperaArg ?? 8) * 1000
const api = `${base.replace(/\/$/, '')}/api/w/${code}`

const tempos = { join: [], votes: [], process: [], assessment: [] }
const erros = {}
let conectados = 0

const dormir = (ms) => new Promise((r) => setTimeout(r, ms))
const sorteio = (n) => Math.floor(Math.random() * n)

async function chamar(tipo, path, token, init = {}) {
  const t0 = performance.now()
  const res = await fetch(api + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const corpo = await res.json().catch(() => ({}))
  tempos[tipo].push(performance.now() - t0)
  if (!res.ok) {
    erros[`${tipo}:${res.status}`] = (erros[`${tipo}:${res.status}`] ?? 0) + 1
    throw new Error(`${tipo} ${res.status}`)
  }
  return corpo
}

async function robo() {
  const { token } = await chamar('join', '/join', null, { method: 'POST' })
  const estado = { passo: null, processo: null, votou: false, avaliou: null }
  // "Perfil" do centro fictício: até que nível ele costuma ter os artefatos.
  const perfil = [1, 2, 2, 3, 3, 3, 4, 4, 5][sorteio(9)]

  async function reagir(room) {
    if (room.status !== 'aberta') return
    if (room.step === 'objetivos' && !estado.votou) {
      estado.votou = true
      await dormir(sorteio(ESPERA_MAX_MS))
      const { themes } = await fetch(`${api}/objectives`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json())
      const todos = themes.flatMap((t) => t.items.map((o) => o.id))
      // Preferência enviesada (os primeiros objetivos são mais "populares").
      const escolha = new Set()
      const quantos = 1 + sorteio(3)
      while (escolha.size < quantos) escolha.add(todos[Math.floor(Math.random() ** 2 * todos.length)])
      await chamar('votes', '/votes', token, {
        method: 'PUT',
        body: JSON.stringify({ objectiveIds: [...escolha] }),
      }).catch(() => {
        estado.votou = false
      })
    }
    if (room.step !== 'objetivos') estado.votou = false
    if (room.step === 'avaliacao' && room.process && estado.avaliou !== room.process.id) {
      estado.avaliou = room.process.id
      await dormir(sorteio(ESPERA_MAX_MS))
      const proc = await chamar('process', '/process', token)
      const possui = proc.artifacts
        .filter((a) => a.level <= perfil && Math.random() < 0.9)
        .map((a) => a.id)
      const na = proc.artifacts
        .filter((a) => a.conditional && !possui.includes(a.id) && Math.random() < 0.5)
        .map((a) => a.id)
      await chamar('assessment', '/assessment', token, {
        method: 'PUT',
        body: JSON.stringify({ artifactIds: possui, notApplicableIds: na }),
      }).catch(() => {
        estado.avaliou = null
      })
    }
  }

  // Stream SSE com reconexão simples.
  for (;;) {
    try {
      const res = await fetch(`${api}/events`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error(`events ${res.status}`)
      conectados += 1
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let fim
        while ((fim = buffer.indexOf('\n\n')) >= 0) {
          const bloco = buffer.slice(0, fim)
          buffer = buffer.slice(fim + 2)
          const dados = bloco.split('\n').find((l) => l.startsWith('data:'))
          if (bloco.includes('event: room') && dados) {
            void reagir(JSON.parse(dados.slice(5))).catch(() => undefined)
          }
          if (bloco.includes('event: removed')) return
        }
      }
      conectados -= 1
    } catch {
      erros.stream = (erros.stream ?? 0) + 1
    }
    await dormir(1000)
  }
}

function resumo() {
  const linha = (nome, v) => {
    if (v.length === 0) return `${nome.padEnd(11)} —`
    const o = [...v].sort((a, b) => a - b)
    const p = (q) => Math.round(o[Math.min(o.length - 1, Math.floor(q * o.length))])
    return `${nome.padEnd(11)} n=${String(v.length).padStart(4)}  p50=${p(0.5)}ms  p95=${p(0.95)}ms  máx=${p(1)}ms`
  }
  console.log(`\n— ${conectados}/${N} celulares conectados —`)
  for (const [nome, v] of Object.entries(tempos)) console.log(linha(nome, v))
  if (Object.keys(erros).length) console.log('erros:', erros)
}

console.log(`Simulando ${N} celulares na sala ${code} (${base})…`)
// Entrada escalonada em ~5 s, como uma plateia lendo o QR.
for (let i = 0; i < N; i++) {
  setTimeout(() => void robo().catch((e) => console.error(`robô ${i}:`, e.message)), sorteio(5000))
}
const timer = setInterval(resumo, 10_000)
process.on('SIGINT', () => {
  clearInterval(timer)
  resumo()
  process.exit(0)
})
