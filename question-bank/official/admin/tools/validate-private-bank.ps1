param([string]$OfficialRoot="")
$ErrorActionPreference="Stop"
if([string]::IsNullOrWhiteSpace($OfficialRoot)){$OfficialRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))}
$OfficialRoot=[IO.Path]::GetFullPath($OfficialRoot)
$errors=@();$warnings=@()
function Load-Json([string]$Relative){
  $p=Join-Path $OfficialRoot $Relative
  if(-not(Test-Path -LiteralPath $p)){$script:errors += ('Missing required JSON: {0}' -f $Relative);return $null}
  try{return Get-Content -LiteralPath $p -Raw -Encoding UTF8|ConvertFrom-Json}catch{$script:errors += ('Invalid JSON {0}: {1}' -f $Relative,$_.Exception.Message);return $null}
}
$full=Load-Json 'data\question-index.json'
$student=Load-Json 'data\student\question-index.json'
$archive=Load-Json 'data\student\archive-index.json'
$gate=Load-Json 'data\student\gate.json'
$summary=Load-Json 'reports\AUDIT_SUMMARY.json'
$manifest=Load-Json 'data\expansions\manifest.json'

if($full){$fullIds=@{};foreach($r in @($full)){if($fullIds.ContainsKey([string]$r.id)){$errors += "Duplicate canonical ID: $($r.id)"}else{$fullIds[[string]$r.id]=$true}}}
if($student){$studentIds=@{};foreach($r in @($student)){if($studentIds.ContainsKey([string]$r.id)){$errors += "Duplicate student ID: $($r.id)"};$studentIds[[string]$r.id]=$true;if($r.studentReady -ne $true){$errors += "Student index contains non-ready record: $($r.id)"};if($r.answerVerified -ne $true -or $r.mathVerified -ne $true -or $r.mediaVerified -ne $true -or $r.mappingVerified -ne $true){$errors += "Student gate flags failed: $($r.id)"}}}
if($full -and $student){foreach($id in $studentIds.Keys){if(-not $fullIds.ContainsKey($id)){$errors += "Student ID absent from canonical index: $id"}}}
if($archive -and $full -and @($archive).Count -ne @($full).Count){$errors += "Archive count $(@($archive).Count) does not equal canonical count $(@($full).Count)."}
if($gate -and $student -and [int]$gate.studentReadyCount -ne @($student).Count){$errors += 'gate.json studentReadyCount does not match student index.'}
if($summary -and $full -and [int]$summary.totalQuestionsAudited -ne @($full).Count){$errors += 'Audit summary canonical count mismatch.'}
if($summary -and $student -and [int]$summary.questionsStudentReady -ne @($student).Count){$errors += 'Audit summary student-ready count mismatch.'}

# Verify student chunks and redaction boundary.
$studentMap=Load-Json 'data\student\id-map.json';$archiveMap=Load-Json 'data\student\archive-id-map.json'
if($studentMap){foreach($prop in $studentMap.PSObject.Properties){$path=Join-Path $OfficialRoot ('data\student\questions\'+[string]$prop.Value);if(-not(Test-Path $path)){$errors += "Missing student chunk: $($prop.Value)"}}}
if($archiveMap){foreach($prop in $archiveMap.PSObject.Properties){$path=Join-Path $OfficialRoot ('data\student\archive-questions\'+[string]$prop.Value);if(-not(Test-Path $path)){$errors += "Missing archive chunk: $($prop.Value)"}}}

# Expansions must remain teacher-only.
$expansionRecords=0
if($manifest){foreach($entry in @($manifest.batches)){if($entry.enabled -eq $false){continue};$path=Join-Path $OfficialRoot ('data\expansions\batches\'+$entry.file);if(-not(Test-Path $path)){$errors += "Missing expansion batch: $($entry.file)";continue};$batch=Get-Content $path -Raw -Encoding UTF8|ConvertFrom-Json;foreach($q in @($batch.questions)){$expansionRecords++;if($q.studentReady -eq $true -or $q.quality.studentReadyGatePassed -eq $true){$errors += "Expansion improperly marked student-ready: $($q.id)"};foreach($m in @($q.media)){if($m.path){$mp=Join-Path $OfficialRoot ([string]$m.path -replace '/','\');if(-not(Test-Path $mp)){$errors += "Missing expansion media for $($q.id): $($m.path)"}}}}}}

$result=[ordered]@{
  valid=($errors.Count -eq 0);canonicalRecords=if($full){@($full).Count}else{0};studentReadyRecords=if($student){@($student).Count}else{0}
  archiveRecords=if($archive){@($archive).Count}else{0};teacherArchiveOnly=if($full -and $student){@($full).Count-@($student).Count}else{0}
  expansionRecords=$expansionRecords;errors=$errors;warnings=$warnings;checkedAt=(Get-Date).ToUniversalTime().ToString('o')
}
$result|ConvertTo-Json -Depth 30
$report=Join-Path $OfficialRoot 'reports\latest-expansion-validation.json';New-Item -ItemType Directory -Force -Path (Split-Path $report)|Out-Null;$result|ConvertTo-Json -Depth 30|Set-Content $report -Encoding UTF8
if(-not $result.valid){exit 1}
