import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { processesApi } from './api'
import { LevelBadge } from '../../shared/components/badges'
import { Paywall, isPlanRequired } from '../../shared/components/Paywall'

const GRUPO: Record<string, string> = {
  central: 'Central',
  suporte: 'Suporte',
  gestao: 'Gestão',
}

export function ProcessosPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['overview'],
    queryFn: processesApi.overview,
    retry: false,
  })

  if (isPlanRequired(error)) return <Paywall />
  if (isLoading) return <p className="carregando">Carregando seus processos…</p>

  const processos = data?.processes ?? []

  return (
    <div className="pilha">
      <div className="cabecalho-pagina">
        <div>
          <h1>Processos</h1>
          <p className="apoio">
            Sua maturidade é calculada pelos artefatos essenciais completos — marque o que seu
            centro já possui no detalhe de cada processo.
          </p>
        </div>
        {data?.overallLevel != null && (
          <div className="cartao cartao-destaque" style={{ padding: '14px 22px' }}>
            <span className="apoio">Nível geral do centro</span>
            <div className="display">{data.overallLevel.toFixed(1)}</div>
          </div>
        )}
      </div>

      <div className="cartao" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Processo</th>
              <th>Grupo</th>
              <th>Nível</th>
              <th>Essenciais</th>
              <th>Próximo nível</th>
            </tr>
          </thead>
          <tbody>
            {processos.map((p) => (
              <tr key={p.processId} style={p.applies ? undefined : { opacity: 0.55 }}>
                <td>
                  <Link to={`/processos/${p.processId}`}>
                    {p.code && <span className="mono">{p.code}</span>} <b>{p.name}</b>
                  </Link>
                  {p.oneLineDescription && <div className="apoio">{p.oneLineDescription}</div>}
                </td>
                <td>{GRUPO[p.processGroup] ?? p.processGroup}</td>
                <td>
                  {p.applies ? <LevelBadge level={p.level} /> : <span className="apoio">Não se aplica</span>}
                </td>
                <td>
                  <div className="apoio">
                    {p.essentialsComplete}/{p.essentialsTotal}
                  </div>
                  <div
                    className={`progresso ${p.essentialsTotal > 0 && p.essentialsComplete / p.essentialsTotal >= 0.8 ? 'quase' : ''}`}
                    style={{ width: 120 }}
                  >
                    <span
                      style={{
                        width: `${p.essentialsTotal ? Math.round((100 * p.essentialsComplete) / p.essentialsTotal) : 0}%`,
                      }}
                    />
                  </div>
                </td>
                <td className="apoio">
                  {p.applies && p.level < 5
                    ? p.nextLevelMissing === 1
                      ? 'Falta só 1 essencial — você está pertinho.'
                      : `Faltam ${p.nextLevelMissing} essenciais`
                    : p.applies
                      ? 'Topo da escala 🎉'
                      : '—'}
                </td>
              </tr>
            ))}
            {processos.length === 0 && (
              <tr>
                <td colSpan={5} className="apoio" style={{ textAlign: 'center', padding: 32 }}>
                  Nenhum conteúdo publicado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
