# ─────────────────────────────────────────────────────────────────
# RentHub — Windows Dev Runner (PowerShell)
# Starts the API server (port 3000) and Vite frontend (port 5173)
# in two separate console windows.
#
# Usage (PowerShell):
#   .\run.ps1
#
# Or from Command Prompt:
#   powershell -ExecutionPolicy Bypass -File run.ps1
# ─────────────────────────────────────────────────────────────────

$Root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$Server = Join-Path $Root "server"
$Web    = Join-Path $Root "web"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   🏠  RentHub — Dev Environment      ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "  API Server  -> http://localhost:3000"     -ForegroundColor Yellow
Write-Host "  Frontend    -> http://localhost:5173"     -ForegroundColor Magenta
Write-Host ""
Write-Host "  Close this window (or Ctrl+C) to stop all processes."
Write-Host ""

# Install deps if missing
if (-not (Test-Path "$Server\node_modules")) {
    Write-Host "Installing server dependencies..." -ForegroundColor Yellow
    Push-Location $Server; npm install; Pop-Location
}
if (-not (Test-Path "$Web\node_modules")) {
    Write-Host "Installing web dependencies..." -ForegroundColor Yellow
    Push-Location $Web; npm install; Pop-Location
}

# Launch server in a new console window
$ServerJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$Server'; Write-Host '[server] Starting API...' -ForegroundColor Cyan; npm run dev" `
    -PassThru

# Launch web in another new console window
$WebJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$Web'; Write-Host '[web] Starting Vite...' -ForegroundColor Magenta; npm run dev" `
    -PassThru

Write-Host "Both processes started." -ForegroundColor Green
Write-Host "  Server PID : $($ServerJob.Id)"
Write-Host "  Web    PID : $($WebJob.Id)"
Write-Host ""
Write-Host "Press ENTER to stop both and exit..." -ForegroundColor Yellow

# Wait for user to press Enter
$null = Read-Host

# Clean up
Write-Host "Stopping processes..." -ForegroundColor Yellow
Stop-Process -Id $ServerJob.Id -ErrorAction SilentlyContinue
Stop-Process -Id $WebJob.Id   -ErrorAction SilentlyContinue
Write-Host "Done. Goodbye!" -ForegroundColor Green
