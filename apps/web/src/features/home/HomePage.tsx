import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/hooks/use-auth'
import { processesApi } from '../processes/api'
import { LevelBadge } from '../../shared/components/badges'

const ROTULO_PAPEL: Record<string, string> = {
  administrador: 'Administrador',
  coordenador: 'Coordenador',
  membro: 'Membro',
}

export function HomePage() {
  const { session } = useAuth()
  const { data } = useQuery({ queryKey: ['overview'], queryFn: processesApi.overview })

  const aplicaveis = data?.processes.filter((p) => p.applies) ?? []
  const noTopo = aplicaveis.filter((p) => p.level === 5).length

  return (
    <div className="pilha">
      <div className="cartao cartao-destaque">
        <h1>Olá, {session?.user.name?.split(' ')[0]} 👋</h1>
        <p className="apoio">
          {session?.tenant?.name ?? 'Equipe TrialScale'} ·{' '}
          {session?.role ? ROTULO_PAPEL[session.role] : 'Staff'}
        </p>
        {data?.overallLevel != null && (
          <p style={{ margin: '10px 0 0' }}>
            Nível geral do centro: <b className="display">{data.overallLevel.toFixed(1)}</b>
          </p>
        )}
      </div>

      <section className="cartao">
        <h2>Sua jornada de maturidade</h2>
        {aplicaveis.length > 0 ? (
          <>
            <p className="apoio">
              {aplicaveis.length} processos publicados · {noTopo} no nível Otimizado
            </p>
            <div className="linha-acoes" style={{ marginBottom: 12 }}>
              {aplicaveis.slice(0, 6).map((p) => (
                <Link key={p.processId} to={`/processos/${p.processId}`} title={p.name}>
                  <LevelBadge level={p.level} />
                </Link>
              ))}
            </div>
            <Link to="/processos">
              <button>Abrir meus processos</button>
            </Link>
          </>
        ) : (
          <p className="apoio">
            Assim que a equipe TrialScale publicar conteúdo, seus processos aparecem aqui.
          </p>
        )}
      </section>

      <section className="cartao">
        <h2>Como funciona</h2>
        <p className="apoio">
          Cada processo tem artefatos por nível (1 Inicial → 5 Otimizado). Marque o que seu centro
          já possui — os <b>essenciais</b> definem o nível; os complementares somam ao progresso. A
          régua é autodeclarada: apoio à gestão, nunca certificação.
        </p>
      </section>
    </div>
  )
}
