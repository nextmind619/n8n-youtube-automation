# تشغيل لوحة تحكم YouTube Automation (Backend + Frontend)
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== YouTube Automation Dashboard ===" -ForegroundColor Cyan

# Backend
if (-not (Test-Path "web\backend\.env")) {
    Copy-Item "web\backend\.env.example" "web\backend\.env"
    Write-Host "تم إنشاء web\backend\.env — عدّل الإعدادات" -ForegroundColor Yellow
}

if (-not (Test-Path "web\backend\node_modules")) {
    Write-Host "Installing backend..." -ForegroundColor Gray
    Set-Location "web\backend"
    npm install
    Set-Location $root
}

if (-not (Test-Path "web\frontend\node_modules")) {
    Write-Host "Installing frontend..." -ForegroundColor Gray
    Set-Location "web\frontend"
    npm install
    Set-Location $root
}

Write-Host ""
Write-Host "Backend  -> http://localhost:3001" -ForegroundColor Green
Write-Host "Frontend -> http://localhost:5173" -ForegroundColor Green
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\web\backend'; npm run dev"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\web\frontend'; npm run dev"

Write-Host "تم تشغيل الخادمين في نوافذ منفصلة." -ForegroundColor Cyan
