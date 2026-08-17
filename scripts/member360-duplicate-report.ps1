param(
    [Parameter(Mandatory = $true)]
    [string]$DatabaseUrl,
    [string]$OutputPath = (Join-Path $PSScriptRoot "..\reports\member360-duplicate-review.csv")
)

$ErrorActionPreference = 'Stop'
$resolvedPath = [System.IO.Path]::GetFullPath($OutputPath)
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $resolvedPath) | Out-Null

$reportQuery = @'
SELECT
    review.id AS review_id,
    review.score,
    ARRAY_TO_STRING(review.match_reasons, '|') AS match_reasons,
    review.status,
    review.member_id,
    member.name AS member_name,
    CASE WHEN LENGTH(member.normalized_phone) > 4 THEN '***' || RIGHT(member.normalized_phone, 4) ELSE '****' END AS member_phone,
    review.candidate_member_id,
    candidate.name AS candidate_name,
    CASE WHEN LENGTH(candidate.normalized_phone) > 4 THEN '***' || RIGHT(candidate.normalized_phone, 4) ELSE '****' END AS candidate_phone,
    review.override_reason,
    review.decision_note,
    review.decided_at,
    review.created_at
FROM member_duplicate_reviews review
JOIN members member ON member.id = review.member_id
JOIN members candidate ON candidate.id = review.candidate_member_id
ORDER BY (review.status = 'pending') DESC, review.score DESC, review.created_at;
'@

$rows = & psql --dbname=$DatabaseUrl --csv --set ON_ERROR_STOP=1 --command $reportQuery
if ($LASTEXITCODE -ne 0) { throw "Pembuatan laporan duplicate gagal dengan exit code $LASTEXITCODE" }
$rows | Set-Content -LiteralPath $resolvedPath -Encoding utf8

$pendingCritical = & psql --dbname=$DatabaseUrl --tuples-only --no-align --set ON_ERROR_STOP=1 --command "SELECT COUNT(*) FROM member_duplicate_reviews WHERE status = 'pending' AND score = 100;"
if ($LASTEXITCODE -ne 0) { throw "Pemeriksaan duplicate kritis gagal dengan exit code $LASTEXITCODE" }
$pendingCritical = [int]$pendingCritical.Trim()

Write-Output "Laporan duplicate berhasil dibuat: $resolvedPath"
Write-Output "Kandidat kritis tanpa keputusan: $pendingCritical"
if ($pendingCritical -gt 0) {
    throw "Masih ada $pendingCritical kandidat duplicate kritis. Data steward wajib memutuskan merge atau not_duplicate sebelum issue ditutup."
}
