import { useState, type ReactNode } from 'react'

/** Seção expansível (handoff v4): título + +/−; borda azul quando aberta. */
export function SecaoColapsavel({
  titulo,
  aberta: inicial = false,
  children,
}: {
  titulo: string
  aberta?: boolean
  children: ReactNode
}) {
  const [aberta, setAberta] = useState(inicial)
  return (
    <section className={`colapsavel ${aberta ? 'aberta' : ''}`}>
      <button type="button" className="cabecalho-colapsavel" onClick={() => setAberta(!aberta)}>
        <span>{titulo}</span>
        <span className="sinal">{aberta ? '−' : '+'}</span>
      </button>
      {aberta && <div className="corpo-colapsavel">{children}</div>}
    </section>
  )
}
