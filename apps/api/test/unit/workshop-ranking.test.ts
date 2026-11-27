/** Workshop ao vivo (spec 006): cálculos puros — RN-1, RN-2 e RN-3. */
import { rankObjectives, rankProcesses, compareCodes } from '../../src/services/workshop-ranking'
import { computeLevel } from '../../src/services/level-calculator'

const objetivos = [
  { id: 1, theme: 'T', name: 'Obj 1' },
  { id: 2, theme: 'T', name: 'Obj 2' },
  { id: 3, theme: 'T', name: 'Obj 3' },
]
const processos = [
  { id: 10, code: '1.1' },
  { id: 11, code: '2.5' },
  { id: 12, code: '10' },
  { id: 13, code: '3.3' },
]

describe('rankObjectives (RN-1)', () => {
  it('conta votos e ordena por votos, depois por id', () => {
    const r = rankObjectives(objetivos, [
      { objectiveId: 2 },
      { objectiveId: 2 },
      { objectiveId: 3 },
      { objectiveId: 1 },
    ])
    expect(r.map((o) => [o.id, o.votes])).toEqual([
      [2, 2],
      [1, 1],
      [3, 1],
    ])
  })
})

describe('rankProcesses (RN-2 / CA-4)', () => {
  const pesos = [
    { objectiveId: 1, processId: 10, weight: 3 },
    { objectiveId: 2, processId: 10, weight: 1 },
    { objectiveId: 2, processId: 11, weight: 3 },
    { objectiveId: 3, processId: 12, weight: 2 },
    { objectiveId: 3, processId: 13, weight: 2 },
  ]

  it('pontos = Σ votos × peso, normalizado 0–100 pelo maior', () => {
    const votos = rankObjectives(objetivos, [
      { objectiveId: 1 }, // 1 voto no obj 1
      { objectiveId: 2 },
      { objectiveId: 2 },
      { objectiveId: 2 }, // 3 votos no obj 2
    ])
    const r = rankProcesses(processos, votos, pesos)
    // 2.5: 3×3 = 9 · 1.1: 1×3 + 3×1 = 6 · demais 0
    expect(r.map((x) => [x.process.code, x.points, x.score])).toEqual([
      ['2.5', 9, 100],
      ['1.1', 6, 67],
      ['3.3', 0, 0],
      ['10', 0, 0],
    ])
    expect(r[1]!.drivers.map((d) => d.objectiveId)).toEqual([1, 2])
  })

  it('empate: mais objetivos votados ligados primeiro, depois código natural', () => {
    const votos = rankObjectives(objetivos, [{ objectiveId: 3 }])
    const r = rankProcesses(processos, votos, pesos)
    expect(r.slice(0, 2).map((x) => x.process.code)).toEqual(['3.3', '10'])
  })

  it('sem votos: tudo zero, sem divisão por zero', () => {
    const r = rankProcesses(processos, rankObjectives(objetivos, []), pesos)
    expect(r.every((x) => x.points === 0 && x.score === 0)).toBe(true)
  })

  it('compareCodes ordena naturalmente', () => {
    expect(['10', '2.5', '1.10', '1.2'].sort(compareCodes)).toEqual(['1.2', '1.10', '2.5', '10'])
  })
})

describe('computeLevel (RN-3 / CA-5)', () => {
  const item = (level: number, cls: 'essencial' | 'complementar', done: boolean) => ({
    level,
    classification: cls,
    done,
  })

  it('nada marcado → nível 1', () => {
    expect(computeLevel([item(2, 'essencial', false)])).toEqual({ level: 1, nextLevelMissing: 1 })
  })
  it('todos os essenciais até N → nível N; complementar não trava', () => {
    const r = computeLevel([
      item(2, 'essencial', true),
      item(2, 'complementar', false),
      item(3, 'essencial', true),
      item(4, 'essencial', false),
      item(4, 'essencial', true),
    ])
    expect(r).toEqual({ level: 3, nextLevelMissing: 1 })
  })
  it('essencial de nível baixo faltando trava os de cima', () => {
    const r = computeLevel([item(2, 'essencial', false), item(3, 'essencial', true)])
    expect(r.level).toBe(1)
  })
  it('tudo completo → nível 5', () => {
    const r = computeLevel([2, 3, 4, 5].map((n) => item(n, 'essencial', true)))
    expect(r).toEqual({ level: 5, nextLevelMissing: 0 })
  })
})
