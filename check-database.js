// Quick script to check database structure and data
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDatabase() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'canteen_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log('=== CHECKING DATABASE ===\n');

  try {
    // Check transactions table structure
    console.log('1. Transactions Table Structure:');
    const [columns] = await pool.query('DESCRIBE transactions');
    console.log(columns.map(c => `${c.Field} (${c.Type})`).join('\n'));
    
    const hasVendorId = columns.some(c => c.Field === 'vendor_id');
    console.log(`\n✓ vendor_id column exists: ${hasVendorId ? 'YES ✅' : 'NO ❌'}`);

    // Check vendors
    console.log('\n2. Vendor Users:');
    const [vendors] = await pool.query("SELECT user_id, name FROM users WHERE role = 'vendor'");
    console.log(`Found ${vendors.length} vendors:`);
    vendors.forEach(v => console.log(`  - ID: ${v.user_id}, Name: ${v.name}`));

    // Check transactions
    console.log('\n3. Transactions:');
    const [txCount] = await pool.query('SELECT COUNT(*) as count FROM transactions');
    console.log(`Total transactions: ${txCount[0].count}`);

    if (hasVendorId) {
      const [withVendor] = await pool.query('SELECT COUNT(*) as count FROM transactions WHERE vendor_id IS NOT NULL');
      console.log(`Transactions with vendor_id: ${withVendor[0].count}`);
      
      if (withVendor[0].count > 0) {
        console.log('\n4. Sample Transactions with vendor_id:');
        const [samples] = await pool.query(`
          SELECT t.tx_id, t.amount, t.vendor_id, u.name as vendor_name, t.timestamp
          FROM transactions t
          LEFT JOIN users u ON t.vendor_id = u.user_id
          WHERE t.vendor_id IS NOT NULL
          LIMIT 5
        `);
        console.table(samples);
      }
    }

    // Check date range
    console.log('\n5. Transaction Date Range:');
    const [dateRange] = await pool.query(`
      SELECT 
        MIN(DATE(timestamp)) as first_tx,
        MAX(DATE(timestamp)) as last_tx,
        COUNT(*) as total
      FROM transactions
    `);
    console.log(`First: ${dateRange[0].first_tx}, Last: ${dateRange[0].last_tx}, Total: ${dateRange[0].total}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
    console.log('\n=== CHECK COMPLETE ===');
  }
}

checkDatabase();
