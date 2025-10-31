# Environment Setup Script
# Interactive .env file creation

Write-Host "🔧 Canteen Server - Environment Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env already exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (yes/no)"
    if ($overwrite -ne "yes") {
        Write-Host "❌ Setup cancelled" -ForegroundColor Red
        exit 0
    }
    Write-Host ""
}

# Check if template exists
if (-not (Test-Path "env.template")) {
    Write-Host "❌ env.template not found!" -ForegroundColor Red
    Write-Host "💡 Make sure you're in the project directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "This wizard will help you create your .env file" -ForegroundColor Green
Write-Host ""
Write-Host "You can press Enter to use default values [shown in brackets]" -ForegroundColor Gray
Write-Host ""

# Collect configuration
Write-Host "📋 SERVER CONFIGURATION" -ForegroundColor Cyan
Write-Host "----------------------" -ForegroundColor Cyan

$port = Read-Host "Server port [3000]"
if ([string]::IsNullOrWhiteSpace($port)) { $port = "3000" }

$nodeEnv = Read-Host "Environment (development/production) [development]"
if ([string]::IsNullOrWhiteSpace($nodeEnv)) { $nodeEnv = "development" }

Write-Host ""
Write-Host "🗄️  DATABASE CONFIGURATION" -ForegroundColor Cyan
Write-Host "-------------------------" -ForegroundColor Cyan

$dbHost = Read-Host "MySQL host [127.0.0.1]"
if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "127.0.0.1" }

$dbUser = Read-Host "MySQL username [root]"
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "root" }

$dbPass = Read-Host "MySQL password (REQUIRED)"
if ([string]::IsNullOrWhiteSpace($dbPass)) {
    Write-Host "❌ Database password is required!" -ForegroundColor Red
    exit 1
}

$dbName = Read-Host "Database name [canteen_db]"
if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "canteen_db" }

Write-Host ""
Write-Host "🔐 SECURITY CONFIGURATION" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan

Write-Host "Generating secure JWT secret..." -ForegroundColor Yellow
$jwtSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" 2>$null

if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    Write-Host "⚠️  Could not generate JWT secret automatically" -ForegroundColor Yellow
    $jwtSecret = Read-Host "Enter JWT secret (or press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
        $jwtSecret = "please_change_this_secret_key_in_production"
        Write-Host "⚠️  Using default secret - CHANGE THIS IN PRODUCTION!" -ForegroundColor Red
    }
} else {
    Write-Host "✅ Generated secure JWT secret" -ForegroundColor Green
}

Write-Host ""
Write-Host "⚙️  OPTIONAL FEATURES" -ForegroundColor Cyan
Write-Host "--------------------" -ForegroundColor Cyan

$enableRedis = Read-Host "Enable Redis caching? (yes/no) [no]"
$redisEnabled = if ($enableRedis -eq "yes") { "true" } else { "false" }

$enableWs = Read-Host "Enable WebSocket real-time updates? (yes/no) [no]"
$wsEnabled = if ($enableWs -eq "yes") { "true" } else { "false" }

# Create .env file
Write-Host ""
Write-Host "📝 Creating .env file..." -ForegroundColor Yellow

$envContent = @"
# ==================================================================
# CANTEEN SERVER - ENVIRONMENT CONFIGURATION
# ==================================================================
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# IMPORTANT: Never commit this file to Git!
# ==================================================================

# ------------------------------------------------------------------
# SERVER CONFIGURATION
# ------------------------------------------------------------------
PORT=$port
NODE_ENV=$nodeEnv

# ------------------------------------------------------------------
# DATABASE CONFIGURATION
# ------------------------------------------------------------------
DB_HOST=$dbHost
DB_PORT=3306
DB_USER=$dbUser
DB_PASS=$dbPass
DB_NAME=$dbName

# ------------------------------------------------------------------
# SECURITY & AUTHENTICATION
# ------------------------------------------------------------------
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=2h
BCRYPT_ROUNDS=10

# ------------------------------------------------------------------
# RATE LIMITING
# ------------------------------------------------------------------
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5

# ------------------------------------------------------------------
# RFID PAIRING
# ------------------------------------------------------------------
RFID_LINK_TTL_SEC=120

# ------------------------------------------------------------------
# REDIS (OPTIONAL)
# ------------------------------------------------------------------
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=$redisEnabled
REDIS_PREFIX=canteen:

# ------------------------------------------------------------------
# WEBSOCKET (OPTIONAL)
# ------------------------------------------------------------------
WS_PORT=3001
WS_ENABLED=$wsEnabled

# ------------------------------------------------------------------
# CORS
# ------------------------------------------------------------------
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# ------------------------------------------------------------------
# LOGGING
# ------------------------------------------------------------------
LOG_LEVEL=info

# ------------------------------------------------------------------
# TIMEZONE & LOCALIZATION
# ------------------------------------------------------------------
TZ=Asia/Manila
CURRENCY_SYMBOL=₱
CURRENCY_CODE=PHP

# ------------------------------------------------------------------
# FEATURE FLAGS
# ------------------------------------------------------------------
ALLOW_STUDENT_REGISTRATION=false
ALLOW_BALANCE_TRANSFER=false
ENABLE_SPENDING_LIMITS=false
DEFAULT_DAILY_LIMIT=500
ENABLE_RECEIPTS=true

# ------------------------------------------------------------------
# ADVANCED SETTINGS
# ------------------------------------------------------------------
REQUEST_TIMEOUT=30000
BODY_LIMIT=10mb
TRUST_PROXY=false

# ==================================================================
"@

# Write to file
$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "📊 CONFIGURATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "Server Port:      $port" -ForegroundColor White
Write-Host "Environment:      $nodeEnv" -ForegroundColor White
Write-Host "Database Host:    $dbHost" -ForegroundColor White
Write-Host "Database User:    $dbUser" -ForegroundColor White
Write-Host "Database Name:    $dbName" -ForegroundColor White
Write-Host "Redis:            $redisEnabled" -ForegroundColor White
Write-Host "WebSocket:        $wsEnabled" -ForegroundColor White
Write-Host ""

# Security warnings
if ($nodeEnv -eq "production") {
    Write-Host "🔒 PRODUCTION MODE ENABLED" -ForegroundColor Yellow
    Write-Host "==========================" -ForegroundColor Yellow
    Write-Host "⚠️  Make sure to:" -ForegroundColor Red
    Write-Host "  • Use HTTPS" -ForegroundColor White
    Write-Host "  • Set specific CORS_ORIGIN (not *)" -ForegroundColor White
    Write-Host "  • Enable firewall" -ForegroundColor White
    Write-Host "  • Review security settings" -ForegroundColor White
    Write-Host ""
}

if ($jwtSecret -eq "please_change_this_secret_key_in_production") {
    Write-Host "⚠️  WARNING: Using default JWT secret!" -ForegroundColor Red
    Write-Host "💡 Generate a secure one:" -ForegroundColor Yellow
    Write-Host "   node -e `"console.log(require('crypto').randomBytes(64).toString('hex'))`"" -ForegroundColor Gray
    Write-Host ""
}

# Next steps
Write-Host "🚀 NEXT STEPS" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan
Write-Host "1. Review your .env file: notepad .env" -ForegroundColor White
Write-Host "2. Create database: CREATE DATABASE $dbName;" -ForegroundColor White
Write-Host "3. Run migrations (if you have them)" -ForegroundColor White
Write-Host "4. Start server: node server.js" -ForegroundColor White
Write-Host ""

Write-Host "📚 For more information, read:" -ForegroundColor Yellow
Write-Host "   • ENV-SETUP.md - Complete configuration guide" -ForegroundColor Gray
Write-Host "   • env.template - Template with all options" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ Setup complete! Happy coding!" -ForegroundColor Green

