import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/use-auth'
import { LoginPage } from '../features/auth/components/LoginPage'
import { RegisterPage } from '../features/auth/components/RegisterPage'
import { ForgotPasswordPage } from '../features/auth/components/ForgotPasswordPage'
import { ResetPasswordPage } from '../features/auth/components/ResetPasswordPage'
import { HomePage } from '../features/home/HomePage'
import { ProcessosPage } from '../features/processes/ProcessosPage'
import { ProcessoDetailPage } from '../features/processes/ProcessoDetailPage'
import { ObjetivosPage } from '../features/journey/ObjetivosPage'
import { TermometroPage } from '../features/journey/TermometroPage'
import { FotografiaPage } from '../features/journey/FotografiaPage'
import { AssinaturaPage } from '../features/paid/AssinaturaPage'
import { RodadaPage } from '../features/paid/RodadaPage'
import { ConquistasPage } from '../features/paid/ConquistasPage'
import { CmsListPage } from '../features/cms/CmsListPage'
import { CmsVersionPage } from '../features/cms/CmsVersionPage'
import { CmsPesosPage } from '../features/cms/CmsPesosPage'
import { Layout } from './Layout'
import type { ReactNode } from 'react'

/** Rota protegida: sem sessão → login. */
function Protegida({ children }: { children: ReactNode }) {
  const { session, carregando } = useAuth()
  if (carregando) return <p className="carregando">Carregando…</p>
  if (!session) return <Navigate to="/login" replace />
  return children
}

/** Rota de staff (CMS): centro comum não enxerga o backoffice. */
function SomenteStaff({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  if (!session?.isStaff) return <Navigate to="/" replace />
  return children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

      <Route
        element={
          <Protegida>
            <Layout />
          </Protegida>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/objetivos" element={<ObjetivosPage />} />
        <Route path="/termometro" element={<TermometroPage />} />
        <Route path="/fotografia" element={<FotografiaPage />} />
        <Route path="/processos" element={<ProcessosPage />} />
        <Route path="/processos/:id" element={<ProcessoDetailPage />} />
        {/* Tela unificada (2026-07-24): /priorizacao fundiu-se em /processos */}
        <Route path="/priorizacao" element={<Navigate to="/processos" replace />} />
        <Route path="/rodada" element={<RodadaPage />} />
        <Route path="/conquistas" element={<ConquistasPage />} />
        <Route path="/assinatura" element={<AssinaturaPage />} />
        <Route
          path="/cms"
          element={
            <SomenteStaff>
              <CmsListPage />
            </SomenteStaff>
          }
        />
        <Route
          path="/cms/versao/:id"
          element={
            <SomenteStaff>
              <CmsVersionPage />
            </SomenteStaff>
          }
        />
        <Route
          path="/cms/pesos"
          element={
            <SomenteStaff>
              <CmsPesosPage />
            </SomenteStaff>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
