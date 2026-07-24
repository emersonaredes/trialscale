/** Logotipo "Rota ancorada" (DS v2): rota de escalada com 5 âncoras = os 5
 *  níveis, do azul ao âmbar da conquista. Nunca recolorir ou rotacionar. */
export function LogoSymbol({ size = 26, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg viewBox="0 0 52 52" width={size} height={size} fill="none" aria-hidden>
      <path
        d="M8 44 L20 32 L14 22 L30 16 L40 8"
        stroke={dark ? '#7ACBE8' : '#0F81AC'}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="44" r="4" fill="#0F81AC" />
      <circle cx="20" cy="32" r="4" fill="#219EC9" />
      <circle cx="14" cy="22" r="4" fill="#4CCBA0" />
      <circle cx="30" cy="16" r="4" fill="#17B583" />
      <circle cx="40" cy="8" r="5.5" fill="#F5A623" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="wordmark">
      Trial<span>Scale</span>
    </span>
  )
}
