# Setup Admin Account Script
# This creates the first admin account for the canteen system

Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Smart Canteen - Admin Account Setup              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if server is running
Write-Host "Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Server is running!" -ForegroundColor Green
} catch {
    Write-Host "✗ Server is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the server first:" -ForegroundColor Yellow
    Write-Host "  1. Run: .\start-server.ps1" -ForegroundColor White
    Write-Host "  OR" -ForegroundColor Yellow
    Write-Host "  2. Run: node server.js" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Create Admin Account" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Get admin details
$username = Read-Host "Enter admin username (default: admin)"
if ([string]::IsNullOrWhiteSpace($username)) { $username = "admin" }

$name = Read-Host "Enter admin full name (default: System Administrator)"
if ([string]::IsNullOrWhiteSpace($name)) { $name = "System Administrator" }

$password = Read-Host "Enter admin password (default: admin123)" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
if ([string]::IsNullOrWhiteSpace($passwordPlain)) { $passwordPlain = "admin123" }

Write-Host ""
Write-Host "Creating admin account..." -ForegroundColor Yellow

# Create admin account
try {
    $body = @{
        username = $username
        password = $passwordPlain
        name = $name
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3000/setup-admin" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║            ✓ ADMIN ACCOUNT CREATED!                   ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "Admin Credentials:" -ForegroundColor Cyan
    Write-Host "  Username: $username" -ForegroundColor White
    Write-Host "  Password: $passwordPlain" -ForegroundColor White
    Write-Host ""
    Write-Host "IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "  1. Login at http://localhost:3000" -ForegroundColor White
    Write-Host "  2. You will see the Admin Dashboard" -ForegroundColor White
    Write-Host "  3. Change your password in Settings" -ForegroundColor White
    Write-Host "  4. DELETE the /setup-admin endpoint from server.js (line 1133-1161)" -ForegroundColor Red
    Write-Host "     This is a security risk if left in production!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opening browser..." -ForegroundColor Yellow
    Start-Process "http://localhost:3000"
    
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -like "*Admin already exists*") {
        Write-Host ""
        Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Yellow
        Write-Host "║     Admin account already exists!                     ║" -ForegroundColor Yellow
        Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "The setup endpoint is now disabled for security." -ForegroundColor White
        Write-Host ""
        Write-Host "If you need to create another admin:" -ForegroundColor Cyan
        Write-Host "  1. Login as existing admin" -ForegroundColor White
        Write-Host "  2. Go to Admin Dashboard" -ForegroundColor White
        Write-Host "  3. Click 'New User' and select role 'Admin'" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "✗ Error creating admin account:" -ForegroundColor Red
        Write-Host $errorMessage -ForegroundColor Red
        Write-Host ""
        Write-Host "Alternative method - Update existing user to admin:" -ForegroundColor Yellow
        Write-Host "  1. Login with any existing account" -ForegroundColor White
        Write-Host "  2. Run this SQL in your database:" -ForegroundColor White
        Write-Host "     UPDATE users SET role = 'admin' WHERE username = 'your_username';" -ForegroundColor Cyan
        Write-Host ""
    }
}

Write-Host ""
Read-Host "Press Enter to exit"

