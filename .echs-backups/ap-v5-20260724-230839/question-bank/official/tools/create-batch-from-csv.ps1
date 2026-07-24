param([Parameter(Mandatory=$true)][string]$CsvFile,[string]$OutputJson="",[string]$BatchId="",[string]$Label="")
& (Join-Path $PSScriptRoot '..\admin\tools\create-batch-from-csv.ps1') @PSBoundParameters
exit $LASTEXITCODE
