param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,

  [switch]$ConfirmRestore
)

$ErrorActionPreference = "Stop"
if (-not $ConfirmRestore) {
  throw "Use -ConfirmRestore para confirmar a substituicao dos dados atuais."
}

$backendDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backupDir = [System.IO.Path]::GetFullPath((Join-Path $backendDir ".data\backups"))
$resolvedBackup = (Resolve-Path $BackupFile).Path

if (-not $resolvedBackup.StartsWith($backupDir, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "O arquivo deve estar dentro de $backupDir"
}

$containerFile = "/tmp/ncprogrammers-restore.dump"
Push-Location $backendDir
try {
  docker cp $resolvedBackup "pg:$containerFile"
  if ($LASTEXITCODE -ne 0) { throw "Falha ao copiar dump para o container" }

  docker compose exec -T postgres sh -c 'pg_restore --clean --if-exists --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB" /tmp/ncprogrammers-restore.dump'
  if ($LASTEXITCODE -ne 0) { throw "Falha ao restaurar dump PostgreSQL" }

  docker compose exec -T postgres rm -f $containerFile
  if ($LASTEXITCODE -ne 0) { throw "Falha ao remover dump temporario" }
} finally {
  Pop-Location
}

Write-Host "Restauracao concluida: $resolvedBackup"
