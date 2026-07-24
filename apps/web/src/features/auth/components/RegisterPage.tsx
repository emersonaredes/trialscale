import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '../api/auth-api'
import { ApiError } from '../../../shared/lib/api-client'
import { FAIXAS, TIPOS_INSTITUICAO, UFS, type RegisterPayload } from '../types'

const CONSENT_VERSION = 'v1-2026-07'

export function RegisterPage() {
  const navigate = useNavigate()
  const { data: especialidades } = useQuery({
    queryKey: ['specialties'],
    queryFn: authApi.specialties,
  })

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    tenantName: '',
    tipoInstituicao: 'privada' as RegisterPayload['tenant']['tipoInstituicao'],
    cidade: '',
    estado: 'SP',
    faixa: '0_10' as RegisterPayload['tenant']['protocolosAtivosFaixa'],
  })
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set())
  const [consentiu, setConsentiu] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function alternarEspecialidade(id: number) {
    setSelecionadas((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!consentiu) {
      setErro('É preciso aceitar o termo de consentimento (LGPD).')
      return
    }
    if (selecionadas.size === 0) {
      setErro('Selecione ao menos uma especialidade.')
      return
    }
    setEnviando(true)
    try {
      await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        tenant: {
          name: form.tenantName,
          tipoInstituicao: form.tipoInstituicao,
          cidade: form.cidade,
          estado: form.estado,
          protocolosAtivosFaixa: form.faixa,
          specialtyIds: [...selecionadas],
        },
        consent: { version: CONSENT_VERSION, accepted: true },
      })
      navigate('/login?cadastrado=1')
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Erro inesperado.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="auth-card auth-card-larga">
      <p className="marca">TrialScale</p>
      <h2>Cadastre seu centro de pesquisa</h2>
      <form onSubmit={onSubmit}>
        <fieldset>
          <legend>Seus dados</legend>
          <label>
            Nome completo
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={2}
            />
          </label>
          <label>
            E-mail
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Senha (mínimo 8 caracteres)
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>Dados do centro</legend>
          <label>
            Nome do centro
            <input
              value={form.tenantName}
              onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
              required
              minLength={2}
            />
          </label>
          <label>
            Tipo de instituição
            <select
              value={form.tipoInstituicao}
              onChange={(e) =>
                setForm({ ...form, tipoInstituicao: e.target.value as typeof form.tipoInstituicao })
              }
            >
              {TIPOS_INSTITUICAO.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.rotulo}
                </option>
              ))}
            </select>
          </label>
          <div className="linha">
            <label>
              Cidade
              <input
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                required
                minLength={2}
              />
            </label>
            <label>
              Estado
              <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Protocolos ativos
            <select
              value={form.faixa}
              onChange={(e) => setForm({ ...form, faixa: e.target.value as typeof form.faixa })}
            >
              {FAIXAS.map((f) => (
                <option key={f.valor} value={f.valor}>
                  {f.rotulo}
                </option>
              ))}
            </select>
          </label>
          <div>
            <p>Especialidades médicas (selecione ao menos uma):</p>
            <div className="grade-especialidades">
              {(especialidades ?? []).map((esp) => (
                <label key={esp.id} className="checkbox">
                  <input
                    type="checkbox"
                    checked={selecionadas.has(esp.id)}
                    onChange={() => alternarEspecialidade(esp.id)}
                  />
                  {esp.name}
                </label>
              ))}
            </div>
          </div>
        </fieldset>

        <label className="checkbox">
          <input type="checkbox" checked={consentiu} onChange={(e) => setConsentiu(e.target.checked)} />
          Li e concordo que os dados do centro, de forma agregada e não identificável, alimentem
          comparações setoriais (termo {CONSENT_VERSION} — LGPD).
        </label>

        {erro && <p className="erro">{erro}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Criar conta do centro'}
        </button>
      </form>
      <p>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </main>
  )
}
