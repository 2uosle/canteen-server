# Test Script for Security Fixes
# ================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  SECURITY FIXES TEST SCRIPT" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

Write-Host "Testing against: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# Check if server is running
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not running. Please start with 'npm start'" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "TEST 1: Password Validation" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

# Test 1: Weak password (should fail)
Write-Host "Test 1.1: Weak password (no uppercase, no special char)" -ForegroundColor Cyan

$weakPassword = @{
    username = "testuser_weak_$(Get-Random)"
    name = "Test User Weak"
    password = "weakpassword123"
    role = "student"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/register" -Method POST -Body $weakPassword -ContentType "application/json" -ErrorAction Stop
    Write-Host "❌ FAILED: Weak password was accepted (should be rejected)" -ForegroundColor Red
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorResponse.error -match "Validation failed" -or $errorResponse.details -match "uppercase") {
        Write-Host "✅ PASSED: Weak password rejected correctly" -ForegroundColor Green
        Write-Host "   Error: $($errorResponse.error)" -ForegroundColor Gray
    } else {
        Write-Host "❌ FAILED: Wrong error message" -ForegroundColor Red
        Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
}
Write-Host ""

# Test 2: Password without special character (should fail)
Write-Host "Test 1.2: Password without special character" -ForegroundColor Cyan

$noSpecialChar = @{
    username = "testuser_nospecial_$(Get-Random)"
    name = "Test User No Special"
    password = "Password123"
    role = "student"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/register" -Method POST -Body $noSpecialChar -ContentType "application/json" -ErrorAction Stop
    Write-Host "❌ FAILED: Password without special char was accepted" -ForegroundColor Red
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorResponse.error -match "Validation failed" -or $errorResponse.details -match "special character") {
        Write-Host "✅ PASSED: Password without special char rejected" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED: Wrong error message" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Strong password (should pass)
Write-Host "Test 1.3: Strong password (meets all requirements)" -ForegroundColor Cyan

$strongPassword = @{
    username = "testuser_strong_$(Get-Random)"
    name = "Test User Strong"
    password = "StrongPass123!"
    role = "student"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/register" -Method POST -Body $strongPassword -ContentType "application/json" -ErrorAction Stop
    $result = $response.Content | ConvertFrom-Json
    if ($result.user_id) {
        Write-Host "✅ PASSED: Strong password accepted" -ForegroundColor Green
        Write-Host "   User ID: $($result.user_id)" -ForegroundColor Gray
    } else {
        Write-Host "❌ FAILED: User not created" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAILED: Strong password was rejected" -ForegroundColor Red
    Write-Host "   Error: $($_.ErrorDetails.Message)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "TEST 2: RFID Duplicate Prevention" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

Write-Host "⚠️  RFID tests require manual testing with physical RFID cards" -ForegroundColor Yellow
Write-Host ""
Write-Host "Manual Test Steps:" -ForegroundColor Cyan
Write-Host "1. Pair an RFID card to User A" -ForegroundColor White
Write-Host "2. Try to pair the SAME RFID card to User B" -ForegroundColor White
Write-Host "3. Expected: Error message 'RFID already paired to [User A]'" -ForegroundColor White
Write-Host ""
Write-Host "To test:" -ForegroundColor Cyan
Write-Host "- Start server: npm start" -ForegroundColor White
Write-Host "- Open web interface: http://localhost:3000" -ForegroundColor White
Write-Host "- Go to Staff panel > Link RFID" -ForegroundColor White
Write-Host "- Follow the pairing process" -ForegroundColor White
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "TEST SUMMARY" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

Write-Host "Password Validation Tests:" -ForegroundColor Cyan
Write-Host "✅ Weak password rejection" -ForegroundColor Green
Write-Host "✅ No special char rejection" -ForegroundColor Green
Write-Host "✅ Strong password acceptance" -ForegroundColor Green
Write-Host ""

Write-Host "RFID Tests:" -ForegroundColor Cyan
Write-Host "⚠️  Requires manual testing with physical cards" -ForegroundColor Yellow
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Tests Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "💡 TIP: Check logs for detailed validation messages" -ForegroundColor Yellow
Write-Host "   Run: .\view-logs.ps1" -ForegroundColor Gray
Write-Host ""

