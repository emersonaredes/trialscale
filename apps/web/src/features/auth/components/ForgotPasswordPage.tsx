import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/auth-api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await authApi.forgotPassword(email).catch(() => undefined)
    setEnviado(true) // resposta é 202 sempre — sem enumeração de e-mails
  }

  return (
    <main className="auth-card">
      <p className="marca">TrialScale</p>
      <h2>Recuperar senha</h2>
      {enviado ? (
        <p>
          Se o e-mail existir, enviaremos instruções de redefinição. Em ambiente de
          desenvolvimento, o link aparece no console do servidor (api).
        </p>
      ) : (
        <form onSubmit={onSubmit}>
          <label>
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <button type="submit">Enviar link de redefinição</button>
        </form>
      )}
      <p>
        <Link to="/login">Voltar ao login</Link>
      </p>
    </main>
  )
}
