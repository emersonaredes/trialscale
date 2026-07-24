# TrialScale Design System — v1.1 (jul 2026)

Guia de referência para implementação. Siga estritamente estes tokens e regras em qualquer UI do projeto.

## Marca
- Personalidade: parceira de jornada — calorosa no convite, técnica no conteúdo, festiva na conquista.
- Princípios: encoraja, não cobra ("Inicial", nunca "Inexistente") · celebra de verdade (cor e movimento só nos momentos de vitória) · guia, não certifica (sempre "autodeclarado", nunca visual de carimbo/certificação).
- Dialoga com a Polo Trial (azuis profundos) + cores de energia (verde, âmbar, coral).

## Tipografia
- Títulos: **Sora** (Google Fonts) — 600/700/800, letter-spacing -0.02em em displays.
- Corpo e UI: **Public Sans** — 400/500/600/700.
- Dados/tokens/códigos de processo: **IBM Plex Mono** — 400/500.
- Escala: display 32/800 · h1 24/700 · h2 18/600 · corpo 14.5/400 (line-height 1.6) · apoio 12.5 · mono 12.
- Títulos de conquista podem usar gradiente de texto azul→verde (`linear-gradient(90deg,#0F81AC,#17B583)`).

## Cores
### Azul Trial (primária — ações, navegação, links)
50 #EAF7FC · 100 #D2EEF8 · 200 #A5DCF0 · 400 #4FB3DC · 500 #219EC9 · **600 #0F81AC (ação padrão)** · 700 #0D6689 (hover) · 900 #0A3A4E (superfícies escuras, sidebar)

### Verde Ascensão (exclusivo de progresso/conquista — nunca em botões comuns)
#E8FBF3 · #B9EFDB · #4CCBA0 · **#17B583 ★** · #0F9169

### Cores de energia (destaques, celebração, gamificação)
Âmbar #F5A623 (claro #FEF3DC) · Coral #F26B4E (claro #FDE7E1, escuro #E05B3D)
Gradiente de celebração: `linear-gradient(90deg,#F5A623,#F26B4E)` — só em conquistas.

### Neutros
Ink (títulos) #14242E · corpo #3A4A54 · secundário #6B7B85 · bordas #DCE4E9 · fundo página #F7FAFB · superfícies #FFFFFF

### Semânticas
Sucesso/completo #17B583 · atenção/em elaboração #F5A623 · erro/atraso #D6493C · informação #219EC9

## Espaçamento & forma
- Base 4px: xs 4 · sm 8 · md 16 · lg 24 · xl 32 · 2xl 48. Densidade média.
- Raios: 8 inputs · 10 botões · 14 cards · 20 modal · pill (999px) badges.
- Sombras: sombra-1 `0 1px 3px rgba(10,58,78,.10)` · sombra-2 `0 4px 14px rgba(10,58,78,.14)` · sombra-3 (modal) `0 12px 32px rgba(10,58,78,.20)`.
- Links: cor #0F81AC, hover #0D6689 com sublinhado.

## Ícones
Phosphor Icons, peso regular (traço ~1.5–1.8px); variante duotone com cores de energia em momentos de conquista. Tamanhos 16/20/24. Cor padrão #6B7B85; ativo #0F81AC.

## Voz & tom
Informal encorajador, fala com "você". Entusiasmo genuíno nas vitórias (um 🎉 na hora certa), clareza técnica sem juridiquês.
- ✓ "Aê! Nível 3 em Gerenciar amostras biológicas 🎉" · "Faltam só 2 artefatos essenciais — você está pertinho."
- ✕ Euforia vazia ("PARABÉNS!!! 🎉🎉🎉") · burocratês ("encontra-se em desconformidade") · **nunca** "certificado" (é autoavaliação).

## Níveis de maturidade — escala oficial: C "Arco-íris da jornada"
Badge pill, número em Sora 800 + nome:
- 1 Inicial — bg #C3CCD3, texto #14242E
- 2 Informal — bg #F26B4E, texto #fff
- 3 Definido — bg #F5A623, texto #4A3000
- 4 Gerenciado — bg #219EC9, texto #fff
- 5 Otimizado — bg #17B583, texto #fff

## Estados de artefato (kanban)
- Não iniciado: pill bg #F7FAFB, borda #DCE4E9, texto #6B7B85, dot #C3CCD3
- Em elaboração: pill bg #FEF3DC, borda #F5C878, texto #8A5E17, dot #F5A623 (aceita data limite)
- Completo: pill bg #B9EFDB, borda #4CCBA0, texto #0F9169, dot #17B583 (só este conta para o nível)

## Selos de origem
- NORMA: bg #0A3A4E, texto branco (peso máximo, nunca parece opcional)
- GCP: bg #EAF7FC, texto #0D6689, borda #A5DCF0
- SUGESTÃO: bg #F7FAFB, texto #6B7B85, borda #DCE4E9
Formato: retângulo raio 6, 11px, weight 700, caps, letter-spacing 0.04em.
Essencial × complementar: quadrado 10px preenchido #0F81AC vs. outline #A5DCF0.

## Componentes (regras)
### Botão
- Primário: bg #0F81AC, hover #0D6689, texto #fff, raio 10, padding 11/20, weight 600. **1 por tela.**
- Secundário: outline 1.5px #A5DCF0, texto #0F81AC, hover bg #EAF7FC.
- Ghost: texto #0F81AC, hover bg #EAF7FC.
- Completar: bg #17B583, hover #0F9169 (exclusivo de completar/conquistar).
- Celebração: gradiente âmbar→coral, pill, sombra colorida — só fim de rodada / subida de nível.
- Destrutivo: sempre outline (#D6493C / borda #EBB4AC). Desabilitado: bg #DCE4E9, texto #8A99A3.
- Pequeno: 13px, padding 8/14, raio 8.

### Input / Select
Borda 1.5px #DCE4E9, raio 8, padding 10/12, 14px. Focus: borda #219EC9 + ring `0 0 0 3px #D2EEF8`. Erro: bg #FDF0EE, borda #D6493C, mensagem amigável. Label 13/600 #14242E; hint 12px #6B7B85.

### Card
Bg #fff, borda #DCE4E9, raio 14, padding 22, sombra-1 (hover: sombra-2 + borda #A5DCF0). Card de destaque: gradiente #0A3A4E→#0F81AC, texto claro, formas decorativas (círculos/quadrados âmbar-coral translúcidos). Barra de progresso: track #EAF7FC, fill #219EC9 (ou gradiente azul→verde quando perto de completar), 8px, pill.

### Tabela
Header: bg #F7FAFB, 11.5px caps #6B7B85, weight 700. Células 13.5px, padding 13/18, divisor #EDF2F5. Hover linha: #EAF7FC66. Linha "risco silencioso" (dor baixa + maturidade baixa): lavagem âmbar #FEF3DC55 + tag pill âmbar.

### Modal
Raio 20, sombra-3, overlay rgba(10,58,78,.55), fecha em ESC e clique no overlay. Modal de conquista: header gradiente azul→verde com formas de celebração e ícone circular branco.

### Toast
Canto inferior direito, some em 5s. Sucesso: bg #0A3A4E, ícone circular #17B583, subtítulo #A5DCF0, raio 12. Atenção: bg #fff, borda #F5C878, ícone #FEF3DC/#8A5E17.
