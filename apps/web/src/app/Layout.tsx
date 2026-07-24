import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../features/auth/hooks/use-auth'
import { useJourneySteps } from '../features/journey/use-journey-steps'
import { processesApi } from '../features/processes/api'
import { LogoSymbol, Wordmark } from '../shared/components/Logo'

const NOME_TELA: Record<string, string> = {
  '/': 'Início',
  '/objetivos': 'Objetivos',
  '/termometro': 'Termômetro',
  '/fotografia': 'Fotografia',
  '/processos': 'Processos',
  '/rodada': 'Rodada',
  '/conquistas': 'Conquistas',
  '/assinatura': 'Assinatura',
  '/cms': 'CMS',
}

/** Faixa de evolução persistente (v3): nível geral em 5 segmentos na escala
 *  da logo; no gratuito, o progresso da jornada. */
function EvolucaoStrip() {
  const { pago, progresso } = useJourneySteps()
  const location = useLocation()
  const { data: overview } = useQuery({
    queryKey: ['overview'],
    queryFn: processesApi.overview,
    retry: false,
    enabled: pago,
  })
  const nomeTela =
    NOME_TELA[location.pathname] ??
    NOME_TELA[`/${location.pathname.split('/')[1] ?? ''}`] ??
    'TrialScale'
  const nivel = overview?.overallLevel ?? null

  return (
    <div className="topbar">
      <span className="apoio">
        Você está em <b style={{ color: 'var(--ink)' }}>{nomeTela}</b>
      </span>
      <div className="evolucao">
        {pago && nivel != null ? (
          <>
            <span className="apoio">Nível geral</span>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="seg">
                <span
                  style={{
                    width: `${Math.min(Math.max((nivel - (i - 1)) * 100, 0), 100)}%`,
                    background: `var(--nivel-${i})`,
                  }}
                />
              </span>
            ))}
            <b className="valor">{nivel.toFixed(1)}</b>
          </>
        ) : (
          <>
            <span className="apoio">Jornada</span>
            <span className="progresso" style={{ width: 130 }}>
              <span style={{ width: `${progresso}%` }} />
            </span>
            <b className="valor">{progresso}%</b>
          </>
        )}
      </div>
    </div>
  )
}

/** Shell v3: sidebar vira TRILHA da jornada (passos com estado) + topbar. */
export function Layout() {
  const { session, logout } = useAuth()
  const { passos, pago } = useJourneySteps()

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">
          <LogoSymbol dark />
          <Wordmark />
        </div>
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'ativo' : '')}>
          Início
        </NavLink>

        <div style={{ margin: '10px 6px 4px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8fb4c4', fontWeight: 700 }}>
          Sua jornada
        </div>
        {passos.map((p) => (
          <NavLink
            key={p.rota}
            to={p.rota}
            className={({ isActive }) => `passo ${p.estado} ${isActive ? 'ativo' : ''}`}
          >
            <span className="coluna-dot">
              <span className="dot">{p.estado === 'feito' ? '✓' : ''}</span>
              <span className="linha" />
            </span>
            <span>
              <span className="nome">
                {p.n}. {p.nome}
              </span>
              <span className="meta">{p.meta}</span>
            </span>
          </NavLink>
        ))}

        <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,.15)', paddingTop: 8 }}>
          <NavLink to="/conquistas" className={({ isActive }) => (isActive ? 'ativo' : '')}>
            Conquistas
          </NavLink>
          {!session?.isStaff && (
            <NavLink to="/assinatura" className={({ isActive }) => (isActive ? 'ativo' : '')}>
              {pago ? 'Assinatura' : 'Assinar ✨'}
            </NavLink>
          )}
          {session?.isStaff && (
            <NavLink to="/cms" className={({ isActive }) => (isActive ? 'ativo' : '')}>
              CMS (backoffice)
            </NavLink>
          )}
        </div>

        <div className="rodape">
          <div>{session?.user.name}</div>
          <div>{session?.tenant?.name ?? 'Equipe TrialScale'}</div>
          <button className="pequeno secundario" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <EvolucaoStrip />
        <main className="conteudo">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
