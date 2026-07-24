# Tasks 003 — Jornada gratuita (Fatia 2)

Executadas em 2026-07-24 em branch `feat/pt-0035-jornada-gratuita` (fluxo
PR — constituição §3). Decisões do usuário: termômetro cobre os 28 (23
seedados sem artefatos); convites adiados para fatia própria.

- [x] PT-0035 spec 003 + models/repos da jornada (Objective, TenantObjective, PainScore — tenancy ADR 001)
- [x] PT-0036 seed-journey: 23 processos restantes (descrições fiéis a docs/conteudo) + 28 objetivos em 7 temas (concepção §2)
- [x] PT-0037 journey-service: objetivos (salvar seleção ORDENADA), termômetro (upsert 1–5, salvar/retomar), fotografia (médias por grupo, top dores)
- [x] PT-0038 rotas autenticadas (/objectives, /me/objectives, /thermometer, /photo) — PUT de objetivos exige admin/coordenador
- [x] PT-0039 testes de integração CA-1..CA-7 (incl. isolamento A/B)
- [x] PT-0040 UI: Objetivos (menu por tema + lista priorizada ↑↓), Termômetro (notas 1–5 com autosave, aviso de workshop, progresso), Fotografia (destaque, top dores, barras por grupo), Home com passos da jornada

**Validação:** lint ✓ · typecheck ✓ · **46/46 testes** · build web ✓ · smoke:
28 no termômetro, prioridades ordenadas persistidas, fotografia 6/28 com
médias e top dores corretos.

**Marco da Etapa 2 atingido em dev:** cadastro → objetivos → termômetro →
fotografia de ponta a ponta. Pendências para fatias futuras: convites,
priorização (dor × estratégia × dependências, Etapa 3), gating freemium.
