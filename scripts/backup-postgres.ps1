param(
    [Parameter(Mandatory = $true)]
    [string]$DatabaseUrl,
    [string]$BackupPath = (Join-Path $PSScriptRoot "..\backups\sion-$(Get-Date -Format 'yyyyMMdd-HHmmss').dump")
)

$ErrorActionPreference = 'Stop'
$resolvedPath = [System.IO.Path]::GetFullPath($BackupPath)
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $resolvedPath) | Out-Null

& pg_dump --format=custom --no-owner --file=$resolvedPath $DatabaseUrl
if ($LASTEXITCODE -ne 0) { throw "pg_dump gagal dengan exit code $LASTEXITCODE" }

Write-Output "Backup berhasil dibuat: $resolvedPath"
