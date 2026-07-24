param([Parameter(Mandatory=$true)][string]$BatchFile,[string]$OfficialRoot="",[string]$MediaFolder="")
& (Join-Path $PSScriptRoot '..\admin\tools\add-question-batch.ps1') @PSBoundParameters
exit $LASTEXITCODE
