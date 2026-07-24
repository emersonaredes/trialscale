# Spec 001 — Fundação (Fatia 0)

> O QUÊ da fatia. O COMO está em `plan.md`; a quebra em tarefas em `tasks.md`.
> Deriva do plano aprovado em 2026-07-23 (revisado pelo agente app-architect).

## Objetivo

Fundação técnica do TrialScale: monorepo TS estrito, autenticação completa,
o **mecanismo central de escopo de tenant** (materialização do item 1 da
constituição), papéis, seeds, suíte permanente de isolamento, CI e preparação
de staging. Marco: **sistema funcional no localhost** com dois tenants de
teste coexistindo sem vazamento.

## Comportamento esperado (visão do usuário)

1. **Criar conta do centro**: nome, e-mail, senha + perfil do centro (nome,
   tipo de instituição pública/privada/terceiro setor, cidade, estado/UF,
   protocolos ativos em faixas 0_10…200_mais, ≥1 especialidade médica da
   lista global) + aceite do consentimento LGPD versionado. Cria tenant +
   usuário administrador. Registro NÃO autentica (login em seguida).
2. **Login/logout**: login com rate limit e erro 401 genérico; logout revoga
   a sessão no banco (família de refresh tokens).
3. **Sessão persistente**: access token 15min em memória; refresh opaco em
   cookie httpOnly com rotação a cada uso; reuso de token rotacionado revoga
   a família inteira.
4. **Área logada**: página inicial protegida exibe usuário, centro e papel
   (via GET /me); rota protegida redireciona para login.
5. **Recuperar senha**: fluxo forgot (202 sempre; link via MailAdapter —
   console em dev) → reset single-use (30min) → todas as sessões caem.

## Critérios de aceite (viram testes)

- CA-1 (isolamento, model): model de tenancy `tenant` sem contexto →
  `MissingTenantContextError`; com contexto → find/count/bulk filtram por
  tenant_id; create injeta tenant_id sobrescrevendo valor externo;
  save cross-tenant falha; `sum/min/max/increment` direto no model é bloqueado.
- CA-2 (isolamento, HTTP): token do tenant A nunca lê/escreve dados de B;
  tenantId em body/query é ignorado (fonte = token); token forjado/expirado →
  401; papel insuficiente → 403.
- CA-3 (auth): registro cria user+tenant+membership(administrador)+consent+
  especialidades+audit em UMA transação (rollback total em falha); e-mail
  duplicado → 409; consent obrigatório.
- CA-4 (tokens): refresh rotaciona (token antigo inutilizado); reuso →
  família revogada + 401; logout revoga; reset de senha revoga TODAS as
  sessões do usuário.
- CA-5 (LGPD/segurança): senha nunca em claro (argon2id); tokens nunca
  persistidos em claro (SHA-256); logs com redaction de
  password/token/authorization/cookie; forgot responde 202 sempre.
- CA-6 (papéis): role do BANCO vence o do token em divergência (≤1 request).
- CA-7 (dev): `npm run dev` na raiz sobe api+web; seeds idempotentes criam
  2 tenants × (admin, coordenador, membro) + 1 staff; README quickstart.

## Fora de escopo

Multi-membership/convites (adiado — YAGNI), design system (Passo 3),
objetivos/termômetro (Fatia 2), motor de conteúdo (Fatia 1), e-mail real,
deploy efetivo de staging (tarefa final guiada PT-0021).
