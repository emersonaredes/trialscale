# TrialScale — Handoff v4: textos instrutivos no detalhe do processo

Aplicar em `apps/web` + API. Protótipo de referência: `TrialScale App v3 -fluxo-.dc.html`, tela **Processos → clique num processo**.
Conteúdo-fonte: `uploads/textos_instrutivos_leva1.md` (leva 1 — 5 processos: 2.5 Produto sob Investigação, 1.1 Prospectar Estudos, 6 Conduzir Compras, 7 Gerenciar Equipe, 8 Gerenciar Infraestrutura).

## Objetivo
`ProcessoDetailPage` hoje entrega só a checklist de artefatos. Ela precisa também **ensinar**: por que o processo importa, como ele funciona, o que cada artefato resolve, o que dá errado sem ele e por onde começar — sem afogar a ação (marcar artefato) em texto.

## 1. Modelo de dados (CMS + API)

### 1.1 Tabelas novas
```sql
-- Texto instrutivo por processo (1:1, versionado pelo CMS existente)
create table process_guide (
  process_id        int primary key references processes(id),
  purpose_md        text not null,          -- "Propósito do processo" (2 parágrafos)
  flow_inputs       jsonb not null default '[]',   -- string[]
  flow_activities   jsonb not null default '[]',   -- string[]
  flow_outputs      jsonb not null default '[]',   -- string[]
  indicators        jsonb not null default '[]',   -- string[]
  risks             jsonb not null default '[]',   -- string[]  (1 frase por risco)
  practices         jsonb not null default '[]',   -- {title, text}[]
  regulatory        jsonb not null default '[]',   -- {source, text, url}[]
  getting_started   jsonb not null default '[]',   -- string[]  (3 passos)
  source_citation   text,                          -- referência da tese
  updated_at        timestamptz not null default now()
);

-- Por que cada artefato existe (trecho de "Artefatos e sua função")
alter table artifacts add column why_it_matters text;
```

Ambos entram no fluxo de versionamento do CMS (`CmsVersionPage`) — o texto é conteúdo editorial, não código.

### 1.2 Contrato (`features/processes/api.ts`)
```ts
export interface ProcessGuide {
  purposeMd: string
  flow: { inputs: string[]; activities: string[]; outputs: string[] }
  indicators: string[]
  risks: string[]
  practices: Array<{ title: string; text: string }>
  regulatory: Array<{ source: string; text: string; url?: string }>
  gettingStarted: string[]
  sourceCitation: string | null
}

// ArtifactStatus ganha:
whyItMatters: string | null

// ProcessDetail ganha:
guide: ProcessGuide | null
```
`GET /api/processes/:id` passa a incluir `guide` e `whyItMatters`. `guide: null` é estado válido (processos sem texto ainda) — a UI omite as seções.

## 2. UI — `ProcessoDetailPage.tsx`

Layout: `grid-template-columns: minmax(0,1fr) 240px; gap:12px; align-items:start`. Coluna direita é sticky (`position:sticky; top:16px`) e some abaixo de 1000px (empilha).

Ordem na coluna principal:

**a) `PorQueImporta`** — cartão branco com `border-left:4px solid var(--azul-600)`, título "Por que este processo importa", 2 parágrafos de `purposeMd` a `font-size:13px; line-height:1.62; text-wrap:pretty`. Sempre aberto — é a primeira coisa que o usuário lê.

**b) `SecaoColapsavel` (novo componente compartilhado)** — cabeçalho clicável com título + `+`/`−`, borda `--azul-200` quando aberta e `--borda` quando fechada.
```tsx
export function SecaoColapsavel({ titulo, aberta: inicial = false, children }) { … }
```
Usada em: **Como o processo funciona** (aberta por padrão), **Riscos da execução inadequada**, **Boas práticas recomendadas**, **Atualizações regulatórias** (fechadas).

**c) Conteúdo de "Como o processo funciona"** — 3 colunas de chips:
- Entradas: fundo `#f2f7f9`, borda `--borda`
- Atividades: fundo `var(--azul-50)`, borda `var(--azul-200)`, texto `--azul-900`
- Saídas: fundo `var(--verde-50)`, borda `var(--verde-100)`
Abaixo, separado por `border-top`, "Indicadores propostos" como pills de borda tracejada.

**d) Artefatos por nível** (mantém a estrutura atual, `LevelBadge` + contagem de completos) — cada artefato ganha, sob o `dodText`:
```tsx
{a.whyItMatters && (
  <div className="porque-importa">
    <b>Por que importa · </b>{a.whyItMatters}
  </div>
)}
```
```css
.porque-importa { margin-top:6px; background:#f7fafb; border-left:2px solid var(--azul-200);
  border-radius:0 6px 6px 0; padding:6px 10px; font-size:12px; line-height:1.55;
  color:var(--texto); text-wrap:pretty; }
.porque-importa b { color:var(--azul-600); }
```

**e) Riscos** — lista com dot `var(--coral)` de 6px. **Boas práticas** — grid 2 colunas de mini-cartões (`title` bold + `text` em apoio). **Regulatórias** — por item: `source` em uppercase `--azul-600` 11px + texto; `url` vira link no source.

Coluna direita (sticky):
- **"Comece por aqui"** — cartão gradiente `--azul-900 → --azul-600`, 3 passos numerados **1-based** (badge circular translúcido) + botão `.avancar` "Colocar numa rodada →" (largura total).
- **Fonte** — cartão branco com `sourceCitation` em 11px apoio.

## 3. Migração do conteúdo

O markdown tem 6 seções fixas por processo. Mapeamento direto:

| Seção do .md | Campo |
| --- | --- |
| Propósito do processo | `purpose_md` |
| Como o processo funciona | `flow_*` + `indicators` (extrair as listas; o texto corrido vira as chips) |
| Artefatos e sua função | 1 parágrafo → `artifacts.why_it_matters` do artefato correspondente (casar por `logical_key`) |
| Riscos da execução inadequada | `risks[]` — quebrar em 1 frase por risco |
| Boas práticas recomendadas | `practices[]` — cada recomendação vira `{title, text}` |
| Atualizações regulatórias | `regulatory[]` — preservar fonte + URL |
| (derivado) | `getting_started[]` — 3 primeiros passos, extraídos das boas práticas |

Sugestão: script de seed `packages/api/scripts/seed-guides.ts` lendo os .md por processo (`# <nome>` como delimitador), para que as próximas levas entrem sem trabalho manual.

**Regra editorial:** o texto da tese é a fonte; atualizações normativas ficam **sempre** na seção `regulatory`, nunca misturadas ao corpo — é o que mantém a rastreabilidade da fonte.

## 4. Ordem de implementação
1. Migração + coluna `why_it_matters` + seed da leva 1
2. API: `guide` no `GET /api/processes/:id`
3. `SecaoColapsavel` + CSS (`.porque-importa`, chips de fluxo, rail sticky)
4. `ProcessoDetailPage` (composição acima)
5. CMS: edição de `process_guide` na versão de conteúdo
