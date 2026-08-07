param(
    [Parameter(Mandatory = $true)]
    [string]$DatabaseUrl,
    [Parameter(Mandatory = $true)]
    [string]$BackupPath,
    [switch]$AllowDestructiveRestore
)

$ErrorActionPreference = 'Stop'
if (-not $AllowDestructiveRestore) {
    throw 'Restore dapat menghapus data target. Jalankan ulang dengan -AllowDestructiveRestore setelah memastikan target adalah staging/isolated database.'
}
if (-not (Test-Path -LiteralPath $BackupPath)) { throw "File backup tidak ditemukan: $BackupPath" }

& pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error --dbname=$DatabaseUrl $BackupPath
if ($LASTEXITCODE -ne 0) { throw "pg_restore gagal dengan exit code $LASTEXITCODE" }

Write-Output 'Restore berhasil. Jalankan health check API dan verifikasi sampel data sebelum sign-off.'
