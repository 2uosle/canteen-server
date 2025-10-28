# Apply Cancellation Reason Migration
# This script adds cancellation tracking fields to the pending_reloads table

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Canteen Server - Database Migration" -ForegroundColor Cyan
Write-Host "  Add Cancellation Reason Tracking" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "[OK] Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "[ERROR] .env file not found" -ForegroundColor Red
    exit 1
}

# Get database credentials
$DB_HOST = $env:DB_HOST
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD
$DB_NAME = $env:DB_NAME

if (-not $DB_HOST -or -not $DB_USER -or -not $DB_NAME) {
    Write-Host "[ERROR] Missing required database environment variables" -ForegroundColor Red
    Write-Host "Required: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME" -ForegroundColor Yellow
    exit 1
}

Write-Host "Database: $DB_NAME @ $DB_HOST" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL client is available
$mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCmd) {
    Write-Host "[ERROR] MySQL client not found in PATH" -ForegroundColor Red
    Write-Host "Please install MySQL client or add it to your PATH" -ForegroundColor Yellow
    exit 1
}

# Confirm migration
Write-Host "This migration will add the following columns to pending_reloads table:" -ForegroundColor Yellow
Write-Host "  - cancellation_reason (VARCHAR 255)" -ForegroundColor White
Write-Host "  - cancelled_at (TIMESTAMP)" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Do you want to continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "[CANCELLED] Migration aborted by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Running migration..." -ForegroundColor Cyan

# Build MySQL command
$migrationFile = "migrations\add-cancellation-reason.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "[ERROR] Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

# Execute migration
try {
    if ($DB_PASSWORD) {
        $output = & mysql -h $DB_HOST -u $DB_USER "-p$DB_PASSWORD" $DB_NAME -e "source $migrationFile" 2>&1
    } else {
        $output = & mysql -h $DB_HOST -u $DB_USER $DB_NAME -e "source $migrationFile" 2>&1
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Cancellation tracking has been added to the database." -ForegroundColor Green
        Write-Host "Top-up cancellations will now be logged with reasons." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Migration failed" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Failed to execute migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart the server to use the new cancellation feature" -ForegroundColor White
Write-Host "2. Test top-up cancellation with reasons" -ForegroundColor White
Write-Host "3. Check logs/combined-*.log for cancellation logs" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
