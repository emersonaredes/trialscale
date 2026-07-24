import { Link } from 'react-router-dom'
import { ApiError } from '../lib/api-client'

export function isPlanRequired(err: unknown): boolean {
  return err instanceof ApiError && err.code === 'PLAN_REQUIRED'
}

/** Convite (não punição): o gratuito mapeou a dor; o pago abre o caminho. */
export function Paywall() {
  return (
    <div className="cartao paywall">
      <h1>Sua fotografia está pronta — o próximo passo é a trilha 🧗</h1>
      <p className="apoio" style={{ maxWidth: 480, margin: '8px auto 16px' }}>
        O Raio-X de artefatos, os níveis de maturidade, a priorização e as rodadas de melhoria
        fazem parte da jornada paga. Ative um plano e descubra exatamente o que fazer para as suas
        maiores dores diminuírem.
      </p>
      <Link to="/assinatura">
        <button>Conhecer os planos</button>
      </Link>
    </div>
  )
}
