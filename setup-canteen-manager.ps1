# PowerShell script to create canteen manager account
# This uses Node.js to hash the password and insert into database

Write-Host "Creating canteen manager test account..." -ForegroundColor Cyan

# First, run the migration
Write-Host "`nStep 1: Running database migration..." -ForegroundColor Yellow
$migrationFile = Join-Path $PSScriptRoot "migrations\add-canteen-manager-role.sql"

# Create a temporary Node.js script to execute SQL
$tempScript = @"
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
require('dotenv').config();

async function setup() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    // Run migration
    console.log('Running migration...');
    const migration = fs.readFileSync('$($migrationFile.Replace('\', '\\'))', 'utf8');
    await connection.query(migration);
    console.log('✓ Migration completed');

    // Hash password
    const password = 'manager123';
    const hash = await bcrypt.hash(password, 10);

    // Insert test account
    console.log('\nCreating test account...');
    await connection.query(
      'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
      ['Menu Manager', 'menu_manager', hash, 'canteen_manager']
    );
    console.log('✓ Test account created');
    console.log('\nLogin credentials:');
    console.log('  Username: menu_manager');
    console.log('  Password: manager123');

    // Verify
    console.log('\nVerifying setup...');
    const [users] = await connection.query('SELECT user_id, name, username, role FROM users WHERE role = ?', ['canteen_manager']);
    console.log('✓ Canteen managers:', users);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

setup();
"@

$tempScript | Out-File -FilePath "temp-setup.js" -Encoding UTF8

# Run the script
node temp-setup.js

# Clean up
Remove-Item "temp-setup.js" -ErrorAction SilentlyContinue

Write-Host "`nSetup complete!" -ForegroundColor Green
