/** Cor da dor (termômetro/fotografia): frio → quente. */
export function corDaDor(score: number): string {
  if (score >= 4) return 'var(--coral)'
  if (score === 3) return 'var(--ambar)'
  return 'var(--azul-400)'
}
