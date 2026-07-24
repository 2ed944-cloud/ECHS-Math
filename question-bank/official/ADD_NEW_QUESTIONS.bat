@echo off
setlocal
if "%~1"=="" (
  echo Drag a prepared JSON batch onto this file, or enter its path below.
  set /p BATCH=Batch JSON path: 
) else set "BATCH=%~1"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0admin\tools\add-question-batch.ps1" -BatchFile "%BATCH%" -OfficialRoot "%~dp0"
if errorlevel 1 pause
endlocal
