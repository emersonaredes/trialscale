# TrialScale — Proposta v3 "Fluxo & Próximos Passos"

Handoff para aplicar no repo `emersonaredes/trialscale` (apps/web). Protótipo de referência: `TrialScale App v3 -fluxo-.dc.html`.

## Conceito
O produto é uma jornada sequencial (Objetivos → Termômetro → Fotografia → Raio-X → Priorização → Rodada), mas a UI atual trata as telas como seções paralelas. A v3:
1. **Sidebar vira trilha** — passos numerados com estado (feito ✓ / atual pulsando / bloqueado), ligados por linha vertical que "pinta" de verde conforme avança.
2. **Faixa de evolução persistente** — topbar em toda tela: nível geral em 5 segmentos coloridos pela escala da logo + delta do mês.
3. **Home vira cockpit** — um único CTA hero "próximo passo" calculado do estado real.
4. **Cada tela termina puxando a próxima** — cards "Próximo passo" com CTA gradiente celebração.
5. **Fotografia vira matriz dor × estratégia** — scatter em quadrantes relacionando processos, objetivos e dor.

## 1. Layout.tsx — trilha lateral
Substituir os `NavLink` planos por itens de passo. Estado calculado dos mesmos dados já buscados (my-objectives, thermometer, round):

```tsx
type EstadoPasso = 'feito' | 'atual' | 'aberto' | 'bloqueado'
// 1 Objetivos: feito se myObjectives.length > 0
// 2 Termômetro: feito se answered === total; senão atual
// 3 Fotografia: atual quando termômetro completo; aberto (parcial) antes
// 4 Raio-X (/processos): aberto (pago); bloqueado no gratuito
// 5 Priorização: aberto após fotografia; bloqueado antes
// 6 Rodada: aberto (pago)
```

Item da trilha (estrutura):
```tsx
<NavLink to={rota} className={({isActive}) => `passo ${estado} ${isActive ? 'ativo' : ''}`}>
  <span className="coluna-dot">
    <span className="dot">{estado === 'feito' ? '✓' : ''}</span>
    <span className="linha" />
  </span>
  <span>
    <span className="nome">{n}. {nome}</span>
    <span className="meta">{meta}</span>  {/* ex.: "7/12 respondidos" */}
  </span>
</NavLink>
```

CSS (adicionar ao index.css):
```css
@keyframes ts-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(33,158,201,.5)} 50%{box-shadow:0 0 0 7px rgba(33,158,201,0)} }
.sidebar .passo { display:flex; gap:10px; padding:0 6px; border-radius:8px; }
.sidebar .passo .coluna-dot { display:flex; flex-direction:column; align-items:center; width:16px; flex:none; }
.sidebar .passo .dot { width:14px; height:14px; border-radius:50%; margin-top:9px; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:800; color:var(--azul-900); border:2px solid rgba(255,255,255,.45); box-sizing:border-box; }
.sidebar .passo .linha { width:2px; flex:1; min-height:14px; background:rgba(255,255,255,.18); margin:3px 0; }
.sidebar .passo:last-of-type .linha { background:transparent; }
.sidebar .passo.feito .dot { background:var(--verde-500); border-color:var(--verde-500); }
.sidebar .passo.feito .linha { background:var(--verde-500); }
.sidebar .passo.atual .dot { background:var(--azul-500); border-color:var(--azul-500); animation:ts-pulse 2s ease infinite; }
.sidebar .passo.bloqueado { opacity:.45; pointer-events:none; }
.sidebar .passo .nome { display:block; font-size:13px; font-weight:600; color:#fff; }
.sidebar .passo .meta { display:block; font-size:11px; color:#8fb4c4; }
.sidebar .passo.ativo { background:rgba(255,255,255,.1); }
```
Nota: remover o estilo `.sidebar a.ativo { background:var(--azul-600) }` para os passos (o destaque agora é sutil; o estado do passo é a informação dominante).

## 2. Topbar — faixa de evolução (novo componente `EvolucaoStrip`)
Renderizar no Layout, acima do `<Outlet/>`. Consome `overview.overallLevel` (pago) — no gratuito mostrar progresso da jornada (% de passos feitos) no lugar do nível.

```tsx
<div className="topbar">
  <span className="onde">Você está em <b>{nomeTela}</b></span>
  <div className="evolucao">
    <span className="rotulo">Nível geral</span>
    {[1,2,3,4,5].map(i => (
      <span key={i} className="seg"><span style={{ width: `${clamp((nivel-(i-1))*100,0,100)}%`, background: `var(--nivel-${i})` }} /></span>
    ))}
    <b className="valor">{nivel.toFixed(1)}</b>
    <span className="delta">▲ +0,3 este mês</span> {/* delta real: comparar snapshot mensal */}
  </div>
</div>
```
```css
.topbar { background:var(--superficie); border-bottom:1px solid var(--borda); padding:10px 28px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
.topbar .evolucao { display:flex; align-items:center; gap:12px; }
.topbar .seg { width:26px; height:8px; border-radius:999px; background:var(--divisor); overflow:hidden; display:block; }
.topbar .seg > span { display:block; height:100%; border-radius:999px; }
.topbar .valor { font-family:var(--fonte-titulo); font-size:16px; color:var(--ink); }
.topbar .delta { background:var(--verde-50); color:var(--verde-700); border:1px solid var(--verde-100); border-radius:999px; padding:1px 8px; font-size:11px; font-weight:700; }
```

## 3. HomePage.tsx — cockpit do próximo passo
Substituir o grid de 3 cards estáticos por:

**a) Hero "Seu próximo passo"** (gradiente azul-900→600, CTA gradiente celebração):
- Cadeia de decisão: termômetro incompleto → "Termine o termômetro (faltam N)"; completo e fotografia não vista → "Revele a fotografia"; vista → "Abra o Raio-X das suas maiores dores"; rodada ativa → "Continue a Rodada N".
```css
.hero-passo { background:linear-gradient(135deg,var(--azul-900),var(--azul-600)); border-radius:var(--raio-card); padding:20px 22px; color:#fff; position:relative; overflow:hidden; }
.hero-passo .eyebrow { font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:#7acbe8; font-weight:700; }
.hero-passo h1 { font-size:20px; color:#fff; }
button.avancar { background:var(--grad-celebracao); border-radius:999px; font-weight:700; padding:9px 20px; box-shadow:0 4px 14px rgba(242,107,78,.35); }
```

**b) Mapa horizontal da jornada** — mesmos 6 passos da trilha, nós de 30px ligados por linha (verde no trecho feito), clicáveis.

**c) Grid 1.2fr/1fr**: "Onde mais dói hoje" (top 3 dores com barra colorida por `corDaDor`) + "Conquistas recentes" (artefatos completados, subidas de nível — dot verde + timestamp).

## 4. TermometroPage.tsx
- Dot de status por linha (cor = `corDaDor(score)`, vazio se sem resposta).
- Ao completar 12/12: banner gradiente `--grad-marca` com CTA branco "Revelar minha fotografia →" (já existe parcialmente; promover a banner full-width com animação de entrada).

## 5. FotografiaPage.tsx — matriz dor × estratégia (redesign)
Substituir as listas por scatter em quadrantes:
- **Eixo Y** = dor declarada (1–5, invertido: dor 5 no topo). **Eixo X** = relevância estratégica do processo (derivada dos objetivos priorizados: soma ponderada pela ordem — reutilizar a ponderação da priorização, normalizada 0–5).
- **Ponto** = círculo 36px com o `code` mono, `background: corDaDor(score)`, borda branca 2px, tooltip com nome + dor + objetivos ligados.
- **Quadrantes** (fundos suaves + rótulo 10px uppercase, `max-width:44%` para não colidir):
  - sup. dir. `#fde7e1` 75%: **Atacar agora** (#b3402a)
  - sup. esq. `#fde7e1` 40%: **Dói, fora dos objetivos** (#c97b64)
  - inf. dir. `#eaf7fc` 60%: **Estratégico · dor baixa** (var(--azul-600))
  - inf. esq.: **Observar** (cinza)
- Linhas medianas: 1px dashed `#c9d6dd` a 50%.
- Posição: `left: 6 + (rel/5)*88 %` · `top: 94 - (dor/5)*82 %`, `transform: translate(-50%,-50%)`; hover `scale(1.15)`.
- **Painel lateral "Seus objetivos"** (272px): lista rankeada; clique alterna destaque — pontos não ligados ao objetivo caem para `opacity:.12` (transition .2s). Meta por objetivo: "N processos · dor média X,X" (singular "1 processo").
- Processos sem resposta: rodapé "Fora da matriz: C04, S02… — completar agora" (link p/ termômetro).
- Fechar com card "Próximo passo → Abrir Raio-X das 3 maiores dores".

## 6. Cards "Próximo passo" (padrão reutilizável)
```css
.proximo-passo { background:var(--superficie); border:1.5px solid var(--azul-200); border-radius:var(--raio-card); padding:14px 18px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
.proximo-passo .eyebrow { font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:var(--azul-600); font-weight:700; }
```
Usar em: Fotografia → Raio-X; Processos (Raio-X) → "Montar rodada com estes"; Rodada concluída → "Escolher a próxima rodada" (já existe na celebração).

## 7. RodadaPage.tsx
Promover a linha de progresso (baseline → atual) a seção própria acima do kanban: uma linha por processo com `LevelBadge` de→para (o "de" com opacity .55), barra de essenciais e status ("✓ subiu de nível!" verde / "faltam N essenciais").

## Ordem sugerida de implementação
1. CSS novo no index.css (trilha, topbar, hero, proximo-passo, matriz)
2. Layout.tsx (trilha + topbar) — precisa dos queries thermometer/my-objectives no shell (leve; já cacheados pelo react-query)
3. HomePage (cockpit)
4. FotografiaPage (matriz)
5. Termômetro/Rodada (ajustes menores)
