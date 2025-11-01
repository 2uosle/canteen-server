param(
  [string]$DbHost = "127.0.0.1",
  [int]$DbPort = 3306,
  [string]$DbUser = "root",
  [string]$DbName = "canteen_db",
  [switch]$SkipVerify
)

# Prompt for password securely
if (-not $env:MYSQL_PWD) {
  $SecurePwd = Read-Host -AsSecureString -Prompt "MySQL password for user '$DbUser'"
  $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePwd)
  $PlainPwd = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
  # Set env var for mysql non-interactive usage
  $env:MYSQL_PWD = $PlainPwd
}

$mysqlExe = "mysql"

# Resolve script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$migrationFile = Join-Path $ScriptDir "migrations/cart-sales-system.sql"
$verifyFile = Join-Path $ScriptDir "migrations/verify-cart-migration.sql"

if (-not (Test-Path $migrationFile)) {
  Write-Error "Migration file not found: $migrationFile"
  exit 1
}
if (-not $SkipVerify -and -not (Test-Path $verifyFile)) {
  Write-Warning "Verification file not found: $verifyFile (continuing)"
}

# Build common args
$commonArgs = @("-h", $DbHost, "-P", $DbPort, "-u", $DbUser, "-D", $DbName, "--protocol=tcp", "--comments")

# Test connectivity quickly
Write-Host ("Testing MySQL connectivity to " + $DbUser + "@" + $DbHost + ":" + $DbPort + "/" + $DbName + " ...")
$testCmd = @($commonArgs + "-e", "SELECT 1;")
$test = & $mysqlExe @testCmd 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to connect to MySQL. Ensure mysql.exe is installed and credentials are correct. Output:`n$test"
  exit 1
}
Write-Host "Connection OK." -ForegroundColor Green

# Run migration
Write-Host "Applying cart migration: $migrationFile" -ForegroundColor Cyan
# Execute using mysql built-in SOURCE command (quote path, use forward slashes)
$srcMigration = ($migrationFile -replace '\\','/')
$apply = & $mysqlExe @commonArgs "--execute=SOURCE `"$srcMigration`"" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error "Migration failed. Output:`n$apply"
  exit 1
}
Write-Host "Migration applied successfully." -ForegroundColor Green

# Verify
if (-not $SkipVerify -and (Test-Path $verifyFile)) {
  Write-Host "Running verification: $verifyFile" -ForegroundColor Cyan
  $srcVerify = ($verifyFile -replace '\\','/')
  $verify = & $mysqlExe @commonArgs "--execute=SOURCE `"$srcVerify`"" 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Verification script encountered errors. Output:`n$verify"
  } else {
    Write-Host "Verification completed. Review any result rows above." -ForegroundColor Green
  }
}

Write-Host "Done. If the server is running, restart it so triggers/procedures are recognized." -ForegroundColor Yellow

# Cleanup password env var for safety
if ($PlainPwd) {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}
