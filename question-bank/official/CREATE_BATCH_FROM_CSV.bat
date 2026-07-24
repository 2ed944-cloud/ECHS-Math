@echo off
setlocal
if "%~1"=="" (set /p CSV=CSV path: ) else set "CSV=%~1"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0admin\tools\create-batch-from-csv.ps1" -CsvFile "%CSV%"
if errorlevel 1 pause
endlocal
