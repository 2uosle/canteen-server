# Quick Start Script for Canteen Server
# Checks dependencies and starts the server

Write-Host "🍽️  Canteen Server - Quick Start" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "💡 Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found - running npm install..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies found" -ForegroundColor Green
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host "💡 Create .env file with your database credentials" -ForegroundColor Cyan
    Write-Host "   (See .env.example for template)" -ForegroundColor Gray
    Write-Host ""
    $createEnv = Read-Host "Create basic .env now? (yes/no)"
    if ($createEnv -eq "yes") {
        Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
        if (Test-Path ".env") {
            Write-Host "✅ .env created - edit it with your database details" -ForegroundColor Green
        }
    }
}

# Check if server.js exists
if (-not (Test-Path "server.js")) {
    Write-Host "❌ server.js not found!" -ForegroundColor Red
    Write-Host "💡 Are you in the right directory?" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ server.js found" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Starting server..." -ForegroundColor Cyan
Write-Host "💡 Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start the server
node server.js

