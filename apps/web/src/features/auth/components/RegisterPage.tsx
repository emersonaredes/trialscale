import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '../api/auth-api'
import { ApiError } from '../../../shared/lib/api-client'
import {
  FAIXAS,
  MODELOS_SERVICO,
  ORPC_FAIXAS,
  SERVICOS_ORPC,
  TIPOS_INSTITUICAO,
  UFS,
  type ModeloServico,
  type OrgType,
  type OrpcFaixa,
  type RegisterPayload,
} from '../types'

const CONSENT_VERSION = 'v1-2026-07'

export function RegisterPage() {
  const navigate = useNavigate()
  const { data: especialidades } = useQuery({
    queryKey: ['specialties'],
    queryFn: authApi.specialties,
  })

  const [orgType, setOrgType] = useState<OrgType>('cpc')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    tenantName: '',
    tipoInstituicao: 'privada' as NonNullable<RegisterPayload['tenant']['tipoInstituicao']>,
    cidade: '',
    estado: 'SP',
    faixa: '0_10' as NonNullable<RegisterPayload['tenant']['protocolosAtivosFaixa']>,
    modeloServico: 'full_service' as ModeloServico,
    centrosGeridosFaixa: '0_5' as OrpcFaixa,
    estudosAtivosFaixa: '0_5' as OrpcFaixa,
  })
  const [servicos, setServicos] = useState<Set<string>>(new Set())
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set())
  const [consentiu, setConsentiu] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const ehOrpc = orgType === 'orpc'

  function alternarEspecialidade(id: number) {
    setSelecionadas((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function alternarServico(campo: string) {
    setServicos((atual) => {
      const novo = new Set(atual)
      if (novo.has(campo)) novo.delete(campo)
      else novo.add(campo)
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
      setErro('Selecione ao menos uma área terapêutica.')
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
          orgType,
          cidade: form.cidade,
          estado: form.estado,
          specialtyIds: [...selecionadas],
          ...(ehOrpc
            ? {
                modeloServico: form.modeloServico,
                centrosGeridosFaixa: form.centrosGeridosFaixa,
                estudosAtivosFaixa: form.estudosAtivosFaixa,
                prestaMonitoria: servicos.has('prestaMonitoria'),
                selecionaCentros: servicos.has('selecionaCentros'),
                ativaCentros: servicos.has('ativaCentros'),
                prestaGestaoDados: servicos.has('prestaGestaoDados'),
                assumeAtribuicoesAnvisa: servicos.has('assumeAtribuicoesAnvisa'),
                assumeFarmacovigilancia: servicos.has('assumeFarmacovigilancia'),
                perfilFomento: servicos.has('perfilFomento'),
              }
            : {
                tipoInstituicao: form.tipoInstituicao,
                protocolosAtivosFaixa: form.faixa,
              }),
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
      <h2>Cadastre sua organização</h2>
      <form onSubmit={onSubmit}>
        <fieldset>
          <legend>Tipo de organização</legend>
          <div className="linha-acoes" role="radiogroup" aria-label="Tipo de organização">
            <label className="checkbox">
              <input
                type="radio"
                name="orgType"
                checked={orgType === 'cpc'}
                onChange={() => setOrgType('cpc')}
              />
              Centro de pesquisa clínica (CPC)
            </label>
            <label className="checkbox">
              <input
                type="radio"
                name="orgType"
                checked={orgType === 'orpc'}
                onChange={() => setOrgType('orpc')}
              />
              Organização de pesquisa (ORPC)
            </label>
          </div>
          <p className="hint">
            O tipo define o catálogo de processos da sua jornada e não muda depois do cadastro.
          </p>
        </fieldset>

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
          <legend>{ehOrpc ? 'Dados da organização' : 'Dados do centro'}</legend>
          <label>
            {ehOrpc ? 'Nome da organização' : 'Nome do centro'}
            <input
              value={form.tenantName}
              onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
              required
              minLength={2}
            />
          </label>

          {!ehOrpc && (
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
          )}

          {ehOrpc && (
            <label>
              Modelo de serviço
              <select
                value={form.modeloServico}
                onChange={(e) => setForm({ ...form, modeloServico: e.target.value as ModeloServico })}
              >
                {MODELOS_SERVICO.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.rotulo}
                  </option>
                ))}
              </select>
            </label>
          )}

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

          {!ehOrpc && (
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
          )}

          {ehOrpc && (
            <>
              <div className="linha">
                <label>
                  Centros geridos
                  <select
                    value={form.centrosGeridosFaixa}
                    onChange={(e) =>
                      setForm({ ...form, centrosGeridosFaixa: e.target.value as OrpcFaixa })
                    }
                  >
                    {ORPC_FAIXAS.map((f) => (
                      <option key={f.valor} value={f.valor}>
                        {f.rotulo}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Estudos ativos
                  <select
                    value={form.estudosAtivosFaixa}
                    onChange={(e) =>
                      setForm({ ...form, estudosAtivosFaixa: e.target.value as OrpcFaixa })
                    }
                  >
                    {ORPC_FAIXAS.map((f) => (
                      <option key={f.valor} value={f.valor}>
                        {f.rotulo}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <p>Serviços que a organização presta / atribuições que assume:</p>
                <div className="grade-especialidades">
                  {SERVICOS_ORPC.map((s) => (
                    <label key={s.campo} className="checkbox">
                      <input
                        type="checkbox"
                        checked={servicos.has(s.campo)}
                        onChange={() => alternarServico(s.campo)}
                      />
                      {s.rotulo}
                    </label>
                  ))}
                </div>
                <p className="hint">
                  Isso ajusta quais artefatos do catálogo se aplicam à sua organização.
                </p>
              </div>
            </>
          )}

          <div>
            <p>{ehOrpc ? 'Áreas terapêuticas de atuação' : 'Especialidades médicas'} (ao menos uma):</p>
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
          Li e concordo que os dados da organização, de forma agregada e não identificável, alimentem
          comparações setoriais (termo {CONSENT_VERSION} — LGPD).
        </label>

        {erro && <p className="erro">{erro}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Enviando…' : ehOrpc ? 'Criar conta da organização' : 'Criar conta do centro'}
        </button>
      </form>
      <p>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </main>
  )
}
