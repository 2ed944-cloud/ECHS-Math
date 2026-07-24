param([string]$OfficialRoot="")
& (Join-Path $PSScriptRoot '..\admin\tools\validate-private-bank.ps1') -OfficialRoot $OfficialRoot
exit $LASTEXITCODE
