param([string]$OfficialRoot="")
$ErrorActionPreference="Stop"
if([string]::IsNullOrWhiteSpace($OfficialRoot)){$OfficialRoot=(Split-Path -Parent $PSScriptRoot)}
$OfficialRoot=[IO.Path]::GetFullPath($OfficialRoot)
$core=Get-Content (Join-Path $OfficialRoot 'data\question-index.json') -Raw -Encoding UTF8|ConvertFrom-Json
$manifest=Get-Content (Join-Path $OfficialRoot 'data\expansions\manifest.json') -Raw -Encoding UTF8|ConvertFrom-Json
$ids=@{};$errors=@();foreach($r in $core){$id=[string]$r.id;if($ids.ContainsKey($id)){$errors+="Duplicate core ID: $id"}else{$ids[$id]='core'}}
$batchQuestions=0;foreach($entry in @($manifest.batches)){if($entry.enabled -eq $false){continue};$path=Join-Path $OfficialRoot ('data\expansions\batches\'+$entry.file);if(-not(Test-Path $path)){$errors+="Missing batch file: $($entry.file)";continue};$batch=Get-Content $path -Raw -Encoding UTF8|ConvertFrom-Json;foreach($q in @($batch.questions)){$batchQuestions++;$id=[string]$q.id;if([string]::IsNullOrWhiteSpace($id)){$errors+="Missing ID in $($entry.file)";continue};$ids[$id]=$entry.batchId;foreach($m in @($q.media)){if($m.path){$mp=Join-Path $OfficialRoot ([string]$m.path -replace '/','\');if(-not(Test-Path $mp)){$errors+="Missing media for ${id}: $($m.path)"}}}}}
$result=[ordered]@{valid=($errors.Count -eq 0);coreRecords=$core.Count;expansionRecords=$batchQuestions;effectiveUniqueRecords=$ids.Count;enabledBatches=@($manifest.batches|Where-Object{$_.enabled -ne $false}).Count;errors=$errors;checkedAt=(Get-Date).ToUniversalTime().ToString('o')}
$result|ConvertTo-Json -Depth 20
$report=Join-Path $OfficialRoot 'reports\latest-expansion-validation.json';New-Item -ItemType Directory -Force -Path (Split-Path $report)|Out-Null;$result|ConvertTo-Json -Depth 20|Set-Content $report -Encoding UTF8
if(-not $result.valid){exit 1}
