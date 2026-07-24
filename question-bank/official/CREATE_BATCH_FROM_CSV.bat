@echo off
setlocal
cd /d "%~dp0"
set "CSV=%~1"
if "%CSV%"=="" set /p CSV=Enter or paste the full path to the CSV file: 
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\create-batch-from-csv.ps1" -CsvFile "%CSV%"
if errorlevel 1 (echo. & echo Conversion failed. & pause & exit /b 1)
pause
