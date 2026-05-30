param(
  [int]$RetentionDays = 14
)

$ErrorActionPreference = "Stop"
$backendDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backupDir = [System.IO.Path]::GetFullPath((Join-Path $backendDir ".data\backups"))

if (-not $backupDir.StartsWith($backendDir, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Diretorio de backup fora do backend: $backupDir"
}

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $backupDir "ncprogrammers-$timestamp.dump"
$containerFile = "/tmp/ncprogrammers-backup.dump"

Push-Location $backendDir
try {
  docker compose exec -T postgres sh -c 'pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /tmp/ncprogrammers-backup.dump'
  if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar dump PostgreSQL" }

  docker cp "pg:$containerFile" $backupFile
  if ($LASTEXITCODE -ne 0) { throw "Falha ao copiar dump para $backupFile" }

  docker compose exec -T postgres rm -f $containerFile
  if ($LASTEXITCODE -ne 0) { throw "Falha ao remover dump temporario" }
} finally {
  Pop-Location
}

$limit = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -LiteralPath $backupDir -Filter "ncprogrammers-*.dump" -File |
  Where-Object { $_.LastWriteTime -lt $limit } |
  Remove-Item -Force

Write-Host "Backup criado: $backupFile"
