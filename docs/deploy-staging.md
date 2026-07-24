# Deploy de staging (preparado na Fatia 0; execução guiada — PT-0021)

> Nada aqui é executado automaticamente: criar conta, provisionar banco e
> ligar o deploy são ações SUAS (constituição §3). Este guia deixa tudo pronto.

## Arquitetura

Um único serviço: o container do api (apps/api/Dockerfile) serve a API em
`/api/*` e o build estático do web no resto — **same-origin**, o cookie
httpOnly do refresh funciona sem configuração extra. Banco: MySQL gerenciado
(o provedor oferece 8.x; o schema é compatível — os CHECKs passam a valer).

## Passos (Railway ou Render)

1. Crie a conta e um projeto; conecte o repositório GitHub.
2. Provisione um MySQL gerenciado; anote host/porta/usuário/senha/database.
3. Configure o serviço web a partir do `apps/api/Dockerfile` (contexto = raiz do repo).
4. Variáveis de ambiente do serviço (NUNCA commitar valores):
   - `NODE_ENV=production`
   - `PORT` (o provedor costuma injetar; o Dockerfile usa 3333)
   - `APP_URL=https://<seu-dominio-de-staging>`
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `JWT_SECRET` — gere um novo (>=32 chars): `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
5. Aplique o schema no banco gerenciado (uma vez):
   `npm run db:apply` localmente com um `.env` temporário apontando para o
   banco de staging — ou rode o SQL de specs/000-modelo-de-dados/schema.sql
   pelo console do provedor.
6. Ligue o deploy automático da branch principal.
7. Smoke test: `GET https://<dominio>/api/health` → `{status:'ok', db:'ok'}`;
   registre um centro de teste e percorra login → home → logout.

## Pré-condições de ambiente compartilhado

- Trocar o `ConsoleMailAdapter` por provedor real de e-mail ANTES de usuários
  reais usarem recuperação de senha (constituição §2 — token nunca em log).
- Branch protection no GitHub com o step `tenant-isolation` como required
  status check (constituição §1).
