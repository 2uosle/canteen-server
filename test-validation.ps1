# Input Validation Testing Script
# Tests various validation scenarios

Write-Host "🧪 Input Validation Testing" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$testsPassed = 0
$testsFailed = 0

function Test-Endpoint {
    param(
        [string]$name,
        [string]$method,
        [string]$endpoint,
        [hashtable]$body,
        [bool]$shouldFail
    )
    
    Write-Host "Testing: $name" -ForegroundColor Yellow
    
    try {
        $jsonBody = $body | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl$endpoint" -Method $method -Body $jsonBody -ContentType "application/json" -ErrorAction Stop
        
        if ($shouldFail) {
            Write-Host "  ❌ FAIL: Expected validation error but request succeeded" -ForegroundColor Red
            $script:testsFailed++
        } else {
            Write-Host "  ✅ PASS: Request succeeded as expected" -ForegroundColor Green
            $script:testsPassed++
        }
    } catch {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        
        if ($shouldFail) {
            if ($errorDetails.error -eq "Validation failed") {
                Write-Host "  ✅ PASS: Validation error as expected" -ForegroundColor Green
                Write-Host "     Details: $($errorDetails.details[0].message)" -ForegroundColor Gray
                $script:testsPassed++
            } else {
                Write-Host "  ⚠️  WARN: Failed but not with validation error" -ForegroundColor Yellow
                Write-Host "     Error: $($errorDetails.error)" -ForegroundColor Gray
                $script:testsFailed++
            }
        } else {
            Write-Host "  ❌ FAIL: Request failed unexpectedly" -ForegroundColor Red
            Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Gray
            $script:testsFailed++
        }
    }
    
    Start-Sleep -Milliseconds 200
}

Write-Host "⚠️  Make sure server is running: node server.js" -ForegroundColor Yellow
Write-Host ""
$ready = Read-Host "Is server running? (yes/no)"

if ($ready -ne "yes") {
    Write-Host "❌ Start the server first" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# AUTHENTICATION VALIDATION TESTS
# ============================================================================

Write-Host "📝 AUTHENTICATION VALIDATION" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Username too short
Test-Endpoint `
    -name "Register with username too short" `
    -method "POST" `
    -endpoint "/register" `
    -body @{
        username = "ab"
        password = "password123"
        name = "Test User"
    } `
    -shouldFail $true

# Test 2: Password too short
Test-Endpoint `
    -name "Register with password too short" `
    -method "POST" `
    -endpoint "/register" `
    -body @{
        username = "testuser"
        password = "pass"
        name = "Test User"
    } `
    -shouldFail $true

# Test 3: Invalid role
Test-Endpoint `
    -name "Register with invalid role" `
    -method "POST" `
    -endpoint "/register" `
    -body @{
        username = "testuser"
        password = "password123"
        name = "Test User"
        role = "admin"
    } `
    -shouldFail $true

# Test 4: Login without password
Test-Endpoint `
    -name "Login without password" `
    -method "POST" `
    -endpoint "/login" `
    -body @{
        username = "testuser"
    } `
    -shouldFail $true

Write-Host ""

# ============================================================================
# TRANSACTION VALIDATION TESTS
# ============================================================================

Write-Host "💰 TRANSACTION VALIDATION" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Test 5: Negative amount
Test-Endpoint `
    -name "Reload with negative amount" `
    -method "POST" `
    -endpoint "/transaction" `
    -body @{
        uid = "B3D19638"
        amount = -50
    } `
    -shouldFail $true

# Test 6: Amount too large
Test-Endpoint `
    -name "Transaction with amount > 10,000" `
    -method "POST" `
    -endpoint "/transaction" `
    -body @{
        uid = "B3D19638"
        amount = 15000
    } `
    -shouldFail $true

# Test 7: Invalid RFID format (non-hex characters)
Test-Endpoint `
    -name "Transaction with invalid RFID (non-hex)" `
    -method "POST" `
    -endpoint "/transaction" `
    -body @{
        uid = "xyz123"
        amount = 50
    } `
    -shouldFail $true

# Test 8: Missing uid
Test-Endpoint `
    -name "Transaction without UID" `
    -method "POST" `
    -endpoint "/transaction" `
    -body @{
        amount = 50
    } `
    -shouldFail $true

Write-Host ""

# ============================================================================
# RFID VALIDATION TESTS
# ============================================================================

Write-Host "🔗 RFID VALIDATION" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

# Test 9: Invalid user_id (not a number)
Test-Endpoint `
    -name "RFID link with invalid user_id" `
    -method "POST" `
    -endpoint "/rfid/link/start" `
    -body @{
        user_id = "abc"
    } `
    -shouldFail $true

# Test 10: Negative user_id
Test-Endpoint `
    -name "RFID link with negative user_id" `
    -method "POST" `
    -endpoint "/rfid/link/start" `
    -body @{
        user_id = -5
    } `
    -shouldFail $true

Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Green" })
Write-Host "Total Tests:  $($testsPassed + $testsFailed)" -ForegroundColor White
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✅ All validation tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🛡️  Your endpoints are protected by:" -ForegroundColor Cyan
    Write-Host "  • Type validation (strings, numbers, booleans)" -ForegroundColor White
    Write-Host "  • Format validation (RFID UIDs, usernames)" -ForegroundColor White
    Write-Host "  • Range validation (min/max values)" -ForegroundColor White
    Write-Host "  • Required field validation" -ForegroundColor White
    Write-Host "  • Business rule validation" -ForegroundColor White
} else {
    Write-Host "⚠️  Some tests failed - review validation implementation" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📚 Read VALIDATION.md for complete documentation" -ForegroundColor Cyan

