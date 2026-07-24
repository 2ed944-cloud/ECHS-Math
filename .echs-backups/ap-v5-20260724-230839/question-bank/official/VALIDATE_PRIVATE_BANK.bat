@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0admin\tools\validate-private-bank.ps1" -OfficialRoot "%~dp0"
if errorlevel 1 pause
