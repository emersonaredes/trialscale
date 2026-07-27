/**
 * Seed do CATÁLOGO ORPC (PT-0067) — parser fiel de docs/conteudo/
 * conteudo_processos_orpc_leva1..4.md (29 processos, ~348 artefatos).
 *
 * ⚠️ CURADORIA PENDENTE (constituição §6): itens [A] e [I] exigem validação
 * regulatória humana; classificação E/C e tipos inferidos revisáveis via CMS.
 * Decisões de design deste seed (validar na curadoria):
 *  - códigos O1..O29 na ordem do catálogo (as levas não trazem códigos);
 *  - tipo de artefato INFERIDO do título (marcador *(governança)* →
 *    documento_governanca; POP → pop; Indicador → indicador; etc.);
 *  - menu de OBJETIVOS ORPC: proposta [D] adaptada da concepção §2 à
 *    linguagem das levas — NÃO consta nos documentos de conteúdo.
 * Idempotente: pula processos que já têm versão publicada.
 */
import fs from 'node:fs'
import path from 'node:path'
import { contentService, slugify, type DraftGraphInput } from '../services/content-service'
import { contentRepository } from '../repositories/content-repository'
import { objectiveRepository } from '../repositories/journey-repository'
import type { ProcessGroup } from '../types/domain'

const CONTEUDO_DIR = path.resolve(__dirname, '../../../../docs/conteudo')
const LEVAS = [
  'conteudo_processos_orpc_leva1.md',
  'conteudo_processos_orpc_leva2.md',
  'conteudo_processos_orpc_leva3.md',
  'conteudo_processos_orpc_leva4.md',
]

interface ParsedArtifact {
  title: string
  dod: string
  seals: string[]
  cls: 'essencial' | 'complementar'
  level: number
  type: string
  conditionCode: string | null
}
interface ParsedProcess {
  name: string
  group: ProcessGroup
  oneLine: string | null
  objective: string | null
  level1: string | null
  artifacts: ParsedArtifact[]
}

/** Tipo inferido do título (heurística revisável via CMS). */
function inferirTipo(titulo: string, governanca: boolean): string {
  if (governanca) return 'documento_governanca'
  const t = titulo.toLowerCase()
  if (/\bpops?\b|^fluxo de aprovação/.test(t)) return 'pop'
  if (/^indicador|^indicadores|indicador medido/.test(t)) return 'indicador'
  if (/treinamento|matriz de qualificação|capacita/.test(t)) return 'treinamento'
  if (
    /template|checklist|question|ferramenta|crm|ctms|sistema|planilha|base de dados|painel|dashboard|plano |modelo|matriz|controle|agenda|calend|reposit|invent|estratégia|critério|política|tabela|fluxo|simula|análise|programa|rotina|guia/.test(t)
  ) {
    return 'ferramenta'
  }
  if (/acesso|infraestrutura|arquivo físico|sala/.test(t)) return 'infraestrutura'
  return 'registro'
}

/** Limpa markdown do texto (negrito e notas *(...)*), preservando o conteúdo. */
function limparTexto(s: string): string {
  return s.replace(/\*\(/g, '(').replace(/\)\*/g, ')').replace(/\*\*/g, '').trim()
}

const RE_ARTEFATO = /^- \((E|C)\) ((?:\[[A-Z]\])+)\s+(.*?) — DoD: (.+)$/
const RE_NIVEL = /^\*\*Nível (\d) — /

function parseLeva(conteudo: string, levaIdx: number): ParsedProcess[] {
  const linhas = conteudo.split('\n')
  const processos: ParsedProcess[] = []
  // Levas 1–3: processos em '# Nome' (todos centrais). Leva 4: seções
  // '# PROCESSOS ...' definem o grupo e os processos ficam em '## Nome'.
  const leva4 = levaIdx === 3
  let grupo: ProcessGroup = 'central'
  let atual: ParsedProcess | null = null
  let nivel = 0
  let coletandoNivel1 = false

  const fechar = () => {
    if (atual && atual.artifacts.length > 0) processos.push(atual)
    atual = null
  }

  for (const linha of linhas) {
    if (leva4 && linha.startsWith('# PROCESSOS')) {
      fechar()
      if (linha.includes('SUPORTE')) grupo = 'suporte'
      else if (linha.includes('GERENCIAIS')) grupo = 'gestao'
      else grupo = 'central'
      continue
    }
    const headerProcesso = leva4
      ? linha.startsWith('## ') && !linha.startsWith('## Aprendizados') && !linha.startsWith('## Pendências') && !linha.startsWith('## Fechamento')
      : linha.startsWith('# ') && !linha.startsWith('# TrialScale') && !linha.startsWith('# Fechamento')
    if (leva4 && linha.startsWith('# Fechamento')) {
      fechar()
      break
    }
    if (headerProcesso) {
      fechar()
      atual = {
        name: linha.replace(/^#+ /, '').trim(),
        group: grupo,
        oneLine: null,
        objective: null,
        level1: null,
        artifacts: [],
      }
      nivel = 0
      coletandoNivel1 = false
      continue
    }
    if (!atual) continue

    const mOneLine = linha.match(/^\*\*Descrição de uma linha \(termômetro\):\*\* (.+)$/)
    if (mOneLine) {
      atual.oneLine = limparTexto(mOneLine[1]!)
      continue
    }
    const mObjetivo = linha.match(/^\*\*Objetivo:\*\* (.+)$/)
    if (mObjetivo) {
      atual.objective = limparTexto(mObjetivo[1]!)
      continue
    }
    const mNivel = linha.match(RE_NIVEL)
    if (mNivel) {
      nivel = Number(mNivel[1])
      coletandoNivel1 = nivel === 1
      continue
    }
    if (coletandoNivel1 && linha.trim() && !linha.startsWith('#') && !linha.startsWith('-')) {
      atual.level1 = (atual.level1 ? `${atual.level1} ` : '') + limparTexto(linha)
      continue
    }
    const mArt = linha.match(RE_ARTEFATO)
    if (mArt && nivel >= 2 && nivel <= 5) {
      const [, ec, selosRaw, tituloRaw, dodRaw] = mArt
      const seals = [...selosRaw!.matchAll(/\[([A-Z])\]/g)].map((x) => x[1]!)
      let titulo = tituloRaw!.trim()
      let conditionCode: string | null = null
      if (/\*\(Condicional a perfil acadêmico\/fomento\)\*/i.test(titulo)) {
        conditionCode = 'perfil_fomento'
        titulo = titulo.replace(/\*\(Condicional[^)]*\)\*/i, '').trim()
      }
      const governanca = /\*\(governança\)\*/i.test(titulo)
      titulo = limparTexto(titulo.replace(/\*\(governança\)\*/i, '')).replace(/\s+/g, ' ').trim()
      atual.artifacts.push({
        title: titulo,
        dod: limparTexto(dodRaw!),
        seals,
        cls: ec === 'E' ? 'essencial' : 'complementar',
        level: nivel,
        type: inferirTipo(titulo, governanca),
        conditionCode,
      })
    }
  }
  fechar()
  return processos
}

/** Menu de objetivos estratégicos ORPC — PROPOSTA [D] para curadoria
 *  (as levas não trazem esse menu; adaptado da concepção §2 do CPC usando a
 *  linguagem dos processos ORPC: pipeline, margem, start-up, monitoria). */
const OBJETIVOS_ORPC: Array<{ theme: string; items: string[] }> = [
  { theme: 'Pipeline e captação de projetos', items: [
    'Aumentar o número de projetos e contratos',
    'Aumentar a taxa de conversão de propostas',
    'Diversificar a carteira de clientes (reduzir dependência)',
    'Ampliar as linhas de serviço oferecidas',
    'Atrair estudos internacionais / patrocinadores globais',
  ]},
  { theme: 'Qualidade e conformidade', items: [
    'Reduzir achados em auditorias e inspeções',
    'Fortalecer o sistema de gestão da qualidade (SGQ)',
    'Garantir conformidade nas atribuições assumidas perante a Anvisa',
    'Fortalecer a integridade e a rastreabilidade dos dados',
  ]},
  { theme: 'Desempenho operacional', items: [
    'Encurtar o start-up dos estudos (primeiro centro ativado)',
    'Melhorar o desempenho de recrutamento dos centros geridos',
    'Cumprir prazos e marcos contratados com o cliente',
    'Melhorar a qualidade e o prazo das visitas de monitoria',
  ]},
  { theme: 'Financeiro e sustentabilidade', items: [
    'Aumentar o faturamento',
    'Melhorar a margem por projeto',
    'Melhorar a previsibilidade e o fluxo de caixa',
    'Melhorar a precificação (tabela de custos e overhead)',
  ]},
  { theme: 'Pessoas e conhecimento', items: [
    'Reduzir a dependência de pessoas-chave (reter conhecimento em processos)',
    'Estruturar capacitação em BPC e nos protocolos',
    'Melhorar a retenção da equipe',
    'Dimensionar a equipe por dado (utilização e carga real)',
  ]},
  { theme: 'Clientes e reputação', items: [
    'Melhorar a satisfação e a retenção de clientes',
    'Construir reputação técnica e ser referência em uma linha de serviço',
    'Fortalecer o relacionamento com centros parceiros',
  ]},
]

export async function seedCatalogoOrpc(): Promise<{
  published: string[]
  objetivos: number
  totalArtefatos: number
  pendentesValidacao: number
  tiposInferidos: Record<string, number>
}> {
  const parsed: ParsedProcess[] = []
  for (const [i, arquivo] of LEVAS.entries()) {
    const conteudo = fs.readFileSync(path.join(CONTEUDO_DIR, arquivo), 'utf8')
    parsed.push(...parseLeva(conteudo, i))
  }
  if (parsed.length !== 29) {
    throw new Error(`Parser encontrou ${parsed.length} processos ORPC; esperados 29 — conferir levas.`)
  }

  const published: string[] = []
  let totalArtefatos = 0
  let pendentesValidacao = 0
  const tiposInferidos: Record<string, number> = {}

  for (const [idx, p] of parsed.entries()) {
    const code = `O${idx + 1}`
    totalArtefatos += p.artifacts.length
    pendentesValidacao += p.artifacts.filter((a) => a.seals.includes('A') || a.seals.includes('I')).length
    for (const a of p.artifacts) tiposInferidos[a.type] = (tiposInferidos[a.type] ?? 0) + 1

    let process = await contentRepository.findProcessByCode(code)
    if (!process) {
      const { id } = await contentService.createProcess({
        code,
        name: p.name,
        processGroup: p.group,
        orgType: 'orpc',
        oneLineDescription: p.oneLine,
        objectiveText: p.objective,
      })
      process = await contentRepository.findProcessById(id)
    }
    const processId = process!.get('id') as number
    if (await contentRepository.findPublishedVersion(processId)) continue

    let draft = await contentRepository.findDraftVersion(processId)
    if (!draft) {
      await contentService.createDraft(processId, null)
      draft = await contentRepository.findDraftVersion(processId)
    }
    const draftId = draft!.get('id') as number

    // Chaves estáveis: slug do título; sufixo de nível em caso de colisão.
    const usadas = new Set<string>()
    const graph: DraftGraphInput = {
      levels: [
        { number: 1, description: p.level1 },
        { number: 2, description: null },
        { number: 3, description: null },
        { number: 4, description: null },
        { number: 5, description: null },
      ],
      artifacts: p.artifacts.map((a) => {
        let key = slugify(a.title)
        if (usadas.has(key)) key = `${key}-n${a.level}`.slice(0, 80)
        usadas.add(key)
        return {
          logicalKey: key,
          typeCode: a.type,
          title: a.title,
          dodText: a.dod,
          seals: [...new Set(a.seals)],
          conditionCode: a.conditionCode,
          ownLevel: a.level,
          ownClassification: a.cls,
        }
      }),
    }
    await contentService.saveDraft(draftId, graph)
    await contentService.publish(draftId, null)
    published.push(`${code} ${p.name}`)
  }

  let objetivos = 0
  for (const grupo of OBJETIVOS_ORPC) {
    for (const name of grupo.items) {
      await objectiveRepository.findOrCreate(grupo.theme, name, 'orpc')
      objetivos++
    }
  }

  return { published, objetivos, totalArtefatos, pendentesValidacao, tiposInferidos }
}

if (require.main === module) {
  seedCatalogoOrpc()
    .then((r) => {
      // eslint-disable-next-line no-console
      console.log(
        [
          r.published.length
            ? `Catálogo ORPC: ${r.published.length} processos publicados.`
            : 'Catálogo ORPC já estava publicado — nada a fazer.',
          `Artefatos no catálogo: ${r.totalArtefatos} (itens [A]/[I] pendentes de validação humana: ${r.pendentesValidacao}).`,
          `Objetivos ORPC garantidos: ${r.objetivos} (proposta [D] — validar).`,
          `Tipos inferidos: ${JSON.stringify(r.tiposInferidos)}`,
        ].join('\n'),
      )
      process.exit(0)
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Falha no seed do catálogo ORPC:', err)
      process.exit(1)
    })
}
