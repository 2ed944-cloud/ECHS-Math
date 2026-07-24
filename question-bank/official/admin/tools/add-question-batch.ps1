param(
  [Parameter(Mandatory=$true)][string]$BatchFile,
  [string]$OfficialRoot="",
  [string]$MediaFolder=""
)
$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($OfficialRoot)) { $OfficialRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..")) }
$OfficialRoot = [IO.Path]::GetFullPath($OfficialRoot)
$BatchFile = [IO.Path]::GetFullPath($BatchFile.Trim('"'))
if (-not (Test-Path $BatchFile)) { throw "Batch file not found: $BatchFile" }

$raw = Get-Content $BatchFile -Raw -Encoding UTF8 | ConvertFrom-Json
if ($raw -is [System.Array]) {
  $questions = @($raw); $batchId = [IO.Path]::GetFileNameWithoutExtension($BatchFile); $label = $batchId; $mergeMode = 'upsert'
} elseif ($null -ne $raw.questions) {
  $questions = @($raw.questions)
  $batchId = if ($raw.batchId) { [string]$raw.batchId } else { [IO.Path]::GetFileNameWithoutExtension($BatchFile) }
  $label = if ($raw.label) { [string]$raw.label } else { $batchId }
  $mergeMode = if ($raw.mergeMode) { [string]$raw.mergeMode } else { 'upsert' }
} else {
  $questions = @($raw); $batchId = [IO.Path]::GetFileNameWithoutExtension($BatchFile); $label = $batchId; $mergeMode = 'upsert'
}
$batchId = ($batchId.ToLowerInvariant() -replace '[^a-z0-9-]+','-' -replace '^-|-$','')
if (-not $batchId) { throw 'A valid batchId could not be generated.' }
if ($questions.Count -eq 0) { throw 'The batch contains no questions.' }

# All imported records are forcibly teacher/archive-only. Browser or PowerShell import
# never promotes a question to the independently audited student release.
$normalizedQuestions = @()
$seen = @{}
foreach ($q in $questions) {
  $id = [string]$q.id
  if ([string]::IsNullOrWhiteSpace($id)) { throw 'Every question must have a permanent id.' }
  if ($seen.ContainsKey($id)) { throw "Duplicate ID inside batch: $id" }
  $seen[$id] = $true
  $clone = [ordered]@{}
  foreach ($prop in $q.PSObject.Properties) { $clone[$prop.Name] = $prop.Value }
  $clone['quality'] = [ordered]@{
    productionStatus = 'teacher-archive-only'
    needsReview = $true
    transcriptionVerified = $false
    answerVerified = $false
    mathematicalVerificationPassed = $false
    katexVerified = $false
    mediaVerified = $false
    mappingVerified = $false
    studentReadyGatePassed = $false
    reviewReasons = @('Imported record: independent source, mathematics, KaTeX, media, and mapping verification required before student release.')
  }
  $clone['studentReady'] = $false
  $clone['studentEligible'] = $false
  $clone['studentAccessible'] = $false
  $clone['deploymentAccess'] = 'teacher-archive-only'
  $normalizedQuestions += [pscustomobject]$clone
}

$coreIndex = Get-Content (Join-Path $OfficialRoot 'data\question-index.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$coreIds = @{}; foreach ($r in $coreIndex) { $coreIds[[string]$r.id] = $true }
$manifestPath = Join-Path $OfficialRoot 'data\expansions\manifest.json'
if (Test-Path $manifestPath) { $manifest = Get-Content $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json }
else { $manifest = [pscustomobject]@{ schemaVersion='1.0.0'; batches=@() } }
$existingIds = @{}
foreach ($entry in @($manifest.batches)) {
  if ($entry.enabled -eq $false) { continue }
  $ep = Join-Path $OfficialRoot ('data\expansions\batches\' + $entry.file)
  if (Test-Path $ep) {
    $eb = Get-Content $ep -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($eq in @($eb.questions)) { $existingIds[[string]$eq.id] = $true }
  }
}
if ($mergeMode -ne 'upsert') {
  foreach ($id in $seen.Keys) {
    if ($coreIds.ContainsKey($id) -or $existingIds.ContainsKey($id)) { throw "ID already exists: $id. Use mergeMode upsert to preserve the permanent ID while replacing the teacher record." }
  }
}

$destDir = Join-Path $OfficialRoot 'data\expansions\batches'; New-Item -ItemType Directory -Force -Path $destDir | Out-Null
$normalized = [ordered]@{
  schemaVersion='1.0.0'; batchId=$batchId; label=$label; mergeMode=$mergeMode
  createdAt=(Get-Date).ToUniversalTime().ToString('o')
  reviewRequired=$true; studentReleaseApproved=$false; questions=$normalizedQuestions
}
$dest = Join-Path $destDir ($batchId + '.json')
$normalized | ConvertTo-Json -Depth 100 | Set-Content $dest -Encoding UTF8

if ($MediaFolder) {
  $MediaFolder = [IO.Path]::GetFullPath($MediaFolder.Trim('"'))
  if (-not (Test-Path $MediaFolder)) { throw "Media folder not found: $MediaFolder" }
  $mediaDest = Join-Path $OfficialRoot ('media\expansions\' + $batchId)
  New-Item -ItemType Directory -Force -Path $mediaDest | Out-Null
  Copy-Item (Join-Path $MediaFolder '*') $mediaDest -Recurse -Force
}

$batches = @($manifest.batches | Where-Object { $_.batchId -ne $batchId })
$batches += [pscustomobject]@{
  batchId=$batchId; label=$label; file=($batchId+'.json'); enabled=$true; mergeMode=$mergeMode
  questionCount=$normalizedQuestions.Count; reviewRequired=$true; studentReleaseApproved=$false
  addedAt=(Get-Date).ToUniversalTime().ToString('o')
}
$out = [ordered]@{ schemaVersion='1.0.0'; updatedAt=(Get-Date).ToUniversalTime().ToString('o'); batches=$batches }
$out | ConvertTo-Json -Depth 30 | Set-Content $manifestPath -Encoding UTF8

& (Join-Path $PSScriptRoot 'validate-private-bank.ps1') -OfficialRoot $OfficialRoot | Out-Host
Write-Host "Teacher-only batch installed: $batchId ($($normalizedQuestions.Count) records)" -ForegroundColor Green
Write-Host 'No imported record was added to the student data boundary.' -ForegroundColor Yellow
