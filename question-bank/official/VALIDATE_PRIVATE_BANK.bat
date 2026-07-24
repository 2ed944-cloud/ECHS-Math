@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\validate-private-bank.ps1" -OfficialRoot "%~dp0"
pause
