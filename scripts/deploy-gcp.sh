#!/usr/bin/env bash
# =============================================================================
# TrialScale — publicar no Google Cloud (Cloud Run + Cloud SQL) com UM comando.
#
# Onde rodar: no Cloud Shell do console do GCP (ícone >_), dentro da pasta do
# código, com o projeto já criado e com faturamento ativo:
#
#     bash scripts/deploy-gcp.sh
#
# O que ele faz (pode rodar de novo a qualquer momento — retoma de onde parou
# e serve também para publicar uma versão nova do código):
#   1. ativa os serviços necessários do GCP;
#   2. cria o repositório de imagens;
#   3. cria o banco MySQL (Cloud SQL) e o usuário da aplicação;
#   4. constrói a imagem da aplicação;
#   5. publica no Cloud Run (1 instância fixa — exigência do Workshop ao vivo);
#   6. confere se o sistema respondeu e mostra o endereço.
#
# Senhas: as do banco são GERADAS pelo script; você só define o e-mail e a
# senha de apresentador. Tudo fica em ~/.trialscale-deploy/ (só no seu Cloud
# Shell, fora do git). Nunca copie esses arquivos para o chat ou para o repo.
#
# Opcional: REGION=us-east1 bash scripts/deploy-gcp.sh   (padrão: São Paulo)
# =============================================================================
set -euo pipefail

REGION="${REGION:-southamerica-east1}"
SERVICE="trialscale"
INSTANCE="trialscale-db"
REPO="trialscale"
DB_USER="trialscale"
DB_NAME="trialscale"
STATE_DIR="$HOME/.trialscale-deploy"
ENV_FILE="$STATE_DIR/env.yaml"
ROOT_PW_FILE="$STATE_DIR/senha-root-do-banco.txt"

passo() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
info()  { printf '    %s\n' "$*"; }
aviso() { printf '\033[1;33m[aviso]\033[0m %s\n' "$*"; }
falha() { printf '\n\033[1;31m[erro]\033[0m %s\n' "$*" >&2; exit 1; }

# ----------------------------------------------------------------- pré-checagens
command -v gcloud >/dev/null || falha "gcloud não encontrado. Rode este script no Cloud Shell do GCP."
command -v openssl >/dev/null || falha "openssl não encontrado."

cd "$(dirname "$0")/.."
[ -f cloudbuild.yaml ] && [ -f apps/api/Dockerfile ] ||
  falha "Rode a partir da pasta do código do TrialScale (não achei cloudbuild.yaml)."

PROJECT="$(gcloud config get-value project 2>/dev/null || true)"
if [ -z "$PROJECT" ] || [ "$PROJECT" = "(unset)" ]; then
  falha "Nenhum projeto selecionado. Rode:  gcloud config set project <ID-DO-PROJETO>  e tente de novo."
fi

passo "Projeto: $PROJECT · Região: $REGION"
FATURAMENTO="$(gcloud billing projects describe "$PROJECT" --format='value(billingEnabled)' 2>/dev/null || true)"
if [ "$FATURAMENTO" = "False" ]; then
  falha "O projeto está SEM faturamento. No console: menu ☰ → Faturamento → vincule uma conta e rode de novo."
fi
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
CONNECTION="$PROJECT:$REGION:$INSTANCE"

# ----------------------------------------------------------------- segredos locais
mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR"
SEGREDOS_NOVOS=0
if [ ! -f "$ENV_FILE" ]; then
  SEGREDOS_NOVOS=1
  passo "Seu acesso de apresentador (login do TrialScale)"
  while :; do
    read -r -p "    E-mail: " STAFF_EMAIL
    [[ "$STAFF_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] && break
    aviso "E-mail inválido, tente de novo."
  done
  while :; do
    read -r -s -p "    Senha (mín. 10; letras, números e . _ @ # % + = -): " STAFF_PW; echo
    if ! [[ "$STAFF_PW" =~ ^[A-Za-z0-9._@#%+=-]{10,}$ ]]; then
      aviso "Use ao menos 10 caracteres, só com letras, números e . _ @ # % + = -"
      continue
    fi
    read -r -s -p "    Repita a senha: " STAFF_PW2; echo
    [ "$STAFF_PW" = "$STAFF_PW2" ] && break
    aviso "As senhas não conferem."
  done

  DB_PW="$(openssl rand -hex 16)"
  JWT_SECRET="$(openssl rand -hex 32)"
  umask 077
  {
    printf 'NODE_ENV: "production"\n'
    printf 'APP_URL: "https://trialscale.example"\n'
    printf 'DB_HOST: "localhost"\n'
    printf 'DB_SOCKET_PATH: "/cloudsql/%s"\n' "$CONNECTION"
    printf 'DB_USER: "%s"\n' "$DB_USER"
    printf 'DB_PASSWORD: "%s"\n' "$DB_PW"
    printf 'DB_NAME: "%s"\n' "$DB_NAME"
    printf 'DB_POOL_MAX: "20"\n'
    printf 'JWT_SECRET: "%s"\n' "$JWT_SECRET"
    printf 'AUTO_BOOTSTRAP: "true"\n'
    printf 'STAFF_EMAIL: "%s"\n' "$STAFF_EMAIL"
    printf 'STAFF_PASSWORD: "%s"\n' "$STAFF_PW"
  } >"$ENV_FILE"
  info "Configuração guardada em $ENV_FILE (só neste Cloud Shell)."
else
  info "Reaproveitando a configuração de $ENV_FILE."
  DB_PW="$(sed -n 's/^DB_PASSWORD: "\(.*\)"$/\1/p' "$ENV_FILE")"
  STAFF_EMAIL="$(sed -n 's/^STAFF_EMAIL: "\(.*\)"$/\1/p' "$ENV_FILE")"
  [ -n "$DB_PW" ] || falha "Não consegui ler $ENV_FILE. Apague a pasta $STATE_DIR e rode de novo."
fi

# ----------------------------------------------------------------- 1. serviços
passo "1/6 Ativando os serviços do GCP (pode levar 1–2 min)"
gcloud services enable run.googleapis.com sqladmin.googleapis.com \
  cloudbuild.googleapis.com artifactregistry.googleapis.com --quiet

# Permissões da conta de serviço padrão (usada pelo build e pelo Cloud Run).
# Em projetos novos ela pode vir sem papéis; conceder de novo é inofensivo.
for papel in roles/cloudsql.client roles/cloudbuild.builds.builder; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:$COMPUTE_SA" --role="$papel" --condition=None --quiet >/dev/null 2>&1 ||
    aviso "Não consegui conceder $papel a $COMPUTE_SA (sigo em frente)."
done

# ----------------------------------------------------------------- 2. imagens
passo "2/6 Repositório de imagens"
if gcloud artifacts repositories describe "$REPO" --location="$REGION" >/dev/null 2>&1; then
  info "Já existe."
else
  gcloud artifacts repositories create "$REPO" --repository-format=docker --location="$REGION" --quiet
fi

# ----------------------------------------------------------------- 3. banco
passo "3/6 Banco de dados (Cloud SQL MySQL 8)"
estado_banco() { gcloud sql instances describe "$INSTANCE" --format='value(state)' 2>/dev/null || true; }
if [ -z "$(estado_banco)" ]; then
  info "Criando a instância — leva de 5 a 15 minutos. Não feche o Cloud Shell."
  [ -f "$ROOT_PW_FILE" ] || (umask 077; openssl rand -hex 16 >"$ROOT_PW_FILE")
  # O comando pode "desistir de esperar" antes de o banco ficar pronto: por
  # isso o resultado não é fatal e a espera de verdade é o laço abaixo.
  gcloud sql instances create "$INSTANCE" \
    --database-version=MYSQL_8_0 --edition=enterprise \
    --tier=db-custom-1-3840 --storage-size=10 \
    --region="$REGION" --root-password="$(cat "$ROOT_PW_FILE")" --quiet ||
    aviso "O comando de criação retornou erro; vou conferir se a instância está sendo criada."
  [ -n "$(estado_banco)" ] || falha "A instância do banco não foi criada. Veja a mensagem acima."
else
  info "Instância já existe."
fi
for tentativa in $(seq 1 90); do
  ESTADO="$(estado_banco)"
  [ "$ESTADO" = "RUNNABLE" ] && break
  [ "$tentativa" = 90 ] && falha "O banco não ficou pronto em 15 min (estado: ${ESTADO:-desconhecido}). Rode o script de novo em alguns minutos."
  printf '    aguardando o banco ficar pronto (estado: %s)…\r' "${ESTADO:-?}"
  sleep 10
done
info "Banco pronto.                                             "

if gcloud sql users list --instance="$INSTANCE" --format='value(name)' | grep -qx "$DB_USER"; then
  if [ "$SEGREDOS_NOVOS" = 1 ]; then
    info "Usuário do banco já existia: redefinindo a senha para a nova configuração."
    gcloud sql users set-password "$DB_USER" --host=% --instance="$INSTANCE" --password="$DB_PW" --quiet
  else
    info "Usuário do banco já existe."
  fi
else
  gcloud sql users create "$DB_USER" --instance="$INSTANCE" --password="$DB_PW" --quiet
fi

# ----------------------------------------------------------------- 4. imagem
passo "4/6 Construindo a aplicação (uns 5 minutos)"
IMAGE="$REGION-docker.pkg.dev/$PROJECT/$REPO/app:v$(date +%Y%m%d-%H%M%S)"
gcloud builds submit --config cloudbuild.yaml --substitutions="_IMAGE=$IMAGE" --quiet .

# ----------------------------------------------------------------- 5. Cloud Run
passo "5/6 Publicando no Cloud Run"
# 1 instância FIXA: o tempo real do Workshop vive na memória de uma instância.
# concurrency alto: cada celular mantém uma conexão aberta.
gcloud run deploy "$SERVICE" --image="$IMAGE" --region="$REGION" \
  --allow-unauthenticated \
  --add-cloudsql-instances="$CONNECTION" \
  --env-vars-file="$ENV_FILE" \
  --min-instances=1 --max-instances=1 \
  --concurrency=1000 --timeout=3600 \
  --cpu=1 --memory=1Gi --no-cpu-throttling --quiet

URL="$(gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)')"
[ -n "$URL" ] || falha "O serviço foi publicado mas não consegui ler a URL. Veja no console: Cloud Run → $SERVICE."

# Grava o endereço real (usado em links de e-mail) para os próximos deploys.
if ! grep -q "^APP_URL: \"$URL\"$" "$ENV_FILE"; then
  sed -i "s|^APP_URL: .*|APP_URL: \"$URL\"|" "$ENV_FILE"
  gcloud run services update "$SERVICE" --region="$REGION" --update-env-vars="APP_URL=$URL" --quiet >/dev/null
fi

# ----------------------------------------------------------------- 6. conferência
passo "6/6 Conferindo se o sistema respondeu"
OK=0
for _ in $(seq 1 24); do
  RESPOSTA="$(curl -s --max-time 10 "$URL/api/health" || true)"
  if printf '%s' "$RESPOSTA" | grep -q '"db":"ok"'; then OK=1; break; fi
  sleep 5
done

echo
if [ "$OK" = 1 ]; then
  printf '\033[1;32mPronto! O TrialScale está no ar.\033[0m\n\n'
  info "Endereço:      $URL"
  info "Login:         $URL/login"
  info "Usuário:       $STAFF_EMAIL  (a senha que você definiu)"
  info "Workshop:      menu lateral → Workshop ao vivo → criar sala → abrir o telão"
  echo
  info "Ensaio com 200 celulares simulados (troque o código da sala):"
  info "  node scripts/workshop-simulacao.mjs $URL <CODIGO-DA-SALA> 200"
  echo
  info "Depois do evento, para parar de pagar sem perder os dados:"
  info "  gcloud run services update $SERVICE --region=$REGION --min-instances=0"
  info "  gcloud sql instances patch $INSTANCE --activation-policy=NEVER"
else
  aviso "O serviço foi publicado em $URL, mas /api/health não respondeu ok."
  info "Última resposta: ${RESPOSTA:-(sem resposta)}"
  info "Veja o motivo com o comando abaixo e me envie as últimas linhas (não contêm senhas):"
  info "  gcloud run services logs read $SERVICE --region=$REGION --limit=40"
  exit 1
fi
