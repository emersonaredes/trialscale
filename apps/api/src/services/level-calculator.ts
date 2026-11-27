/**
 * Cálculo PURO do nível de maturidade de um processo (concepção §4).
 * Fonte única da regra: usado pelo produto (maturity-service) e pelo Workshop
 * ao vivo (workshop-service) — os dois nunca divergem.
 *
 * Regra: nível = maior N (2..5) tal que TODOS os essenciais dos níveis <= N
 * estão atendidos; mínimo 1. Complementar não trava a subida.
 */
export interface LevelItem {
  classification: 'essencial' | 'complementar'
  level: number
  /** true quando o artefato conta como atendido. */
  done: boolean
}

export function computeLevel(items: LevelItem[]): { level: number; nextLevelMissing: number } {
  let level = 1
  for (let n = 2; n <= 5; n++) {
    const pendentes = items.some((a) => a.classification === 'essencial' && a.level <= n && !a.done)
    if (pendentes) break
    level = n
  }
  const nextLevelMissing =
    level < 5
      ? items.filter((a) => a.classification === 'essencial' && a.level <= level + 1 && !a.done).length
      : 0
  return { level, nextLevelMissing }
}
