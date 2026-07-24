param([Parameter(Mandatory=$true)][string]$BatchFile,[string]$OfficialRoot="",[string]$MediaFolder="")
$ErrorActionPreference="Stop"
if([string]::IsNullOrWhiteSpace($OfficialRoot)){$OfficialRoot=(Split-Path -Parent $PSScriptRoot)}
$OfficialRoot=[IO.Path]::GetFullPath($OfficialRoot)
$BatchFile=[IO.Path]::GetFullPath($BatchFile.Trim('"'))
if(-not(Test-Path $BatchFile)){throw "Batch file not found: $BatchFile"}
$raw=Get-Content $BatchFile -Raw -Encoding UTF8|ConvertFrom-Json
if($raw -is [System.Array]){$questions=@($raw);$batchId=[IO.Path]::GetFileNameWithoutExtension($BatchFile);$label=$batchId;$mergeMode='upsert'}
elseif($raw.questions){$questions=@($raw.questions);$batchId=if($raw.batchId){[string]$raw.batchId}else{[IO.Path]::GetFileNameWithoutExtension($BatchFile)};$label=if($raw.label){[string]$raw.label}else{$batchId};$mergeMode=if($raw.mergeMode){[string]$raw.mergeMode}else{'upsert'}}
else{$questions=@($raw);$batchId=[IO.Path]::GetFileNameWithoutExtension($BatchFile);$label=$batchId;$mergeMode='upsert'}
$batchId=($batchId.ToLower() -replace '[^a-z0-9-]+','-' -replace '^-|-$','')
if(-not $batchId){throw 'A valid batchId could not be generated.'}
if($questions.Count -eq 0){throw 'The batch contains no questions.'}
$ids=@{};foreach($q in $questions){$id=[string]$q.id;if([string]::IsNullOrWhiteSpace($id)){throw 'Every question must have an id.'};if($ids.ContainsKey($id)){throw "Duplicate ID inside batch: $id"};$ids[$id]=$true}
$coreIndex=Get-Content (Join-Path $OfficialRoot 'data\question-index.json') -Raw -Encoding UTF8|ConvertFrom-Json
$coreIds=@{};foreach($r in $coreIndex){$coreIds[[string]$r.id]=$true}
$manifestPath=Join-Path $OfficialRoot 'data\expansions\manifest.json';$existingManifest=Get-Content $manifestPath -Raw -Encoding UTF8|ConvertFrom-Json
$existingIds=@{};foreach($entry in @($existingManifest.batches)){if($entry.enabled -eq $false){continue};$ep=Join-Path $OfficialRoot ('data\expansions\batches\'+$entry.file);if(Test-Path $ep){$eb=Get-Content $ep -Raw -Encoding UTF8|ConvertFrom-Json;foreach($eq in @($eb.questions)){$existingIds[[string]$eq.id]=$true}}}
if($mergeMode -ne 'upsert'){foreach($id in $ids.Keys){if($coreIds.ContainsKey($id) -or $existingIds.ContainsKey($id)){throw "ID already exists: $id. Use mergeMode upsert to replace it."}}}
$destDir=Join-Path $OfficialRoot 'data\expansions\batches';New-Item -ItemType Directory -Force -Path $destDir|Out-Null
$normalized=[ordered]@{schemaVersion='1.0.0';batchId=$batchId;label=$label;mergeMode=$mergeMode;createdAt=(Get-Date).ToUniversalTime().ToString('o');questions=$questions}
$dest=Join-Path $destDir ($batchId+'.json');$normalized|ConvertTo-Json -Depth 100|Set-Content $dest -Encoding UTF8
if($MediaFolder){$MediaFolder=[IO.Path]::GetFullPath($MediaFolder.Trim('"'));if(Test-Path $MediaFolder){$mediaDest=Join-Path $OfficialRoot ('media\expansions\'+$batchId);New-Item -ItemType Directory -Force -Path $mediaDest|Out-Null;Copy-Item (Join-Path $MediaFolder '*') $mediaDest -Recurse -Force}}
$manifest=$existingManifest
$batches=@($manifest.batches|Where-Object{$_.batchId -ne $batchId})
$batches+= [pscustomobject]@{batchId=$batchId;label=$label;file=($batchId+'.json');enabled=$true;mergeMode=$mergeMode;questionCount=$questions.Count;addedAt=(Get-Date).ToUniversalTime().ToString('o')}
$out=[ordered]@{schemaVersion='1.0.0';updatedAt=(Get-Date).ToUniversalTime().ToString('o');batches=$batches}
$out|ConvertTo-Json -Depth 20|Set-Content $manifestPath -Encoding UTF8
& (Join-Path $PSScriptRoot 'validate-private-bank.ps1') -OfficialRoot $OfficialRoot
Write-Host "Batch installed: $batchId ($($questions.Count) questions)" -ForegroundColor Green
Write-Host "Commit these files with GitHub Desktop:" -ForegroundColor Cyan
Write-Host "  data/expansions/batches/$batchId.json"
Write-Host "  data/expansions/manifest.json"
if($MediaFolder){Write-Host "  media/expansions/$batchId/"}
