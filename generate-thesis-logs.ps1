# Generate Comprehensive Logs for Thesis Demonstration
# ======================================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  GENERATING LOGS FOR THESIS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$testResults = @()

# Function to make API call and log result
function Test-Endpoint {
    param(
        [string]$Description,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [bool]$ExpectSuccess = $true
    )
    
    Write-Host "$Description..." -ForegroundColor Cyan
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            ErrorAction = 'Stop'
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = 'application/json'
        }
        
        $response = Invoke-RestMethod @params
        
        if ($ExpectSuccess) {
            Write-Host "  âœ… Success" -ForegroundColor Green
            $script:testResults += @{Test = $Description; Result = "PASS"; Response = $response}
        } else {
            Write-Host "  âš ï¸ Unexpected success (should have failed)" -ForegroundColor Yellow
            $script:testResults += @{Test = $Description; Result = "UNEXPECTED"; Response = $response}
        }
        
        return $response
    }
    catch {
        if (-not $ExpectSuccess) {
            Write-Host "  âœ… Failed as expected" -ForegroundColor Green
            $script:testResults += @{Test = $Description; Result = "PASS (Expected Failure)"; Error = $_.Exception.Message}
        } else {
            Write-Host "  âŒ Error: $($_.Exception.Message)" -ForegroundColor Red
            $script:testResults += @{Test = $Description; Result = "FAIL"; Error = $_.Exception.Message}
        }
        
        return $null
    }
}

Write-Host "Checking server status..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -UseBasicParsing
    Write-Host "âœ… Server is running" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "âŒ Server is not running!" -ForegroundColor Red
    Write-Host "Please start the server with: node server.js" -ForegroundColor Yellow
    exit
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "TEST SUITE 1: PASSWORD VALIDATION" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

# Test 1: Weak password (no uppercase, no special char)
Test-Endpoint `
    -Description "Test 1.1: Register with weak password (no uppercase, no special)" `
    -Url "$baseUrl/register" `
    -Method POST `
    -Body @{username="test_weak_$(Get-Random)"; name="Test Weak"; password="weakpassword123"; role="student"} `
    -ExpectSuccess $false

Start-Sleep -Milliseconds 500

# Test 2: Password without uppercase
Test-Endpoint `
    -Description "Test 1.2: Register with password (no uppercase)" `
    -Url "$baseUrl/register" `
    -Method POST `
    -Body @{username="test_nouppr_$(Get-Random)"; name="Test No Upper"; password="password123!"; role="student"} `
    -ExpectSuccess $false

Start-Sleep -Milliseconds 500

# Test 3: Password without special character
Test-Endpoint `
    -Description "Test 1.3: Register with password (no special character)" `
    -Url "$baseUrl/register" `
    -Method POST `
    -Body @{username="test_nospec_$(Get-Random)"; name="Test No Special"; password="Password123"; role="student"} `
    -ExpectSuccess $false

Start-Sleep -Milliseconds 500

# Test 4: Password too short
Test-Endpoint `
    -Description "Test 1.4: Register with password (too short)" `
    -Url "$baseUrl/register" `
    -Method POST `
    -Body @{username="test_short_$(Get-Random)"; name="Test Short"; password="Pass1!"; role="student"} `
    -ExpectSuccess $false

Start-Sleep -Milliseconds 500

# Test 5: Strong password (should succeed)
$strongUser1 = Test-Endpoint `
    -Description "Test 1.5: Register with STRONG password" `
    -Url "$baseUrl/register" `
    -Method POST `
    -Body @{username="stronguser_$(Get-Random)"; name="Strong User"; password="StrongPass123!"; role="student"} `
    -ExpectSuccess $true

Start-Sleep -Milliseconds 500

# Test 6: Another strong password variant
$strongUser2 = Test-Endpoint `
    -Description "Test 1.6: Register with another strong password" `
    -Url "$baseUrl/register" `
    -Method POST `
    -Body @{username="secure_$(Get-Random)"; name="Secure User"; password="MyP@ssw0rd"; role="student"} `
    -ExpectSuccess $true

Start-Sleep -Milliseconds 500

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "TEST SUITE 2: USER AUTHENTICATION" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

# Test 7: Login with wrong password
Test-Endpoint `
    -Description "Test 2.1: Login with wrong password" `
    -Url "$baseUrl/login" `
    -Method POST `
    -Body @{username="stronguser_123"; password="WrongPassword123!"} `
    -ExpectSuccess $false

Start-Sleep -Milliseconds 500

# Test 8: Login with correct credentials (if we created a user)
if ($strongUser1) {
    $loginResult = Test-Endpoint `
        -Description "Test 2.2: Login with correct credentials" `
        -Url "$baseUrl/login" `
        -Method POST `
        -Body @{username=$strongUser1.username; password="StrongPass123!"} `
        -ExpectSuccess $true
}

Start-Sleep -Milliseconds 500

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "TEST SUITE 3: DATABASE OPERATIONS" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

# Test 9: Health check (triggers DB check)
Test-Endpoint `
    -Description "Test 3.1: Database health check" `
    -Url "$baseUrl/health" `
    -Method GET `
    -ExpectSuccess $true

Start-Sleep -Milliseconds 500

# Test 10: Query staff list (should work)
Test-Endpoint `
    -Description "Test 3.2: Get staff list" `
    -Url "$baseUrl/staff" `
    -Method GET `
    -ExpectSuccess $true

Start-Sleep -Milliseconds 500

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "TEST SUITE 4: VALIDATION TESTS" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

# Test 11: Invalid username (too short)
Test-Endpoint `
    -Description "Test 4.1: Register with invalid username (too short)" `
    -Url "$baseUrl/register" `
    -Method POST `
    -Body @{username="ab"; name="Test User"; password="StrongPass123!"; role="student"} `
    -ExpectSuccess $false

Start-Sleep -Milliseconds 500

# Test 12: Invalid username (special characters)
Test-Endpoint `
    -Description "Test 4.2: Register with invalid username (special chars)" `
    -Url "$baseUrl/register" `
    -Method POST `
    -Body @{username="test@user"; name="Test User"; password="StrongPass123!"; role="student"} `
    -ExpectSuccess $false

Start-Sleep -Milliseconds 500

# Test 13: Missing required fields
Test-Endpoint `
    -Description "Test 4.3: Register with missing fields" `
    -Url "$baseUrl/register" `
    -Method POST `
    -Body @{username="testuser"} `
    -ExpectSuccess $false

Start-Sleep -Milliseconds 500

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Result -like "PASS*" }).Count
$failedTests = ($testResults | Where-Object { $_.Result -eq "FAIL" }).Count

Write-Host "Total Tests Run: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "LOG FILES GENERATED" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

$today = Get-Date -Format "yyyy-MM-dd"
$logFiles = Get-ChildItem "logs\*$today*.log" -ErrorAction SilentlyContinue

if ($logFiles) {
    foreach ($log in $logFiles) {
        $size = "{0:N2} KB" -f ($log.Length / 1KB)
        $lines = (Get-Content $log.FullName).Count
        Write-Host "$($log.Name)" -ForegroundColor Cyan
        Write-Host "  Size: $size | Lines: $lines" -ForegroundColor Gray
    }
} else {
    Write-Host "No log files found for today" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  âœ… LOG GENERATION COMPLETE!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ðŸ'¡ Next Steps:" -ForegroundColor Yellow
Write-Host "1. View logs:    .\view-logs.ps1" -ForegroundColor White
Write-Host "2. Open log file: notepad logs\combined-$today.log" -ForegroundColor White
Write-Host "3. Check errors:  notepad logs\error-$today.log" -ForegroundColor White
Write-Host ""

