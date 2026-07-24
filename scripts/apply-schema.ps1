# =============================================================================
# apply-schema.ps1 — aplica o schema do núcleo no MySQL usando a config do .env
# =============================================================================
# Lê .env (na raiz do repo), cria o banco DB_NAME se não existir e roda o
# schema.sql contra ele. A senha NUNCA vai na linha de comando: é gravada num
# arquivo de opções temporário (--defaults-extra-file) e apagado ao final.
#
# Uso:   powershell -ExecutionPolicy Bypass -File scripts/apply-schema.ps1
# Trocar de banco/servidor: edite o .env e rode de novo (idempotente, sem DROP).
# =============================================================================

$ErrorActionPreference = 'Stop'

# --- localizar raiz do repo e arquivos ---------------------------------------
$repoRoot   = Split-Path -Parent $PSScriptRoot
$envPath    = Join-Path $repoRoot '.env'
$schemaPath = Join-Path $repoRoot 'specs/000-modelo-de-dados/schema.sql'

$mysqlExe = 'C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe'
if (-not (Test-Path $mysqlExe)) {
  $found = (Get-Command mysql -ErrorAction SilentlyContinue)
  if ($found) { $mysqlExe = $found.Source } else { throw "mysql.exe nao encontrado. Ajuste o caminho no script." }
}
if (-not (Test-Path $envPath))    { throw ".env nao encontrado em $envPath (copie de .env.example)." }
if (-not (Test-Path $schemaPath)) { throw "schema.sql nao encontrado em $schemaPath." }

# --- ler .env ----------------------------------------------------------------
$cfg = @{}
foreach ($line in Get-Content $envPath) {
  $t = $line.Trim()
  if ($t -eq '' -or $t.StartsWith('#')) { continue }
  $kv = $t -split '=', 2
  if ($kv.Count -eq 2) { $cfg[$kv[0].Trim()] = $kv[1].Trim() }
}
foreach ($k in 'DB_HOST','DB_PORT','DB_USER','DB_NAME') {
  if (-not $cfg.ContainsKey($k) -or [string]::IsNullOrWhiteSpace($cfg[$k])) { throw "$k ausente no .env" }
}
if (-not $cfg.ContainsKey('DB_PASSWORD') -or $cfg['DB_PASSWORD'] -eq 'TROQUE_AQUI') {
  throw "Edite DB_PASSWORD no .env com a senha real do MySQL antes de aplicar."
}

# --- arquivo de opções temporario (mantem a senha fora da linha de comando) --
$optFile = Join-Path $env:TEMP ("ts_mysql_" + [guid]::NewGuid().ToString('N') + ".cnf")
@(
  '[client]'
  "host=$($cfg['DB_HOST'])"
  "port=$($cfg['DB_PORT'])"
  "user=$($cfg['DB_USER'])"
  "password=$($cfg['DB_PASSWORD'])"
) | Set-Content -Path $optFile -Encoding ASCII

try {
  $db = $cfg['DB_NAME']
  Write-Host "==> Criando banco '$db' se necessario e aplicando schema em $($cfg['DB_HOST']):$($cfg['DB_PORT'])..."

  # 1) cria o banco com o charset correto
  & $mysqlExe "--defaults-extra-file=$optFile" -e "CREATE DATABASE IF NOT EXISTS ``$db`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  if ($LASTEXITCODE -ne 0) { throw "Falha ao criar o banco (exit $LASTEXITCODE)." }

  # 2) aplica o schema DENTRO do banco selecionado
  Get-Content $schemaPath -Raw | & $mysqlExe "--defaults-extra-file=$optFile" --database=$db
  if ($LASTEXITCODE -ne 0) { throw "Falha ao aplicar o schema (exit $LASTEXITCODE)." }

  # 3) verificacao
  Write-Host "`n==> Tabelas criadas em '$db':"
  & $mysqlExe "--defaults-extra-file=$optFile" --database=$db -e "SHOW TABLES;"
  Write-Host "`nOK. Schema aplicado."
}
finally {
  Remove-Item $optFile -Force -ErrorAction SilentlyContinue   # apaga a senha do disco
}
