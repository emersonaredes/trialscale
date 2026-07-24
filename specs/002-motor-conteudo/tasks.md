# Tasks 002 — Motor de conteúdo + CMS (Fatia 1)

Executadas em 2026-07-23 (aprovação: "Implemente a Fase 1"). Decisões Q1/Q3/escopo
do usuário registradas no ADR 002.

- [x] PT-0022 ADR 002 (recalcular automático · dono afeta imediatamente · personalizados adiados) + spec 002
- [x] PT-0023 seed applicability_condition no schema.sql + aplicar no dev
- [x] PT-0024 models do catálogo (process, content_version, level, artifact, seal, placement, template, assessment, process_applicability) + tenancy catalog/tenant
- [x] PT-0025 repositories de conteúdo + assessment (+ migração de marcações)
- [x] PT-0026 content-service: rascunho (clone da publicada), saveDraft (graph inteiro), publish (arquiva + migra por logical_key, auditado)
- [x] PT-0027 maturity-service: motor de nível (essenciais ≤ N completos), condicionais visíveis, compartilhados, N/A, nível geral interino
- [x] PT-0028 assessment-service (marcar estado + data-limite CA-7; N/A com justificativa CA-4)
- [x] PT-0029 rotas: /processes, /processes/:id, /assessments, /applicability, /templates/:id/download + /cms/* (requireStaff) + upload multer
- [x] PT-0030 suíte de bordas do motor (CA-1..CA-7 + guardas de publicação) — 8 testes
- [x] PT-0031 seed de conteúdo: 5 processos do MVP (68 artefatos, 3 compartilhados, 2 condicionais) publicados via fluxo real do CMS
- [x] PT-0032 design system v1.1: tokens CSS completos, badges de nível (escala C), pills de kanban, selos, sidebar, restyle das telas de auth
- [x] PT-0033 UI centro: lista de processos (nível+progresso), Raio-X (marcar estados, data-limite, templates, N/A, exclusões visíveis), home com jornada
- [x] PT-0034 UI staff: CMS lista + editor de rascunho (artefatos, selos, condições, placements cruzados, upload de template) + publicar

**Validação:** lint ✓ · typecheck ✓ · **39/39 testes** (unit + auth + motor + 2×isolamento) ·
build web ✓ · smoke E2E: 5 processos publicados; piloto 2.5 com 17 artefatos (3 compartilhados);
condicional de compras públicas excluída p/ centro privado (visível); marcar essenciais N2 →
nível 1→2; staff no CMS ✓; centro no CMS → 403 ✓.

**Marco da Etapa 1 atingido:** conteúdo do piloto 2.5 no CMS e nível calculando corretamente.
Pendências herdadas: notificação de republicação (fatia futura), processos personalizados
(ADR 002), ponderação do nível geral (Fatia 2, junto com objetivos).
