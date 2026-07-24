import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/use-auth'

/** Shell da área logada: sidebar azul-900 (design system) + conteúdo. */
export function Layout() {
  const { session, logout } = useAuth()

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">TrialScale</div>
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'ativo' : '')}>
          Início
        </NavLink>
        <NavLink to="/objetivos" className={({ isActive }) => (isActive ? 'ativo' : '')}>
          Objetivos
        </NavLink>
        <NavLink to="/termometro" className={({ isActive }) => (isActive ? 'ativo' : '')}>
          Termômetro
        </NavLink>
        <NavLink to="/fotografia" className={({ isActive }) => (isActive ? 'ativo' : '')}>
          Fotografia
        </NavLink>
        <NavLink to="/processos" className={({ isActive }) => (isActive ? 'ativo' : '')}>
          Processos
        </NavLink>
        {session?.isStaff && (
          <NavLink to="/cms" className={({ isActive }) => (isActive ? 'ativo' : '')}>
            CMS (backoffice)
          </NavLink>
        )}
        <div className="rodape">
          <div>{session?.user.name}</div>
          <div>{session?.tenant?.name ?? 'Equipe TrialScale'}</div>
          <button className="pequeno secundario" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </aside>
      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  )
}
