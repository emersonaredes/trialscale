import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ApiError } from '../../shared/lib/api-client'
import { workshopAdminApi } from './api'

const PASSO_ROTULO: Record<string, string> = {
  entrada: 'Entrada',
  objetivos: 'Votação de objetivos',
  ranking_objetivos: 'Objetivos da plateia',
  ranking_processos: 'Processos prioritários',
  avaliacao: 'Autoavaliação',
  distribuicao: 'Resultado da sala',
}

/** Salas de Workshop ao vivo (só staff): uma sala por evento. */
export function WorkshopListPage() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const { data, isLoading } = useQuery({ queryKey: ['workshops'], queryFn: workshopAdminApi.list })
  const criar = useMutation({
    mutationFn: (name: string) => workshopAdminApi.create(name),
    onSuccess: (sala) => navigate(`/workshops/${sala.id}`),
  })

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (nome.trim().length >= 3) criar.mutate(nome.trim())
  }

  return (
    <div className="pilha">
      <div className="cabecalho-pagina">
        <div>
          <h1>Workshop ao vivo</h1>
          <p className="apoio">
            Simulação do TrialScale com a plateia: você projeta o telão e as pessoas respondem pelo
            celular. As salas são de demonstração — nada aqui se mistura com os dados dos centros.
          </p>
        </div>
      </div>

      <form className="cartao" onSubmit={enviar}>
        <h2>Nova sala</h2>
        <div className="linha-acoes">
          <input
            style={{ flex: 1, minWidth: 240 }}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do evento (ex.: Workshop Congresso Norte Nordeste)"
            maxLength={120}
          />
          <button type="submit" disabled={nome.trim().length < 3 || criar.isPending}>
            Criar sala e abrir o telão
          </button>
        </div>
        {criar.error && (
          <p className="erro">
            {criar.error instanceof ApiError ? criar.error.message : 'Não foi possível criar a sala.'}
          </p>
        )}
      </form>

      <div className="cartao">
        <h2>Salas</h2>
        {isLoading && <p className="carregando">Carregando…</p>}
        {data && data.length === 0 && <p className="apoio">Nenhuma sala criada ainda.</p>}
        {data?.map((sala) => (
          <div key={sala.id} className="artefato">
            <div className="info">
              <div className="titulo">
                <Link to={`/workshops/${sala.id}`}>{sala.name}</Link>
                <span className="mono">{sala.code}</span>
              </div>
              <p className="dod">
                {sala.status === 'encerrada' ? 'Encerrada' : (PASSO_ROTULO[sala.step] ?? sala.step)} ·{' '}
                {sala.participants} participante{sala.participants === 1 ? '' : 's'}
                {sala.createdAt ? ` · criada em ${new Date(sala.createdAt).toLocaleDateString('pt-BR')}` : ''}
              </p>
            </div>
            <Link className="botao" to={`/workshops/${sala.id}`}>
              Abrir telão
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
