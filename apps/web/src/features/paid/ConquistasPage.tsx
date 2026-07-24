import { useQuery } from '@tanstack/react-query'
import { apiFetch, apiDownload } from '../../shared/lib/api-client'
import { Paywall, isPlanRequired } from '../../shared/components/Paywall'

interface AchievementStatus {
  code: string
  name: string
  type: 'selo' | 'medalha'
  hint: string
  earnedAt: string | null
}

const conquistasApi = () =>
  apiFetch<{ achievements: AchievementStatus[]; newlyEarned: string[] }>('/api/achievements')

export function ConquistasPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: conquistasApi,
    retry: false,
  })

  if (isPlanRequired(error)) return <Paywall />
  if (isLoading || !data) return <p className="carregando">Contando suas vitórias…</p>

  const conquistadas = data.achievements.filter((a) => a.earnedAt != null)

  return (
    <div className="pilha">
      <div className="cabecalho-pagina">
        <div>
          <h1>Conquistas</h1>
          <p className="apoio">
            {conquistadas.length} de {data.achievements.length} — cada uma marca um degrau real da
            sua rota de maturidade.
          </p>
        </div>
        <button
          onClick={() =>
            void apiDownload(
              '/api/report/pdf',
              `mapa-maturidade-trialscale-${new Date().toISOString().slice(0, 10)}.pdf`,
            )
          }
        >
          Baixar Mapa de Maturidade (PDF)
        </button>
      </div>

      {data.newlyEarned.length > 0 && (
        <div
          className="aviso"
          style={{ background: 'var(--verde-50)', borderColor: 'var(--verde-300)', color: 'var(--verde-700)' }}
        >
          Aê! Conquista nova:{' '}
          <b>
            {data.achievements
              .filter((a) => data.newlyEarned.includes(a.code))
              .map((a) => a.name)
              .join(' · ')}
          </b>{' '}
          🎉
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))', gap: 10 }}>
        {data.achievements.map((a) => {
          const earned = a.earnedAt != null
          return (
            <div
              key={a.code}
              className="cartao"
              style={
                earned
                  ? { borderColor: 'var(--verde-300)' }
                  : { opacity: 0.55, boxShadow: 'none' }
              }
            >
              <div className="linha-acoes" style={{ justifyContent: 'space-between' }}>
                <b style={{ color: 'var(--ink)', fontSize: 13.5 }}>
                  {earned ? '🏅' : '🔒'} {a.name}
                </b>
                <span className={`selo ${a.type === 'medalha' ? 'selo-norma' : 'selo-gcp'}`}>
                  {a.type}
                </span>
              </div>
              <p className="apoio" style={{ margin: '4px 0 0' }}>
                {earned
                  ? `Conquistada em ${new Date(a.earnedAt!).toLocaleDateString('pt-BR')}`
                  : a.hint}
              </p>
            </div>
          )
        })}
      </div>

      <p className="apoio">
        O Mapa de Maturidade é <b>autodeclarado</b> — um guia para o seu centro e uma conversa
        franca com patrocinadores, nunca uma certificação.
      </p>
    </div>
  )
}
