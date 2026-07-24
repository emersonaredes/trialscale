import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paidApi } from './api'
import { authApi } from '../auth/api/auth-api'
import { useAuth } from '../auth/hooks/use-auth'
import { setAccessToken } from '../../shared/lib/api-client'
import { ProximoPasso } from '../../shared/components/ProximoPasso'

function formatarValor(amount: string): string {
  return Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function AssinaturaPage() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ['plans'], queryFn: paidApi.plans })
  const [mensagem, setMensagem] = useState<string | null>(null)
  const admin = session?.role === 'administrador'

  // Renova a sessão para o planCode novo refletir em toda a UI.
  async function renovarSessao() {
    const { accessToken } = await authApi.refresh()
    setAccessToken(accessToken)
    window.location.reload()
  }

  const assinar = useMutation({
    mutationFn: (planCode: string) => paidApi.subscribe(planCode),
    onSuccess: async (plan) => {
      setMensagem(`Plano ${plan.name} ativado! Bem-vindo à trilha. 🎉`)
      await queryClient.invalidateQueries({ queryKey: ['plans'] })
      await renovarSessao()
    },
  })

  const cancelar = useMutation({
    mutationFn: () => paidApi.cancel(),
    onSuccess: renovarSessao,
  })

  return (
    <div className="pilha">
      <div>
        <h1>Planos</h1>
        <p className="apoio">
          A jornada gratuita mapeia a sua dor; a paga abre o caminho: Raio-X de artefatos, níveis,
          priorização e rodadas de melhoria.
        </p>
      </div>

      <div className="aviso">
        ⚠️ Ambiente de desenvolvimento: a assinatura é <b>simulada</b> (nenhuma cobrança). O
        pagamento real chega com o gateway na Etapa 5.
      </div>

      {mensagem && <div className="aviso" style={{ background: 'var(--verde-50)', borderColor: 'var(--verde-300)', color: 'var(--verde-700)' }}>{mensagem}</div>}

      <div className="linha" style={{ alignItems: 'stretch' }}>
        {(data?.plans ?? []).map((plan) => {
          const atual = data?.myPlan?.code === plan.code
          return (
            <div key={plan.code} className={`plano-card ${atual ? 'atual' : ''}`}>
              <h2>{plan.name}</h2>
              <div className="preco">{formatarValor(plan.amount)}<span className="apoio">/mês</span></div>
              <p className="apoio">
                {plan.code === 'premium'
                  ? 'Plataforma completa + acompanhamento por consultores (serviço fora da plataforma).'
                  : 'Plataforma completa: Raio-X, níveis, priorização, rodadas e templates.'}
              </p>
              {atual ? (
                <p style={{ color: 'var(--verde-700)', fontWeight: 700 }}>✓ Seu plano atual</p>
              ) : (
                admin && (
                  <button onClick={() => assinar.mutate(plan.code)} disabled={assinar.isPending}>
                    Ativar {plan.name}
                  </button>
                )
              )}
            </div>
          )
        })}
      </div>

      {!admin && (
        <p className="apoio">Somente o administrador do centro pode alterar o plano.</p>
      )}
      {data?.myPlan && (
        <ProximoPasso
          titulo="Seu plano está ativo — veja seus processos priorizados e comece a trilha"
          cta="Ver processos"
          rota="/processos"
        />
      )}

      {admin && data?.myPlan && (
        <div>
          <button className="destrutivo pequeno" onClick={() => cancelar.mutate()}>
            Cancelar assinatura (voltar ao gratuito)
          </button>
        </div>
      )}
    </div>
  )
}
