# Fix Rate Limit Error Script
# Kills old server and starts fresh with debugging

Write-Host "🔧 Rate Limit Error Fix" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Stopping any running Node.js servers..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1
Write-Host "✅ Old server processes stopped" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Checking environment..." -ForegroundColor Yellow
if ($env:NODE_ENV -eq "production") {
    Write-Host "⚠️  NODE_ENV is set to 'production' - removing it" -ForegroundColor Yellow
    Remove-Item Env:\NODE_ENV -ErrorAction SilentlyContinue
}
Write-Host "✅ Environment: Development mode" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Starting server with fresh rate limit counters..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Server starting..." -ForegroundColor Cyan
Write-Host "💡 Watch for debug messages showing your IP address" -ForegroundColor Gray
Write-Host "💡 Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Start server
node server.js

