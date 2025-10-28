# Test Top-Up Cancellation Feature
# This script helps verify the cancellation feature is working correctly

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Top-Up Cancellation Feature Test" -ForegroundColor Cyan
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
}

$DB_HOST = $env:DB_HOST
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD
$DB_NAME = $env:DB_NAME

Write-Host "Test Checklist:" -ForegroundColor Yellow
Write-Host ""

# Test 1: Check database schema
Write-Host "[1/5] Checking database schema..." -ForegroundColor Cyan
try {
    $query = "DESCRIBE pending_reloads;"
    if ($DB_PASSWORD) {
        $output = & mysql -h $DB_HOST -u $DB_USER "-p$DB_PASSWORD" $DB_NAME -e $query 2>&1
    } else {
        $output = & mysql -h $DB_HOST -u $DB_USER $DB_NAME -e $query 2>&1
    }
    
    if ($output -match "cancellation_reason" -and $output -match "cancelled_at") {
        Write-Host "   [PASS] Required columns exist" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Missing cancellation columns - run migration first" -ForegroundColor Red
        Write-Host "   Run: .\apply-cancellation-migration.ps1" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [ERROR] Cannot connect to database" -ForegroundColor Red
}

Write-Host ""

# Test 2: Check if modal exists in HTML
Write-Host "[2/5] Checking HTML modal..." -ForegroundColor Cyan
if (Test-Path "public\index.html") {
    $html = Get-Content "public\index.html" -Raw
    if ($html -match "topupCancelModal" -and $html -match "cancelReasonSelect") {
        Write-Host "   [PASS] Cancellation modal found in HTML" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Cancellation modal missing" -ForegroundColor Red
    }
} else {
    Write-Host "   [SKIP] HTML file not found" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Check JavaScript functions
Write-Host "[3/5] Checking JavaScript functions..." -ForegroundColor Cyan
if (Test-Path "public\js\app.js") {
    $js = Get-Content "public\js\app.js" -Raw
    $hasToggle = $js -match "toggleCustomCancelReason"
    $hasConfirm = $js -match "confirmTopupCancellation"
    
    if ($hasToggle -and $hasConfirm) {
        Write-Host "   [PASS] Required functions found" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Missing JavaScript functions" -ForegroundColor Red
        if (-not $hasToggle) { Write-Host "      - toggleCustomCancelReason missing" -ForegroundColor Red }
        if (-not $hasConfirm) { Write-Host "      - confirmTopupCancellation missing" -ForegroundColor Red }
    }
} else {
    Write-Host "   [SKIP] JavaScript file not found" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Check server endpoint
Write-Host "[4/5] Checking server endpoint..." -ForegroundColor Cyan
if (Test-Path "server.js") {
    $server = Get-Content "server.js" -Raw
    if ($server -match "/pending-reload/cancel" -and $server -match "cancellation_reason") {
        Write-Host "   [PASS] Cancel endpoint found in server.js" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Cancel endpoint missing or incomplete" -ForegroundColor Red
    }
} else {
    Write-Host "   [SKIP] server.js not found" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: Check logger integration
Write-Host "[5/5] Checking logger integration..." -ForegroundColor Cyan
if (Test-Path "server.js") {
    $server = Get-Content "server.js" -Raw
    if ($server -match "logger\.warn.*TOPUP_CANCELLED") {
        Write-Host "   [PASS] Logger integration found" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Logger might not be properly configured" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [SKIP] server.js not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Manual testing instructions
Write-Host "Manual Testing Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start the server: .\start-server.ps1" -ForegroundColor White
Write-Host "2. Login as booth staff" -ForegroundColor White
Write-Host "3. Click 'Quick Top-Up'" -ForegroundColor White
Write-Host "4. Enter amount and click CONTINUE" -ForegroundColor White
Write-Host "5. Click CONFIRM" -ForegroundColor White
Write-Host "6. On 'TAP CARD NOW' screen, click CANCEL" -ForegroundColor White
Write-Host "7. Verify cancellation modal appears" -ForegroundColor White
Write-Host "8. Try submitting without reason (should fail)" -ForegroundColor White
Write-Host "9. Select a predefined reason" -ForegroundColor White
Write-Host "10. Click 'Confirm Cancellation'" -ForegroundColor White
Write-Host "11. Verify transaction is cancelled" -ForegroundColor White
Write-Host "12. Check logs for cancellation entry:" -ForegroundColor White
Write-Host "    Get-Content logs\combined-*.log -Tail 20 | Select-String 'TOPUP_CANCELLED'" -ForegroundColor Cyan
Write-Host ""

Write-Host "Database Query to Check Cancellations:" -ForegroundColor Yellow
Write-Host "SELECT * FROM pending_reloads WHERE confirmed = 2 AND cancellation_reason IS NOT NULL;" -ForegroundColor Cyan
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
