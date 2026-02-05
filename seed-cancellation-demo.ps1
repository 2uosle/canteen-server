# Seed a demo pending sale and cancellation for Smart Canteen
# Usage: powershell -ExecutionPolicy Bypass -File .\seed-cancellation-demo.ps1 -VendorId 3 -ItemName "Demo Item" -Amount 12.50 -Reason "Demo cancellation"
param(
  [int]$VendorId = 3,
  [string]$ItemName = "Demo Item",
  [double]$Amount = 12.50,
  [string]$Reason = "Demo cancellation"
)

Write-Host "[Seed] Starting cancellation demo seeding..." -ForegroundColor Cyan

# Ensure Node & mysql2 present
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is not installed or not in PATH."; exit 1
}

# Use .env if present to load DB creds
$envFile = Join-Path $PSScriptRoot ".env"
$defaultDbHost = "localhost"
$defaultDbUser = "root"
$defaultDbPass = ""
$defaultDbName = "canteen_db"

if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^(\w+)=(.*)$') {
      $name = $Matches[1]
      $value = $Matches[2]
      if (-not (Get-ChildItem Env: | Where-Object { $_.Name -eq $name })) {
        [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
      }
    }
  }
}

$DB_HOST = $env:DB_HOST; if (-not $DB_HOST) { $DB_HOST = $defaultDbHost }
$DB_USER = $env:DB_USER; if (-not $DB_USER) { $DB_USER = $defaultDbUser }
$DB_PASS = $env:DB_PASS; if (-not $DB_PASS) { $DB_PASS = $defaultDbPass }
$DB_NAME = $env:DB_NAME; if (-not $DB_NAME) { $DB_NAME = $defaultDbName }

Write-Host "[Seed] Using DB: $DB_USER@$DB_HOST/$DB_NAME" -ForegroundColor Yellow

# Inline JS script invocation (no separate file needed)
$js = @"
const mysql = require('mysql2/promise');
(async () => {
  const { DB_HOST, DB_USER, DB_PASS, DB_NAME, VENDOR_ID, ITEM_NAME, AMOUNT, REASON } = process.env;
  const pool = await mysql.createPool({ host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME });
  try {
    // Ensure vendor exists
    const [vendorRows] = await pool.query('SELECT user_id, role FROM users WHERE user_id = ?',[VENDOR_ID]);
    if (!vendorRows.length) {
      console.log(`[Seed] Vendor id ${VENDOR_ID} not found; creating placeholder vendor.`);
      await pool.query("INSERT INTO users (name, username, role, balance) VALUES ('Demo Vendor', CONCAT('vendor', ?), 'vendor', 0.00)",[VENDOR_ID]);
    } else if (!['vendor','canteen_manager','staff'].includes(vendorRows[0].role)) {
      console.log(`[Seed] User ${VENDOR_ID} exists but role is ${vendorRows[0].role}; updating to vendor.`);
      await pool.query('UPDATE users SET role = \"vendor\" WHERE user_id = ?',[VENDOR_ID]);
    }
    // Insert pending sale
    const [pendingResult] = await pool.query('INSERT INTO pending_sales (item_name, amount, vendor_id, confirmed, created_at) VALUES (?,?,?,?,NOW())',[ITEM_NAME, AMOUNT, VENDOR_ID, 0]);
    const pendingId = pendingResult.insertId;
    console.log(`[Seed] Pending sale created id=${pendingId}`);
    // Log cancellation (primary table)
    let usedPrimary = true;
    try {
      await pool.query(`INSERT INTO cancelled_transactions (pending_id, item_name, amount, vendor_id, vendor_name, reason, cancelled_at) VALUES (?,?,?,?,?,?,NOW())`,[pendingId, ITEM_NAME, AMOUNT, VENDOR_ID, 'Demo Vendor', REASON]);
      console.log(`[Seed] Cancellation logged in cancelled_transactions.`);
    } catch (e) {
      usedPrimary = false;
      console.log(`[Seed] Primary table missing (${e.message}); will rely on fallback only.`);
    }
    // Mark pending as cancelled
    await pool.query('UPDATE pending_sales SET confirmed = 2 WHERE id = ?',[pendingId]);
    console.log(`[Seed] Pending sale marked confirmed=2.`);
    // Show result rows
    const [ctRows] = usedPrimary ? await pool.query('SELECT * FROM cancelled_transactions WHERE pending_id = ?',[pendingId]) : [[]];
    const [psRow] = await pool.query('SELECT * FROM pending_sales WHERE id = ?',[pendingId]);
    console.log('[Seed] Cancelled Transaction Row:', ctRows[0] || '(none; fallback)');
    console.log('[Seed] Pending Sale Row:', psRow[0]);
    console.log(JSON.stringify({ pending_id: pendingId, source: usedPrimary? 'primary':'fallback' }));
  } catch (err) {
    console.error('[Seed] Error:', err.message);
    process.exit(1);
  } finally {
    pool.end();
  }
})();
"@

$env:VENDOR_ID = $VendorId
$env:ITEM_NAME = $ItemName
$env:AMOUNT = $Amount
$env:REASON = $Reason

node -e $js

if ($LASTEXITCODE -eq 0) {
  Write-Host "[Seed] Demo cancellation complete. Refresh admin dashboard." -ForegroundColor Green
} else {
  Write-Error "[Seed] Demo cancellation failed."; exit 1
}
