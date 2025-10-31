# Generate Comprehensive Logs for Thesis Demonstration
# ======================================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  GENERATING LOGS FOR THESIS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Check server
Write-Host "Checking server..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -UseBasicParsing
    Write-Host "Server is running!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Server is NOT running!" -ForegroundColor Red
    Write-Host "Start with: node server.js" -ForegroundColor Yellow
    exit
}

Write-Host "Running tests to generate logs..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Weak password
Write-Host "Test 1: Weak password (should fail)..." -ForegroundColor Yellow
try {
    $body = @{username="weak$(Get-Random)"; name="Weak User"; password="weakpass"; role="student"} | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Out-Null
    Write-Host "  Unexpected: Password accepted" -ForegroundColor Red
} catch {
    Write-Host "  OK: Rejected weak password" -ForegroundColor Green
}

Start-Sleep -Milliseconds 500

# Test 2: No special character
Write-Host "Test 2: Password without special char (should fail)..." -ForegroundColor Yellow
try {
    $body = @{username="nospec$(Get-Random)"; name="No Special"; password="Password123"; role="student"} | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Out-Null
    Write-Host "  Unexpected: Password accepted" -ForegroundColor Red
} catch {
    Write-Host "  OK: Rejected password without special char" -ForegroundColor Green
}

Start-Sleep -Milliseconds 500

# Test 3: Strong password
Write-Host "Test 3: Strong password (should succeed)..." -ForegroundColor Yellow
try {
    $body = @{username="strong$(Get-Random)"; name="Strong User"; password="StrongPass123!"; role="student"} | ConvertTo-Json
    $result = Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "  OK: User created with ID $($result.user_id)" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Strong password rejected" -ForegroundColor Red
}

Start-Sleep -Milliseconds 500

# Test 4: Another strong password
Write-Host "Test 4: Another strong password (should succeed)..." -ForegroundColor Yellow
try {
    $body = @{username="secure$(Get-Random)"; name="Secure User"; password="MyP@ssw0rd"; role="student"} | ConvertTo-Json
    $result = Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "  OK: User created with ID $($result.user_id)" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Strong password rejected" -ForegroundColor Red
}

Start-Sleep -Milliseconds 500

# Test 5: Health check
Write-Host "Test 5: Database health check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -UseBasicParsing
    Write-Host "  OK: Database is $($health.db)" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Health check failed" -ForegroundColor Red
}

Start-Sleep -Milliseconds 500

# Test 6: Get staff list
Write-Host "Test 6: Get staff list..." -ForegroundColor Yellow
try {
    $staff = Invoke-RestMethod -Uri "$baseUrl/staff" -UseBasicParsing
    Write-Host "  OK: Found $($staff.Count) staff members" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Staff list failed" -ForegroundColor Red
}

Start-Sleep -Milliseconds 500

# Test 7: Invalid username
Write-Host "Test 7: Invalid username (should fail)..." -ForegroundColor Yellow
try {
    $body = @{username="ab"; name="Test"; password="StrongPass123!"; role="student"} | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Out-Null
    Write-Host "  Unexpected: Invalid username accepted" -ForegroundColor Red
} catch {
    Write-Host "  OK: Rejected invalid username" -ForegroundColor Green
}

Start-Sleep -Milliseconds 500

# Test 8: Wrong login
Write-Host "Test 8: Wrong password login (should fail)..." -ForegroundColor Yellow
try {
    $body = @{username="nonexistent"; password="WrongPass123!"} | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Out-Null
    Write-Host "  Unexpected: Login succeeded" -ForegroundColor Red
} catch {
    Write-Host "  OK: Rejected wrong credentials" -ForegroundColor Green
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  TESTS COMPLETE!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$today = Get-Date -Format "yyyy-MM-dd"
Write-Host "Log files generated:" -ForegroundColor Cyan
Get-ChildItem "logs\*$today*.log" | ForEach-Object {
    $lines = (Get-Content $_.FullName).Count
    $size = "{0:N2} KB" -f ($_.Length / 1KB)
    Write-Host "  $($_.Name) - $lines lines, $size" -ForegroundColor White
}

Write-Host ""
Write-Host "View logs:" -ForegroundColor Yellow
Write-Host "  .\view-logs.ps1" -ForegroundColor White
Write-Host ""

