# Secrets e variáveis de ambiente — deploy no Google Cloud (api + fuse_vite)

> Levantamento de 23/07/2026, varrendo `src/` (todas as leituras de `process.env`, inclusive por destructuring), `.env.example`, chaves do `.env` local, `Dockerfile` e os providers de GCS / Conta Azul / Banco Inter.
>
> **Este arquivo lista apenas NOMES — nunca valores.** Valores vivem só no Secret Manager (produção) e no `.env` local (dev, fora do git). Nunca colar valores aqui, em commits ou em logs.

---

## 1. Secrets de verdade (→ Google Secret Manager)

| Secret | Para quê | Observação |
|---|---|---|
| `PASSWORD` + `POLO_USERNAME` | MySQL da base `admin_clientes` | Credenciais dos **tenants** NÃO vêm de env — vêm da tabela `admin_clientes.cliente_banco_dados` em runtime |
| `APP_SECRET` | Assinatura do JWT de autenticação | |
| `EXPRESS_SESSION_SECRET` | Sessão Express | **Obrigatório em prod**: `src/shared/infra/http/server.ts:57` tem fallback fraco hardcoded no código |
| `REDIS_PASS` | Senha do Redis | |
| `SEND_EMAIL_USER` + `SEND_EMAIL_PASSWORD` | SMTP (cobrança, comprovantes) | |
| `CONTA_AZUL_CLIENT_ID` / `CONTA_AZUL_CLIENT_SECRET` | OAuth do app PT2 (conta REAL) no Conta Azul | |
| `CONTA_AZUL_ACCESS_TOKEN` / `CONTA_AZUL_REFRESH_TOKEN` | Tokens da conta real | ⚠️ Refresh token ROTACIONA — ver ponto crítico nº 1 antes de ligar em prod |
| `INTER_CLIENT_ID` / `INTER_CLIENT_SECRET` | API do Banco Inter | |
| Certificado + chave mTLS do Inter (**2 arquivos**) | Autenticação mTLS na API do Inter | Montar como *secret volume*; `INTER_CERT_PATH` / `INTER_KEY_PATH` apontam para o caminho montado |
| `CLICKSIGN_ACC_KEY` | Token da conta ClickSign (eTMF + renovação de contratos) | |
| `ANTHROPIC_API_KEY` | Motor de visão do extrator de protocolos (`@anthropic-ai/sdk`) | SDK lê direto do ambiente |
| `RECAPTCHA_API_KEY` | reCAPTCHA Enterprise | A URL de assessment usa o projeto `polotrial-prd` hardcoded no código |
| `LOG_DATABASE_PASSWORD` | Só se `LOG_MODE=DATABASE` | Ver seção 3 (logging) |

### Arquivos que NÃO sobem

- **`gstorage-key.json` — não subir.** Com `NODE_ENV != 'dev'` o código usa Application Default Credentials (`src/shared/container/providers/GStorageProvider/implementations/GStorageProvider.ts:14-21` e `ArquivoContratoStorage.ts`). Basta dar à service account do serviço papel de leitura/escrita nos dois buckets (`GSTORAGE_SRC_BUCKET` e `GSTORAGE_DEST_BUCKET`).

---

## 2. Env vars comuns (config, sem sigilo)

**Infra**

| Variável | Observação |
|---|---|
| `NODE_ENV` | Dockerfile já seta `production`; o código compara com `'dev'` em vários pontos — nunca rodar servidor com `dev` |
| `HOST` / `MYSQL_PORT` | Host e porta do MySQL da base admin |
| `REDIS_HOST` / `REDIS_PORT` | |
| `CORS_ORIGIN` | Origem do front (ex.: `https://beta.polotrial.com`) |
| `RATE_LIMIT_POINTS` / `RATE_LIMIT_DURATION` | Rate limit por IP |
| `API_ID` | Identificador do ambiente (dev/beta/prod) para o redirecionamento de `validateEnvironmentAccess` (`src/shared/utils/utils.ts:1690`) |
| `SEND_EMAIL_HOST` / `SEND_EMAIL_PORT` | SMTP |

**GCS**

| Variável | Observação |
|---|---|
| `GSTORAGE_SRC_BUCKET` | prod histórico: `dados-polo` |
| `GSTORAGE_DEST_BUCKET` | conferir par correto por ambiente no `.env.example` |

**Integrações**

| Variável | Observação |
|---|---|
| `CONTA_AZUL_SERVICO_ID` | Serviço de referência da NF — define o CNAE (default "Uso plataforma Polo Trial", LOG 031) |
| `INTER_CONTA_CORRENTE` | Número da conta no Inter |
| `CLICKSIGN_BASE_URL` | ⚠️ **Default é SANDBOX** — produção exige definir a URL real explicitamente |
| `RECAPTCHA_SITE_KEY` | Site key (pública) |

**Negócio**

| Variável | Observação |
|---|---|
| `REEMBOLSO_SOCIOS` | Lista de e-mails com acesso à tela Reembolsos; tem default hardcoded dos 4 sócios (`ReembolsoService.ts`) |
| `CADASTRO_PROTOCOLO_DIR` | Diretório dos anexos do Cadastro de Protocolos — ⚠️ disco local, ver ponto crítico nº 3 |

**Logging (opcional)**

| Variável | Observação |
|---|---|
| `LOG_ENABLED` / `LOG_MODE` | `FILE` grava em `logs/` (efêmero no Cloud Run) |
| `LOG_DATABASE_SERVER/PORT/USER/NAME/TABLE` | Só se `LOG_MODE=DATABASE` (senha vai no Secret Manager) |

---

## 3. Flags-cadeado (definir conscientemente; padrão = desligado)

Ligar cada uma em produção é **decisão operacional**, não passo de deploy:

| Flag | Libera |
|---|---|
| `CONTA_AZUL_CRIAR_VENDA` | Venda real no Conta Azul (1 dos 3 cadeados em série) |
| `FINANCEIRO_EMAIL_COBRANCA` | Envio real de e-mail de cobrança |
| `FINANCEIRO_EMAIL_TESTE` | Se definido, redireciona TODO e-mail de cobrança para este endereço (modo teste) |
| `CLICKSIGN_ENVIAR` | Disparo real de documentos ao ClickSign |
| `SNAPSHOT_DIARIO` + `SNAPSHOT_JANELA` | Scheduler do snapshot diário do motor financeiro |
| `FINANCEIRO_REGUA_AUTO` + `REGUA_JANELA` | Scheduler da régua de cobrança |
| `INTER_EXTRATO_AUTO` + `INTER_EXTRATO_JANELA` | Scheduler do extrato do Banco Inter |

---

## 4. NÃO vão para o servidor

| Variável | Motivo |
|---|---|
| `EXECUTAR`, `MES`, `MESES_RETROATIVOS` | Só dos scripts CLI pontuais (`src/modules/financeiro/scripts/*`) |
| `CONTA_AZUL_REDIRECT_URI` | Está no `.env` local mas nenhum código do repo lê (fluxo manual do 1º token OAuth) |
| `DD_ENV`, `DD_LOGS_INJECTION` | Datadog morto: `DataDogProvider` não é registrado em lugar nenhum e `dd-trace` nem está no `package.json` |
| `gstorage-key.json` | Prod usa ADC via IAM da service account (seção 1) |

---

## 5. Frontend (`fuse_vite`) — variáveis de BUILD, tudo público

O Vite embute qualquer `VITE_*` **no bundle no momento do build** — vira texto público no JavaScript servido ao navegador. Logo: **o fuse não tem (nem pode ter) secret de verdade e não usa Secret Manager**; suas variáveis entram como build args/substitutions no pipeline de build. Levantamento de 23/07 (`.env` local × referências reais no código):

| Variável | Situação | Deploy |
|---|---|---|
| `VITE_BASE_URL` | usada (URL pública da API) | ✅ obrigatória no build de prod |
| `VITE_SITE_KEY` | usada (site key pública do reCAPTCHA) | ✅ obrigatória no build de prod |
| `VITE_BASE_URL_DEV` | usada só em dev local | ❌ não sobe |
| `VITE_RECAPTCHA_LOCALHOST_SECRET_KEY` | usada em `src/app/auth/store/loginSlice.js:108` — verificação do captcha feita PELO FRONT (gambiarra de dev local) | ❌ **nunca subir**: secret key de reCAPTCHA em bundle fica pública; em prod a verificação é do backend (`RECAPTCHA_API_KEY`). Marcar para refactor |
| `VITE_API_KEY_CLICKSIGN` | **morta** — zero referências no código | ❌ não subir; remover do `.env` local |
| `VITE_MAP_KEY` | **morta** — zero referências no código | ❌ não subir; remover do `.env` local |
| `NODE_ENV` / `PUBLIC_URL` / `DEV` | do próprio tooling de build | — |

⚠️ O `.env.example` do fuse ainda usa prefixo `REACT_APP_*` (era Create React App) — **nenhuma** dessas chaves funciona no Vite; atualizar o example junto.

**Regra de bolso da separação: se é segredo, é da API (Secret Manager). O fuse só recebe config pública de build (URL da API + site key).**

---

## 6. ⚠️ Pontos críticos ANTES do deploy

1. **Refresh token do Conta Azul rotaciona e se perde em produção.** Cada renovação emite refresh token novo e INVALIDA o anterior. O `persistirTokensDev()` (`src/modules/financeiro/integrations/ContaAzulClient.ts:115`) só regrava se existir `.env` no disco — sem ele, não faz nada: o token renovado vive só em memória. Primeiro restart depois de um refresh → o secret guardado já está invalidado → integração cai. O TODO no código já prevê a solução (storage dedicado: tabela ou Secret Manager API, com lock contra corrida entre processos/instâncias). **Pré-requisito de deploy para ligar o Conta Azul em produção.**
2. **Porta hardcoded**: `app.listen(8080)` em `src/shared/infra/http/server.ts:104` — coincide com o default do Cloud Run, mas não lê `$PORT`. Funciona desde que a porta do serviço fique em 8080.
3. **Filesystem efêmero**: `CADASTRO_PROTOCOLO_DIR` guarda anexos em disco local e `LOG_MODE=FILE` grava em `logs/`. No Cloud Run isso evapora a cada restart/nova instância. Anexos do Cadastro de Protocolos precisam migrar para GCS (ou o serviço rodar em VM/volume persistente).
4. **`.env.example` desatualizado** — não tem Conta Azul, Inter, ClickSign, Anthropic, reCAPTCHA, `EXPRESS_SESSION_SECRET`, `API_ID` nem as flags novas. Atualizar como checklist canônico (sem valores).
5. **MySQL multi-tenant**: o secret de env cobre só a `admin_clientes`. As conexões dos tenants saem da tabela `cliente_banco_dados` (host na coluna `server`) em runtime — rede/firewall do servidor precisa alcançar esses hosts também.

---

## 7. Receita de referência (gcloud)

Padrão para criar cada secret sem deixar valor no histórico do shell:

```bash
# secret de texto (pede o valor interativamente, sem eco)
read -s VALOR && printf '%s' "$VALOR" | gcloud secrets create NOME_DO_SECRET --data-file=- && unset VALOR
```

```bash
# secret de arquivo (certificado/chave mTLS do Inter)
gcloud secrets create inter-cert --data-file=./caminho/do/certificado.crt
gcloud secrets create inter-key  --data-file=./caminho/da/chave.key
```

No Cloud Run: secrets de texto entram com `--set-secrets NOME_ENV=nome-do-secret:latest`; os arquivos do Inter entram como volume montado, e `INTER_CERT_PATH`/`INTER_KEY_PATH` apontam para o caminho do mount. Conceder `roles/secretmanager.secretAccessor` à service account do serviço, e os papéis de Storage nos dois buckets do GCS.

---

*Manutenção: variável nova no código → linha nova aqui, no mesmo PR. Dono: Luiz.*
