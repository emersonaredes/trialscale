/** Cor da dor (termômetro/fotografia): frio → quente. */
export function corDaDor(score: number): string {
  if (score >= 4) return 'var(--coral)'
  if (score === 3) return 'var(--ambar)'
  return 'var(--azul-400)'
}

/** Ordena códigos de processo naturalmente: 1.1 < 1.2 < 2.5 < 4 < 5 < 13. */
export function compareProcessCode(a: string | null, b: string | null): number {
  const parse = (c: string | null) => (c ?? '999').split('.').map((s) => Number(s) || 0)
  const [a1 = 0, a2 = 0] = parse(a)
  const [b1 = 0, b2 = 0] = parse(b)
  return a1 - b1 || a2 - b2
}
