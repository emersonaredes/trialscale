/**
 * Seed dos TEXTOS INSTRUTIVOS (handoff v4): parser dos arquivos
 * docs/conteudo/textos_instrutivos_leva1..4.md (22 processos; 5/9/10-13
 * ainda sem texto → guide null, estado válido).
 *
 * Estratégia (o conteúdo é PROSA):
 *  - purpose_md, flow_md, risks, practices, regulatory: das levas (por seção).
 *  - flow_inputs/activities/outputs/indicators (chips): parseados das linhas
 *    "Base (tese)" dos docs de conteúdo (conteudo_processos_*); 2.5 vem da
 *    concepção §9 (hardcoded).
 *  - why_it_matters por artefato: heurística de aderência de tokens entre o
 *    título do artefato e os parágrafos de "Artefatos e sua função"
 *    (threshold; sem casamento → null). Taxa reportada no final.
 *  - getting_started: 3 primeiras boas práticas (regra do handoff).
 * Regra editorial: normas SEMPRE em regulatory (rastreabilidade da fonte).
 * Idempotente (upsert). Re-rodar aplica textos revisados nos .md.
 */
import fs from 'node:fs'
import path from 'node:path'
import { contentRepository } from '../repositories/content-repository'
import { guideRepository } from '../repositories/guide-repository'

const CONTEUDO_DIR = path.resolve(__dirname, '../../../../docs/conteudo')
const LEVAS = [
  'textos_instrutivos_leva1.md',
  'textos_instrutivos_leva2.md',
  'textos_instrutivos_leva3.md',
  'textos_instrutivos_leva4.md',
]
const DOCS_BASE = [
  'conteudo_processos_mvp.md',
  'conteudo_processos_centrais.md',
  'conteudo_processos_suporte_gestao.md',
]

/** Leva 1 não traz o código no título. */
const ALIAS_LEVA1: Record<string, string> = {
  'gerenciar produto sob investigacao': '2.5',
  'prospectar estudos': '1.1',
  'conduzir compras': '6',
  'gerenciar equipe': '7',
  'gerenciar infraestrutura': '8',
}

const CITACAO =
  'AREDES, Emerson Lima. Framework de processos para a gestão de centros de pesquisa clínica. ' +
  'Tese (Doutorado) — FEA-RP/USP, 2020.'

// ------------------------------------------------------------------ helpers
export function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Remove marcação markdown básica (negrito e links) preservando o texto. */
export function plainText(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Divisão de sentenças (heurística pt-BR; boa o suficiente para prosa editorial). */
export function splitSentences(text: string): string[] {
  return plainText(text)
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15)
}

/** Boas práticas: "Título: texto." quando houver dois-pontos cedo. */
export function toPractice(sentence: string): { title: string; text: string } {
  const idx = sentence.indexOf(':')
  if (idx > 8 && idx < 90) {
    return { title: sentence.slice(0, idx).trim(), text: sentence.slice(idx + 1).trim() }
  }
  const words = sentence.split(' ')
  return { title: words.slice(0, 5).join(' ') + '…', text: sentence }
}

const FONTE_REGEX =
  /(ICH\s?E6\s?\(R3\)|ICH\s?E6\s?\(R2\)|RDC\s+(?:n[ºo°]?\s*)?\d+\/\d+|Lei\s+(?:n[ºo°]?\s*)?[\d.]+\/\d+|CNS\s+\d+\/\d+|Plataforma Brasil|CEP\/CONEP|LGPD|IATA|ISBER|ISO\s?\d+)/i

export function toRegulatory(sentence: string, raw: string): { source: string; text: string; url?: string } {
  const urlMatch = raw.match(/\]\((https?:\/\/[^)]+)\)/)
  const fonte = sentence.match(FONTE_REGEX)
  return {
    source: fonte ? fonte[0].replace(/\s+/g, ' ').toUpperCase() : 'NOTA',
    text: sentence,
    ...(urlMatch ? { url: urlMatch[1] } : {}),
  }
}

const STOPWORDS = new Set(['para', 'como', 'pelo', 'pela', 'sobre', 'entre', 'este', 'esta', 'cada'])
export function titleTokens(title: string): string[] {
  return norm(title)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
}

// ------------------------------------------------------- parser das levas
interface GuideSections {
  code: string
  purpose: string
  flowMd: string
  artifactsSection: string
  risksText: string
  practicesText: string
  regulatoryText: string
}

export function parseLeva(md: string): GuideSections[] {
  const blocos = md.split(/\n(?=# )/).slice(1) // descarta o preâmbulo
  const out: GuideSections[] = []
  for (const bloco of blocos) {
    const tituloLinha = bloco.split('\n')[0]!.replace(/^#\s*/, '').trim()
    const comCodigo = tituloLinha.match(/^([\d.]+)\s+(.*)$/)
    const code = comCodigo ? comCodigo[1]! : (ALIAS_LEVA1[norm(tituloLinha)] ?? '')
    if (!code) continue

    const secoes = new Map<string, string>()
    for (const parte of bloco.split(/\n(?=## )/).slice(1)) {
      const nome = norm(parte.split('\n')[0]!.replace(/^##\s*/, ''))
      secoes.set(nome, parte.split('\n').slice(1).join('\n').trim())
    }
    const pegar = (prefixo: string) =>
      [...secoes.entries()].find(([k]) => k.startsWith(prefixo))?.[1] ?? ''

    out.push({
      code,
      purpose: pegar('proposito do processo'),
      flowMd: pegar('como o processo funciona'),
      artifactsSection: pegar('artefatos e sua funcao'),
      risksText: pegar('riscos da execucao inadequada'),
      practicesText: pegar('boas praticas recomendadas'),
      regulatoryText: pegar('atualizacoes regulatorias'),
    })
  }
  return out
}

// --------------------------------------------- chips do fluxo (Base da tese)
const FLOW_25 = {
  inputs: ['Agenda de visitas', 'Pedido de dispensação', 'Estoque de produtos'],
  activities: [
    'Receber PI', 'Armazenar', 'Controlar estoque', 'Controlar ambiente',
    'Controlar prescrições', 'Dispensar', 'Calcular aderência',
    'Solicitar reposição', 'Descartar/retornar/destruir',
    'Reportar evento adverso à farmacovigilância',
  ],
  outputs: ['PI dispensado', 'Relatório de farmacovigilância'],
  indicators: [
    'Participantes sem o PI na hora correta',
    'Tempo para reposição de estoque',
    'Aderência ao uso do PI',
  ],
}

function extrairSegmento(base: string, labels: string[], todosLabels: string[]): string | null {
  for (const label of labels) {
    const inicio = base.indexOf(label)
    if (inicio === -1) continue
    let fim = base.length
    for (const outro of todosLabels) {
      if (labels.includes(outro)) continue
      const pos = base.indexOf(outro, inicio + label.length)
      if (pos !== -1 && pos < fim) fim = pos
    }
    return base.slice(inicio + label.length, fim).trim()
  }
  return null
}

function segmentoParaLista(seg: string | null): string[] {
  if (!seg) return []
  const limpo = plainText(seg).replace(/\.$/, '')
  const porPontoEVirgula = limpo.split(/;|·/).map((s) => s.trim()).filter((s) => s.length > 2)
  if (porPontoEVirgula.length > 1) return porPontoEVirgula.map(capitalizar)
  // fallback: vírgulas quando o texto é uma enumeração longa sem ';'
  if (limpo.length > 60 && limpo.includes(', ')) {
    return limpo.split(', ').map((s) => capitalizar(s.trim())).filter((s) => s.length > 2)
  }
  return [capitalizar(limpo)]
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const LABELS = [
  'Entradas:', 'Entrada:', 'Atividades:', 'Atividades (ciclo BPM):', 'Saídas:', 'Saída:',
  'Indicadores (da tese):', 'Indicadores:', 'Indicador:', 'Regras:', 'Regra:',
  'Recursos:', 'Recurso:', 'Observação', 'Nota', 'Alerta', 'Acionado', 'Aciona',
]

export function parseFlowFromBase(base: string) {
  return {
    inputs: segmentoParaLista(extrairSegmento(base, ['Entradas:', 'Entrada:'], LABELS)),
    activities: segmentoParaLista(
      extrairSegmento(base, ['Atividades (ciclo BPM):', 'Atividades:'], LABELS),
    ),
    outputs: segmentoParaLista(extrairSegmento(base, ['Saídas:', 'Saída:'], LABELS)),
    indicators: segmentoParaLista(
      extrairSegmento(base, ['Indicadores (da tese):', 'Indicadores:', 'Indicador:'], LABELS),
    ),
  }
}

function carregarFlows(): Map<string, ReturnType<typeof parseFlowFromBase>> {
  const flows = new Map<string, ReturnType<typeof parseFlowFromBase>>()
  flows.set('2.5', FLOW_25)
  for (const arquivo of DOCS_BASE) {
    const md = fs.readFileSync(path.join(CONTEUDO_DIR, arquivo), 'utf8')
    for (const bloco of md.split(/\n(?=## )/)) {
      const titulo = bloco.split('\n')[0] ?? ''
      const m = titulo.match(/^##\s+([\d.]+)\s+/)
      if (!m) continue
      const baseLinha = bloco
        .split('\n')
        .find((l) => l.startsWith('**Base (tese):**') || l.startsWith('**Caracterização base (tese):**'))
      if (!baseLinha) continue
      flows.set(m[1]!, parseFlowFromBase(plainText(baseLinha.replace(/^\*\*[^*]+\*\*/, ''))))
    }
  }
  return flows
}

// ------------------------------------------------------------------- seed
export async function seedGuides(): Promise<{
  guides: number
  artifactsMatched: number
  artifactsTotal: number
  semProcesso: string[]
}> {
  const flows = carregarFlows()
  let guides = 0
  let artifactsMatched = 0
  let artifactsTotal = 0
  const semProcesso: string[] = []

  for (const leva of LEVAS) {
    const md = fs.readFileSync(path.join(CONTEUDO_DIR, leva), 'utf8')
    for (const g of parseLeva(md)) {
      const process = await contentRepository.findProcessByCode(g.code)
      if (!process) {
        semProcesso.push(g.code)
        continue
      }
      const processId = process.get('id') as number
      const flow = flows.get(g.code)
      const practices = splitSentences(g.practicesText).map(toPractice)
      const regulatorySentences = splitSentences(g.regulatoryText)

      await guideRepository.upsert({
        process_id: processId,
        purpose_md: g.purpose,
        flow_md: g.flowMd || null,
        flow_inputs: flow?.inputs ?? [],
        flow_activities: flow?.activities ?? [],
        flow_outputs: flow?.outputs ?? [],
        indicators: flow?.indicators ?? [],
        risks: splitSentences(g.risksText),
        practices,
        regulatory: regulatorySentences.map((s) => toRegulatory(s, g.regulatoryText)),
        getting_started: practices.slice(0, 3).map((p) => (p.text ? `${p.title}: ${p.text}` : p.title)),
        source_citation: CITACAO,
      })
      guides++

      // why_it_matters: melhor parágrafo por aderência de tokens do título
      const published = await contentRepository.findPublishedVersion(processId)
      if (!published) continue
      const artifacts = await contentRepository.findArtifactsByVersion(published.get('id') as number)
      const paragrafos = g.artifactsSection.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 60)
      for (const artifact of artifacts) {
        artifactsTotal++
        const tokens = titleTokens(artifact.get('title') as string)
        let melhor: { score: number; texto: string } = { score: 0, texto: '' }
        for (const paragrafo of paragrafos) {
          const alvo = norm(paragrafo)
          const score = tokens.filter((t) => alvo.includes(t)).length
          if (score > melhor.score) melhor = { score, texto: paragrafo }
        }
        const minimo = tokens.length <= 2 ? 1 : 2
        if (melhor.score >= minimo) {
          await guideRepository.setArtifactWhy(artifact.get('id') as number, plainText(melhor.texto))
          artifactsMatched++
        }
      }
    }
  }
  return { guides, artifactsMatched, artifactsTotal, semProcesso }
}

if (require.main === module) {
  seedGuides()
    .then(({ guides, artifactsMatched, artifactsTotal, semProcesso }) => {
      // eslint-disable-next-line no-console
      console.log(
        `Guias: ${guides} processos com texto instrutivo. ` +
          `"Por que importa": ${artifactsMatched}/${artifactsTotal} artefatos casados (heurística — revisar via CMS).` +
          (semProcesso.length ? ` Sem processo no catálogo: ${semProcesso.join(', ')}.` : ''),
      )
      process.exit(0)
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Falha no seed de guias:', err)
      process.exit(1)
    })
}
