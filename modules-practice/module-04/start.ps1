# Quick start without double-clicking start.bat
# From C-NotifyPush:  .\start.ps1

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

function Invoke-Python {
  param([string[]]$Args)
  if (Get-Command python -ErrorAction SilentlyContinue) {
    & python @Args
  } elseif (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3 @Args
  } else {
    throw "Python not found (need python or py on PATH)"
  }
}

Write-Host "[1/3] pip install (backend)..." -ForegroundColor Cyan
Push-Location "$Root\backend"
Invoke-Python -Args @("-m", "pip", "install", "-r", "requirements.txt")
Pop-Location

Write-Host "[2/3] npm install (frontend)..." -ForegroundColor Cyan
Push-Location "$Root\frontend"
npm install
Pop-Location

Write-Host "[3/3] Backend (new window) + frontend (this window)..." -ForegroundColor Cyan
$be = "$Root\backend" -replace "'", "''"
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$be'; if (Get-Command python -ErrorAction SilentlyContinue) { python app.py } else { py -3 app.py }"
)
Start-Sleep -Seconds 2
Set-Location "$Root\frontend"
npm start
