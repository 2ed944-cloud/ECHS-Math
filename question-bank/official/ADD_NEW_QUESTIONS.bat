@echo off
setlocal
cd /d "%~dp0"
set "BATCH=%~1"
if "%BATCH%"=="" set /p BATCH=Enter or paste the full path to the prepared JSON batch: 
set "MEDIA="
set /p MEDIA=Optional media folder path (press Enter to skip): 
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\add-question-batch.ps1" -BatchFile "%BATCH%" -OfficialRoot "%~dp0" -MediaFolder "%MEDIA%"
if errorlevel 1 (echo. & echo Import failed. & pause & exit /b 1)
echo.
echo The new questions are now connected to the archive, practice, exams, and dashboard.
echo Commit and push the changed files with GitHub Desktop.
pause
