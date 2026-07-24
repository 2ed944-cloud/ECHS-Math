param(
  [Parameter(Mandatory=$true)][string]$CsvFile,
  [string]$OutputJson="",
  [string]$BatchId="",
  [string]$Label=""
)
$ErrorActionPreference='Stop'
$CsvFile=[IO.Path]::GetFullPath($CsvFile.Trim('"'))
if(-not(Test-Path $CsvFile)){throw 'CSV not found.'}
if(-not $BatchId){$BatchId=[IO.Path]::GetFileNameWithoutExtension($CsvFile)}
$BatchId=($BatchId.ToLowerInvariant() -replace '[^a-z0-9-]+','-' -replace '^-|-$','')
if(-not $Label){$Label=$BatchId}
if(-not $OutputJson){$OutputJson=Join-Path (Split-Path $CsvFile) ($BatchId+'.json')}
$questions=@()
foreach($r in (Import-Csv $CsvFile)){
  $choices=@(); foreach($letter in 'A','B','C','D','E'){$v=$r.('choice'+$letter);if($v){$choices+=[ordered]@{label=$letter;text=$v}}}
  $q=[ordered]@{
    id=$r.id; course=$r.course; courseId=$r.courseId; assessmentFamily=$r.assessmentFamily
    type=$r.type; year=if($r.year){[int]$r.year}else{$null}; questionNumber=$r.questionNumber
    section=$r.section; calculator=$r.calculator; prompt=$r.prompt; choices=$choices
    answer=$r.answer; workedSolution=$r.workedSolution
    classification=[ordered]@{
      primaryUnit=if($r.primaryUnit){[int]$r.primaryUnit}else{$null}; primaryTopic=$r.primaryTopic
      topicCode=$r.topicCode; lessonIds=if($r.lessonId){@($r.lessonId)}else{@()}
      learningObjectives=if($r.learningObjective){@($r.learningObjective)}else{@()}
      skillCategories=if($r.skill){@($r.skill)}else{@()}
    }
    pedagogy=[ordered]@{difficulty=if($r.difficulty){[int]$r.difficulty}else{$null};difficultyLabel=$r.difficultyLabel}
    quality=[ordered]@{
      productionStatus='teacher-archive-only'; needsReview=$true; transcriptionVerified=$false
      answerVerified=$false; mathematicalVerificationPassed=$false; katexVerified=$false
      mediaVerified=$false; mappingVerified=$false; studentReadyGatePassed=$false
      reviewReasons=@('Imported from CSV; independent teacher/source verification is required before student release.')
    }
    studentReady=$false; studentEligible=$false; studentAccessible=$false; deploymentAccess='teacher-archive-only'
    source=[ordered]@{officialStatus=$r.officialStatus;sourceFile=$r.sourceFile;sourcePage=$r.sourcePage;accessLevel='private-school-approved'}
  }
  $questions += [pscustomobject]$q
}
$out=[ordered]@{schemaVersion='1.0.0';batchId=$BatchId;label=$Label;mergeMode='upsert';createdAt=(Get-Date).ToUniversalTime().ToString('o');reviewRequired=$true;studentReleaseApproved=$false;questions=$questions}
$out|ConvertTo-Json -Depth 100|Set-Content $OutputJson -Encoding UTF8
Write-Host "Created teacher-only batch $OutputJson with $($questions.Count) records." -ForegroundColor Green
