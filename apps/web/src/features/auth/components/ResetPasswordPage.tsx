import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/auth-api'
import { ApiError } from '../../../shared/lib/api-client'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (senha !== confirma) {
      setErro('As senhas não conferem.')
      return
    }
    try {
      await authApi.resetPassword(token, senha)
      navigate('/login?senha_redefinida=1')
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Erro inesperado.')
    }
  }

  if (!token) {
    return (
      <main className="auth-card">
        <h2>Link inválido</h2>
        <p>
          Este link de redefinição está incompleto. <Link to="/esqueci-senha">Peça um novo</Link>.
        </p>
      </main>
    )
  }

  return (
    <main className="auth-card">
      <p className="marca">TrialScale</p>
      <h2>Definir nova senha</h2>
      <form onSubmit={onSubmit}>
        <label>
          Nova senha (mínimo 8 caracteres)
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <label>
          Confirme a nova senha
          <input
            type="password"
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
            required
          />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <button type="submit">Redefinir senha</button>
      </form>
    </main>
  )
}
