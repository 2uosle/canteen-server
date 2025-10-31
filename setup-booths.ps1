# ============================================
# Setup Default Booth Accounts
# ============================================
# This script creates 3 pre-configured booth/counter accounts
# ============================================

Write-Host "`n=== Setting Up Default Booth Accounts ===" -ForegroundColor Cyan
Write-Host "This will create 3 vendor accounts:" -ForegroundColor White
Write-Host "  1. Snack Bar (counter1)" -ForegroundColor Yellow
Write-Host "  2. Cafeteria (counter2)" -ForegroundColor Yellow
Write-Host "  3. Snack Bar 2 (counter3)" -ForegroundColor Yellow
Write-Host "`nDefault password for all: counter123" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Cyan

# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$name" -Value $value
        }
    }
    Write-Host "[OK] Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    exit 1
}

# Get database credentials
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "root" }
$DB_PASS = if ($env:DB_PASS) { $env:DB_PASS } else { "" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "canteen_db" }

Write-Host "Database: $DB_NAME@$DB_HOST" -ForegroundColor Cyan

# Run the SQL script
Write-Host "`nCreating booth accounts..." -ForegroundColor Yellow

$mysqlCmd = "mysql"
$mysqlArgs = @("-h", $DB_HOST, "-u", $DB_USER)

if ($DB_PASS -ne "") {
    $mysqlArgs += "-p$DB_PASS"
}

$mysqlArgs += $DB_NAME

# Execute SQL script
Get-Content "setup-default-booths.sql" -Raw | & $mysqlCmd $mysqlArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Booth accounts created!" -ForegroundColor Green
    Write-Host "`n=== Login Credentials ===" -ForegroundColor Cyan
    Write-Host "Counter 1 - Snack Bar" -ForegroundColor Yellow
    Write-Host "  Username: counter1" -ForegroundColor White
    Write-Host "  Password: counter123" -ForegroundColor White
    Write-Host "`nCounter 2 - Cafeteria" -ForegroundColor Yellow
    Write-Host "  Username: counter2" -ForegroundColor White
    Write-Host "  Password: counter123" -ForegroundColor White
    Write-Host "`nCounter 3 - Snack Bar 2" -ForegroundColor Yellow
    Write-Host "  Username: counter3" -ForegroundColor White
    Write-Host "  Password: counter123" -ForegroundColor White
    Write-Host "`n[IMPORTANT] Please change these passwords after first login!" -ForegroundColor Red
    Write-Host "============================================`n" -ForegroundColor Cyan
} else {
    Write-Host "`n[ERROR] Failed to create booth accounts!" -ForegroundColor Red
    Write-Host "Check your database connection and try again." -ForegroundColor Yellow
    exit 1
}
