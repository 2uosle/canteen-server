# Comprehensive System Tests - Full Feature Coverage
# ===================================================

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "  COMPREHENSIVE SYSTEM TESTS" -ForegroundColor Cyan
Write-Host "  (For Thesis Demonstration)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$testCount = 0
$passCount = 0
$failCount = 0

# Test tracking
function Log-Test {
    param([string]$Description, [bool]$Success, [string]$Details = "")
    
    $script:testCount++
    if ($Success) {
        $script:passCount++
        Write-Host "  [PASS] $Description" -ForegroundColor Green
    } else {
        $script:failCount++
        Write-Host "  [FAIL] $Description" -ForegroundColor Red
    }
    if ($Details) {
        Write-Host "         $Details" -ForegroundColor Gray
    }
}

# Check server
Write-Host "Checking server status..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -UseBasicParsing
    Write-Host "Server is running! Database: $($health.db)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Server is not running!" -ForegroundColor Red
    Write-Host "Start with: node server.js" -ForegroundColor Yellow
    exit
}

Write-Host "Running comprehensive tests..." -ForegroundColor Cyan
Write-Host "This will generate extensive logs for your thesis.`n" -ForegroundColor Yellow

# ============================================
# SECTION 1: USER REGISTRATION & AUTH
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "SECTION 1: USER REGISTRATION & AUTHENTICATION" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

# Test 1: Weak password
Write-Host "`n[Test 1] Weak password validation..."
try {
    $body = @{username="weak$(Get-Random)"; name="Weak User"; password="weakpass123"; role="student"} | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Out-Null
    Log-Test "Weak password rejection" $false "Should have been rejected"
} catch {
    Log-Test "Weak password rejection" $true "Correctly rejected"
}
Start-Sleep -Milliseconds 300

# Test 2: No uppercase
Write-Host "`n[Test 2] Password without uppercase..."
try {
    $body = @{username="noupper$(Get-Random)"; name="No Upper"; password="password123!"; role="student"} | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Out-Null
    Log-Test "No uppercase rejection" $false
} catch {
    Log-Test "No uppercase rejection" $true
}
Start-Sleep -Milliseconds 300

# Test 3: Strong password - Student
Write-Host "`n[Test 3] Register student with strong password..."
$studentUser = $null
try {
    $body = @{username="student$(Get-Random)"; name="Test Student"; password="Student123!"; role="student"} | ConvertTo-Json
    $studentUser = Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Log-Test "Student registration" $true "User ID: $($studentUser.user_id)"
} catch {
    Log-Test "Student registration" $false $_.Exception.Message
}
Start-Sleep -Milliseconds 300

# Test 4: Register Staff
Write-Host "`n[Test 4] Register staff member..."
$staffUser = $null
try {
    $body = @{username="staff$(Get-Random)"; name="Test Staff"; password="Staff123!"; role="staff"} | ConvertTo-Json
    $staffUser = Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Log-Test "Staff registration" $true "User ID: $($staffUser.user_id)"
} catch {
    Log-Test "Staff registration" $false $_.Exception.Message
}
Start-Sleep -Milliseconds 300

# Test 5: Login with correct credentials
Write-Host "`n[Test 5] Login with valid credentials..."
$staffToken = $null
if ($staffUser) {
    try {
        $body = @{username=$staffUser.username; password="Staff123!"} | ConvertTo-Json
        $loginResult = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
        $staffToken = $loginResult.token
        Log-Test "Staff login" $true "Token received"
    } catch {
        Log-Test "Staff login" $false $_.Exception.Message
    }
}
Start-Sleep -Milliseconds 300

# Test 6: Login with wrong password
Write-Host "`n[Test 6] Login with wrong password..."
try {
    $body = @{username="wronguser"; password="WrongPass123!"} | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Out-Null
    Log-Test "Wrong password rejection" $false
} catch {
    Log-Test "Wrong password rejection" $true
}
Start-Sleep -Milliseconds 300

# ============================================
# SECTION 2: BALANCE & RELOADS
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "SECTION 2: BALANCE OPERATIONS & RELOADS" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

# Test 7: Add user with RFID (staff operation)
Write-Host "`n[Test 7] Create user with RFID..."
$rfidUser = $null
if ($staffToken) {
    try {
        $rfidUid = "ABCD$(Get-Random -Minimum 1000 -Maximum 9999)"
        $body = @{
            name="RFID Test User"
            username="rfiduser$(Get-Random)"
            rfid_uid=$rfidUid
            role="student"
            balance=100
            password="RfidUser123!"
        } | ConvertTo-Json
        
        $headers = @{Authorization="Bearer $staffToken"}
        $rfidUser = Invoke-RestMethod -Uri "$baseUrl/addUser" -Method POST -Body $body -ContentType "application/json" -Headers $headers -UseBasicParsing
        Log-Test "Create user with RFID" $true "UID: $rfidUid, Balance: 100"
    } catch {
        Log-Test "Create user with RFID" $false $_.Exception.Message
    }
}
Start-Sleep -Milliseconds 300

# Test 8: Check balance
Write-Host "`n[Test 8] Check user balance..."
if ($rfidUser) {
    try {
        $balance = Invoke-RestMethod -Uri "$baseUrl/balance/$($rfidUser.rfid_uid)" -UseBasicParsing
        Log-Test "Balance check" $true "Balance: $($balance.balance)"
    } catch {
        Log-Test "Balance check" $false $_.Exception.Message
    }
}
Start-Sleep -Milliseconds 300

# Test 9: Reload balance (top-up)
Write-Host "`n[Test 9] Reload balance (top-up)..."
if ($staffToken -and $rfidUser) {
    try {
        $body = @{rfid_uid=$rfidUser.rfid_uid; amount=50.00} | ConvertTo-Json
        $headers = @{Authorization="Bearer $staffToken"}
        $reloadResult = Invoke-RestMethod -Uri "$baseUrl/reload" -Method POST -Body $body -ContentType "application/json" -Headers $headers -UseBasicParsing
        Log-Test "Balance reload" $true "New balance: $($reloadResult.new_balance)"
    } catch {
        Log-Test "Balance reload" $false $_.Exception.Message
    }
}
Start-Sleep -Milliseconds 300

# Test 10: Reload with invalid amount
Write-Host "`n[Test 10] Reload with invalid amount..."
if ($staffToken -and $rfidUser) {
    try {
        $body = @{rfid_uid=$rfidUser.rfid_uid; amount=-10} | ConvertTo-Json
        $headers = @{Authorization="Bearer $staffToken"}
        Invoke-RestMethod -Uri "$baseUrl/reload" -Method POST -Body $body -ContentType "application/json" -Headers $headers -UseBasicParsing | Out-Null
        Log-Test "Invalid reload rejection" $false
    } catch {
        Log-Test "Invalid reload rejection" $true
    }
}
Start-Sleep -Milliseconds 300

# ============================================
# SECTION 3: TRANSACTIONS
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "SECTION 3: TRANSACTIONS & PURCHASES" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

# Test 11: Make a transaction
Write-Host "`n[Test 11] Process transaction..."
if ($rfidUser) {
    try {
        $body = @{uid=$rfidUser.rfid_uid; amount=25.50; device_id="esp32-001"} | ConvertTo-Json
        $txResult = Invoke-RestMethod -Uri "$baseUrl/transaction" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
        Log-Test "Transaction processing" $true "New balance: $($txResult.balance)"
    } catch {
        Log-Test "Transaction processing" $false $_.Exception.Message
    }
}
Start-Sleep -Milliseconds 300

# Test 12: Transaction with insufficient balance
Write-Host "`n[Test 12] Transaction with insufficient balance..."
if ($rfidUser) {
    try {
        $body = @{uid=$rfidUser.rfid_uid; amount=999999} | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/transaction" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Out-Null
        Log-Test "Insufficient balance rejection" $false
    } catch {
        Log-Test "Insufficient balance rejection" $true
    }
}
Start-Sleep -Milliseconds 300

# Test 13: Transaction with invalid RFID
Write-Host "`n[Test 13] Transaction with invalid RFID..."
try {
    $body = @{uid="INVALIDRFID"; amount=10} | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/transaction" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Out-Null
    Log-Test "Invalid RFID rejection" $false
} catch {
    Log-Test "Invalid RFID rejection" $true
}
Start-Sleep -Milliseconds 300

# ============================================
# SECTION 4: REPORTS & DATA RETRIEVAL
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "SECTION 4: REPORTS & DATA RETRIEVAL" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

# Test 14: Get transaction report
Write-Host "`n[Test 14] Fetch transaction report..."
if ($staffToken) {
    try {
        $headers = @{Authorization="Bearer $staffToken"}
        $report = Invoke-RestMethod -Uri "$baseUrl/report" -Headers $headers -UseBasicParsing
        Log-Test "Transaction report" $true "Records: $($report.Count)"
    } catch {
        Log-Test "Transaction report" $false $_.Exception.Message
    }
}
Start-Sleep -Milliseconds 300

# Test 15: Get staff list
Write-Host "`n[Test 15] Fetch staff list..."
try {
    $staff = Invoke-RestMethod -Uri "$baseUrl/staff" -UseBasicParsing
    Log-Test "Staff list retrieval" $true "Staff members: $($staff.Count)"
} catch {
    Log-Test "Staff list retrieval" $false $_.Exception.Message
}
Start-Sleep -Milliseconds 300

# Test 16: Get reloads list
Write-Host "`n[Test 16] Fetch reloads history..."
if ($staffToken) {
    try {
        $headers = @{Authorization="Bearer $staffToken"}
        $reloads = Invoke-RestMethod -Uri "$baseUrl/reloads" -Headers $headers -UseBasicParsing
        Log-Test "Reloads history" $true "Reload records: $($reloads.Count)"
    } catch {
        Log-Test "Reloads history" $false $_.Exception.Message
    }
}
Start-Sleep -Milliseconds 300

# ============================================
# SECTION 5: SECURITY & VALIDATION
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "SECTION 5: SECURITY & INPUT VALIDATION" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

# Test 17: Access protected endpoint without token
Write-Host "`n[Test 17] Access protected endpoint without auth..."
try {
    Invoke-RestMethod -Uri "$baseUrl/reloads" -UseBasicParsing | Out-Null
    Log-Test "Auth protection" $false
} catch {
    Log-Test "Auth protection" $true "Correctly blocked unauthorized access"
}
Start-Sleep -Milliseconds 300

# Test 18: Invalid username format
Write-Host "`n[Test 18] Register with invalid username..."
try {
    $body = @{username="ab"; name="Test"; password="StrongPass123!"; role="student"} | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Out-Null
    Log-Test "Username validation" $false
} catch {
    Log-Test "Username validation" $true "Rejected invalid username"
}
Start-Sleep -Milliseconds 300

# Test 19: Special characters in username
Write-Host "`n[Test 19] Username with special characters..."
try {
    $body = @{username="test@user"; name="Test"; password="StrongPass123!"; role="student"} | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Out-Null
    Log-Test "Special char validation" $false
} catch {
    Log-Test "Special char validation" $true
}
Start-Sleep -Milliseconds 300

# Test 20: Missing required fields
Write-Host "`n[Test 20] Registration with missing fields..."
try {
    $body = @{username="testuser"} | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Out-Null
    Log-Test "Required fields validation" $false
} catch {
    Log-Test "Required fields validation" $true
}
Start-Sleep -Milliseconds 300

# ============================================
# SECTION 6: DATABASE & SYSTEM HEALTH
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "SECTION 6: DATABASE & SYSTEM HEALTH" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

# Test 21: Database health check
Write-Host "`n[Test 21] Database connectivity check..."
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -UseBasicParsing
    $dbOk = $health.db -eq $true
    Log-Test "Database health" $dbOk "Status: $($health.db)"
} catch {
    Log-Test "Database health" $false $_.Exception.Message
}
Start-Sleep -Milliseconds 300

# Test 22: Menu retrieval
Write-Host "`n[Test 22] Fetch menu items..."
if ($studentUser) {
    try {
        $body = @{username=$studentUser.username; password="Student123!"} | ConvertTo-Json
        $login = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
        $headers = @{Authorization="Bearer $($login.token)"}
        $menu = Invoke-RestMethod -Uri "$baseUrl/menu" -Headers $headers -UseBasicParsing
        Log-Test "Menu retrieval" $true "Menu items: $($menu.Count)"
    } catch {
        Log-Test "Menu retrieval" $false $_.Exception.Message
    }
}
Start-Sleep -Milliseconds 300

# ============================================
# FINAL SUMMARY
# ============================================
Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "  TEST EXECUTION COMPLETE" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Test Statistics:" -ForegroundColor Yellow
Write-Host "  Total Tests:  $testCount" -ForegroundColor White
Write-Host "  Passed:       $passCount" -ForegroundColor Green
Write-Host "  Failed:       $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })

$successRate = [math]::Round(($passCount / $testCount) * 100, 2)
Write-Host "  Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 75) { "Yellow" } else { "Red" })
Write-Host ""

# Show generated logs
$today = Get-Date -Format "yyyy-MM-dd"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "LOG FILES GENERATED" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

Get-ChildItem "logs\*$today*.log" -ErrorAction SilentlyContinue | ForEach-Object {
    $lines = (Get-Content $_.FullName).Count
    $size = "{0:N2} KB" -f ($_.Length / 1KB)
    Write-Host "  $($_.Name)" -ForegroundColor Cyan
    Write-Host "    Lines: $lines | Size: $size" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor Yellow
Write-Host "  1. View logs:     .\view-logs.ps1" -ForegroundColor White
Write-Host "  2. Open log file: notepad logs\combined-$today.log" -ForegroundColor White
Write-Host "  3. Review results: Check THESIS-LOG-DEMONSTRATION.md" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

