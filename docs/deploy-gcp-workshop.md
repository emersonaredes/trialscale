# Workshop ao vivo — publicar no GCP e roteiro do evento

> Guia para colocar o TrialScale (com o módulo Workshop ao vivo, spec 006) na
> internet usando **Cloud Run + Cloud SQL**. Os comandos rodam no **Cloud
> Shell** do console do GCP (já vem com `gcloud` autenticado na sua conta).
> O deploy é uma ação SUA: nada aqui é executado automaticamente.
>
> Os comandos foram escritos de memória da CLI do GCP e **não foram executados
> neste projeto**. Se algum reclamar de flag, a mensagem de erro do `gcloud`
> costuma dizer a correção; me mande o erro que eu ajusto.
>
> **Nunca cole senhas no chat nem versione o arquivo `env.yaml`.**

## Caminho rápido: um comando

Com o projeto criado, o faturamento ativo e o código no Cloud Shell:

```bash
bash scripts/deploy-gcp.sh
```

O script pergunta só o seu e-mail e a senha de apresentador, gera as senhas do
banco, executa as seções 1 a 5 abaixo, confere o `/api/health` e mostra o
endereço. Pode ser rodado de novo: retoma de onde parou e também publica uma
versão nova do código. A configuração fica em `~/.trialscale-deploy/` (só no
seu Cloud Shell). As seções 1 a 5 ficam como referência do que ele faz.

## Por que nuvem (e não só o notebook)

Os 200 celulares precisam alcançar o servidor. Em Wi-Fi de evento é comum os
aparelhos não se enxergarem, e quem estiver no 4G não acessa um servidor na
rede local. Publicado na nuvem, funciona de qualquer rede. O notebook fica
como plano B (seção final).

## 1. Preparar o projeto (uma vez)

```bash
export PROJECT=<id-do-seu-projeto-gcp>
export REGION=southamerica-east1          # São Paulo
gcloud config set project $PROJECT
gcloud services enable run.googleapis.com sqladmin.googleapis.com \
  cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create trialscale \
  --repository-format=docker --location=$REGION
```

## 2. Banco (Cloud SQL MySQL 8)

```bash
# Escolha as senhas aqui no terminal (não reutilize senhas de outros sistemas):
read -s -p "Senha root do banco: " ROOT_PW; echo
read -s -p "Senha do usuário da aplicação: " DB_PW; echo

gcloud sql instances create trialscale-db \
  --database-version=MYSQL_8_0 --edition=enterprise \
  --tier=db-custom-1-3840 --storage-size=10 \
  --region=$REGION --root-password="$ROOT_PW"
gcloud sql users create trialscale --instance=trialscale-db --password="$DB_PW"
```

A criação da instância leva alguns minutos. O banco `trialscale`, as tabelas e
o catálogo (28 processos, objetivos, matriz) são criados **sozinhos** no
primeiro boot da aplicação (`AUTO_BOOTSTRAP=true`).

## 3. Código e imagem

```bash
# Repositório privado: o git vai pedir usuário e um token de acesso do GitHub.
# Alternativa: baixar o ZIP da main no GitHub e enviar pelo "Upload" do Cloud Shell.
git clone https://github.com/emersonaredes/trialscale && cd trialscale

export IMAGE=$REGION-docker.pkg.dev/$PROJECT/trialscale/app:v1
gcloud builds submit --config cloudbuild.yaml --substitutions=_IMAGE=$IMAGE
```

## 4. Variáveis de ambiente (arquivo local, fora do git)

```bash
read -s -p "Senha do apresentador (login staff, mín. 10 caracteres): " STAFF_PW; echo
cat > ~/env.yaml <<EOF
NODE_ENV: "production"
APP_URL: "https://trialscale.example"
DB_HOST: "localhost"
DB_SOCKET_PATH: "/cloudsql/$PROJECT:$REGION:trialscale-db"
DB_USER: "trialscale"
DB_PASSWORD: "$DB_PW"
DB_NAME: "trialscale"
DB_POOL_MAX: "20"
JWT_SECRET: "$(openssl rand -base64 48 | tr -d '\n')"
AUTO_BOOTSTRAP: "true"
STAFF_EMAIL: "<seu-email-de-apresentador>"
STAFF_PASSWORD: "$STAFF_PW"
EOF
chmod 600 ~/env.yaml
```

## 5. Publicar no Cloud Run

```bash
# Permissão para o serviço conectar no Cloud SQL:
PN=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
gcloud projects add-iam-policy-binding $PROJECT \
  --member=serviceAccount:$PN-compute@developer.gserviceaccount.com \
  --role=roles/cloudsql.client

gcloud run deploy trialscale --image=$IMAGE --region=$REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances=$PROJECT:$REGION:trialscale-db \
  --env-vars-file=$HOME/env.yaml \
  --min-instances=1 --max-instances=1 \
  --concurrency=1000 --timeout=3600 \
  --cpu=1 --memory=1Gi --no-cpu-throttling
```

Por que essas opções:

- `--min-instances=1 --max-instances=1`: **obrigatório**. O tempo real do
  workshop vive na memória de UMA instância; com duas, metade da plateia não
  receberia os avisos. Também evita a demora de "partida a frio".
- `--concurrency=1000`: cada celular mantém uma conexão aberta; o padrão do
  Cloud Run (80) derrubaria a sala.
- `--timeout=3600`: conexões de tempo real duram até 1 h (o celular reconecta
  sozinho depois disso).
- `--no-cpu-throttling`: CPU sempre disponível para empurrar os avisos.

O comando termina mostrando a **URL do serviço** (`https://trialscale-...run.app`).
Atualize o `APP_URL` com ela (usado só em links de e-mail):

```bash
gcloud run services update trialscale --region=$REGION \
  --update-env-vars=APP_URL=<URL-do-servico>
```

## 6. Conferir (antes do evento)

1. `https://<URL>/api/health` → `{"status":"ok","db":"ok"}`.
2. Entre em `https://<URL>/login` com o e-mail e a senha de apresentador.
3. Menu **Workshop ao vivo** → crie uma sala de ensaio → abra o telão.
4. Leia o QR com o seu celular (no 4G, fora do Wi-Fi) e percorra os passos.
5. **Ensaio de carga** — do Cloud Shell ou do seu computador (Node 20+):

   ```bash
   node scripts/workshop-simulacao.mjs https://<URL> <CODIGO-DA-SALA> 200
   ```

   São 200 celulares simulados que entram e respondem sozinhos conforme você
   avança os passos no telão. `Ctrl+C` mostra as latências. Local, o resultado
   foi voto → telão em ~200 ms; na nuvem espere um pouco mais.
6. Encerre a sala de ensaio e crie a sala do evento só na hora (ou antes, com
   o nome certo — o QR não muda).

## 7. Roteiro no dia

- Abra o telão em **tela cheia** (botão no rodapé) e espelhe/projete essa aba.
- Passo 1: deixe o QR na tela; os nomes sorteados aparecem ao vivo. Clique num
  nome para remover alguém, se precisar. Quem chegar atrasado entra pelo QR
  pequeno no topo, em qualquer passo.
- Botão azul do rodapé = próximo passo. "← Voltar" reabre o passo anterior
  (ex.: reabrir a votação).
- Passo 4: clique num processo para abrir o detalhe; **Enviar para os
  celulares** inicia a autoavaliação (passos 5–7).
- Passo 8: "Avaliar outro processo" volta ao ranking para repetir com outro.
- Leve o notebook com bateria e o celular como roteador reserva.

## 8. Depois do evento (custos)

Cloud Run com instância mínima e Cloud SQL cobram enquanto existem. Os valores
dependem da tabela de preços vigente — consulte o faturamento do console. Para
parar de pagar mantendo os dados:

```bash
gcloud run services update trialscale --region=$REGION --min-instances=0
gcloud sql instances patch trialscale-db --activation-policy=NEVER   # desliga o banco
```

(Religar: `--activation-policy=ALWAYS` e `--min-instances=1`.) As respostas do
workshop ficam nas tabelas `workshop_*`, anônimas.

## Plano B — notebook como servidor

Com MySQL local, preencha o `.env` (README) e acrescente:

```
AUTO_BOOTSTRAP=true
STAFF_EMAIL=<seu-email-de-apresentador>
STAFF_PASSWORD=<senha forte, mín. 10 caracteres>
```

```bash
npm ci
npm run build -w apps/api && npm run build -w apps/web
node apps/api/dist/server.js          # http://localhost:3333
```

O boot cria as tabelas, o catálogo e o seu usuário de apresentador. **Não rode
`npm run seed` num servidor exposto à internet**: ele cria usuários de teste
com senha pública.

Os celulares precisam de um endereço público: use um túnel HTTPS para a porta
3333 (ex.: `cloudflared tunnel --url http://localhost:3333`) ou um roteador
próprio em que todos se conectem. **Abra o telão pelo endereço público** — o
QR code é gerado a partir do endereço em que o telão está aberto.
