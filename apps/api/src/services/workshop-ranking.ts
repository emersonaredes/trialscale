/**
 * Cálculos PUROS do Workshop ao vivo (spec 006, RN-1 e RN-2) — sem banco,
 * testáveis isoladamente.
 */
export interface RankedObjective {
  id: number
  theme: string
  name: string
  votes: number
}

/** RN-1: votos por objetivo = nº de participantes que o escolheram. */
export function rankObjectives(
  objectives: Array<{ id: number; theme: string; name: string }>,
  votes: Array<{ objectiveId: number }>,
): RankedObjective[] {
  const contagem = new Map<number, number>()
  for (const v of votes) contagem.set(v.objectiveId, (contagem.get(v.objectiveId) ?? 0) + 1)
  return objectives
    .map((o) => ({ ...o, votes: contagem.get(o.id) ?? 0 }))
    .sort((a, b) => b.votes - a.votes || a.id - b.id)
}

/** Ordenação natural de códigos ('1.2' < '1.10' < '2.1' < '10'). */
export function compareCodes(a: string | null, b: string | null): number {
  const pa = (a ?? '').split('.').map(Number)
  const pb = (b ?? '').split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0 && !Number.isNaN(d)) return d
  }
  return (a ?? '').localeCompare(b ?? '')
}

export interface RankedProcess<P> {
  process: P
  points: number
  /** 0–100, relativo ao processo mais pontuado da sala. */
  score: number
  /** Objetivos VOTADOS ligados ao processo, do maior para o menor peso×votos. */
  drivers: Array<{ objectiveId: number; name: string; votes: number; weight: number }>
}

/**
 * RN-2: pontos(processo) = Σ votos(objetivo) × peso(objetivo→processo).
 * Não depende de escolha de processo pelos participantes — só da matriz.
 * Desempate: nº de objetivos votados ligados, depois código do processo.
 */
export function rankProcesses<P extends { id: number; code: string | null }>(
  processes: P[],
  objectives: RankedObjective[],
  weights: Array<{ objectiveId: number; processId: number; weight: number }>,
): Array<RankedProcess<P>> {
  const objetivoPorId = new Map(objectives.map((o) => [o.id, o]))
  const porProcesso = new Map<number, RankedProcess<P>['drivers']>()
  for (const w of weights) {
    const o = objetivoPorId.get(w.objectiveId)
    if (!o || o.votes === 0) continue
    const lista = porProcesso.get(w.processId) ?? []
    lista.push({ objectiveId: o.id, name: o.name, votes: o.votes, weight: w.weight })
    porProcesso.set(w.processId, lista)
  }
  const itens = processes.map((p) => {
    const drivers = (porProcesso.get(p.id) ?? []).sort(
      (a, b) => b.votes * b.weight - a.votes * a.weight || a.objectiveId - b.objectiveId,
    )
    const points = drivers.reduce((s, d) => s + d.votes * d.weight, 0)
    return { process: p, points, score: 0, drivers }
  })
  const max = Math.max(0, ...itens.map((i) => i.points))
  for (const i of itens) i.score = max > 0 ? Math.round((i.points / max) * 100) : 0
  return itens.sort(
    (a, b) =>
      b.points - a.points ||
      b.drivers.length - a.drivers.length ||
      compareCodes(a.process.code, b.process.code),
  )
}
