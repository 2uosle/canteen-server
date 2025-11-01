# Test RFID Link - Create a pending link for testing
# This creates a pending RFID link request for student1 (user_id=3)

Write-Host "`n=== Creating Test RFID Link ===" -ForegroundColor Cyan

# Load environment
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
            Set-Item -Path "env:$($matches[1])" -Value $matches[2]
        }
    }
}

$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "root" }
$DB_PASS = if ($env:DB_PASS) { $env:DB_PASS } else { "" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "canteen_db" }

$pass = if ($DB_PASS -ne "") { "-p$DB_PASS" } else { "" }

# Create a fresh pending link for student1
$sql = @"
INSERT INTO pending_rfid_links (user_id, confirmed, created_at)
VALUES (3, 0, NOW());

SELECT LAST_INSERT_ID() AS pending_id;

SELECT id, user_id, confirmed, created_at 
FROM pending_rfid_links 
WHERE confirmed = 0 
ORDER BY created_at DESC 
LIMIT 1;
"@

Write-Host "Creating pending RFID link for student1..." -ForegroundColor Yellow
$sql | mysql -h $DB_HOST -u $DB_USER $pass $DB_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Pending link created!" -ForegroundColor Green
    Write-Host "Arduino should pick this up within 1-2 seconds." -ForegroundColor Cyan
    Write-Host "Watch the Arduino Serial Monitor for:" -ForegroundColor Yellow
    Write-Host "  ➡ Pending RFID link: id=X. Waiting for tap…" -ForegroundColor White
} else {
    Write-Host "`n[ERROR] Failed to create pending link!" -ForegroundColor Red
}
