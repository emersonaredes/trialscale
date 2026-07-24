import { Link } from 'react-router-dom'

/** Card padrão "Próximo passo" (proposta v3 §6): toda tela termina puxando a
 *  próxima etapa da jornada. */
export function ProximoPasso({
  titulo,
  cta,
  rota,
  eyebrow = 'Próximo passo',
}: {
  titulo: string
  cta: string
  rota: string
  eyebrow?: string
}) {
  return (
    <div className="proximo-passo">
      <span>
        <span className="eyebrow">{eyebrow}</span>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
          {titulo}
        </span>
      </span>
      <Link to={rota}>
        <button className="avancar">{cta} →</button>
      </Link>
    </div>
  )
}
