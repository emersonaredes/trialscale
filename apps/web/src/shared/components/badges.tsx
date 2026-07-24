/** Componentes do design system v1.1: badge de nível (escala C), pill de
 *  estado do kanban, selos de origem e marca essencial/complementar. */

const NIVEL_NOME: Record<number, string> = {
  1: 'Inicial',
  2: 'Informal',
  3: 'Definido',
  4: 'Gerenciado',
  5: 'Otimizado',
}

export function LevelBadge({ level }: { level: number }) {
  return (
    <span className={`nivel nivel-${level}`}>
      <b>{level}</b> {NIVEL_NOME[level]}
    </span>
  )
}

const ESTADO_ROTULO: Record<string, string> = {
  nao_iniciado: 'Não iniciado',
  em_elaboracao: 'Em elaboração',
  completo: 'Completo',
}

export function StatePill({
  state,
  onClick,
  title,
}: {
  state: string
  onClick?: () => void
  title?: string
}) {
  return (
    <button
      type="button"
      className={`estado estado-${state}`}
      onClick={onClick}
      title={title ?? (onClick ? 'Clique para mudar o estado' : undefined)}
      disabled={!onClick}
      style={onClick ? undefined : { cursor: 'default' }}
    >
      {ESTADO_ROTULO[state] ?? state}
    </button>
  )
}

/** Selos: A = norma (peso máximo); T/G = prática técnica; P/D = sugestão. */
export function SealBadge({ code }: { code: string }) {
  if (code === 'A') return <span className="selo selo-norma">Norma</span>
  if (code === 'T' || code === 'G')
    return <span className="selo selo-gcp">{code === 'T' ? 'Tese' : 'GCP'}</span>
  return <span className="selo selo-sugestao">{code === 'P' ? 'PIC' : 'Sugestão'}</span>
}

export function ClassMark({ classification }: { classification: string }) {
  const essencial = classification === 'essencial'
  return (
    <span
      className={essencial ? 'marca-essencial' : 'marca-complementar'}
      title={essencial ? 'Essencial — obrigatório para o nível' : 'Complementar — soma ao progresso'}
    />
  )
}
