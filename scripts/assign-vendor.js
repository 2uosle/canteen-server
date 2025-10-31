// Script to assign all existing transactions to the vendor
require('dotenv').config();
const mysql = require('mysql2/promise');

async function assignVendorToTransactions() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'canteen_db',
  });

  try {
    console.log('=== ASSIGNING VENDOR TO TRANSACTIONS ===\n');

    // Get the vendor
    const [vendors] = await pool.query("SELECT user_id, name FROM users WHERE role = 'vendor' LIMIT 1");
    
    if (vendors.length === 0) {
      console.log('❌ No vendor found in database!');
      return;
    }

    const vendor = vendors[0];
    console.log(`✓ Found vendor: ${vendor.name} (ID: ${vendor.user_id})`);

    // Count transactions without vendor_id
    const [before] = await pool.query('SELECT COUNT(*) as count FROM transactions WHERE vendor_id IS NULL');
    console.log(`\n📊 Transactions without vendor_id: ${before[0].count}`);

    if (before[0].count === 0) {
      console.log('\n✅ All transactions already have vendor_id assigned!');
      await pool.end();
      return;
    }

    // Update all transactions to assign vendor_id
    console.log(`\n🔄 Assigning vendor_id = ${vendor.user_id} to all transactions...`);
    const [result] = await pool.query('UPDATE transactions SET vendor_id = ? WHERE vendor_id IS NULL', [vendor.user_id]);
    
    console.log(`\n✅ Updated ${result.affectedRows} transactions!`);

    // Verify
    const [after] = await pool.query('SELECT COUNT(*) as count FROM transactions WHERE vendor_id IS NULL');
    console.log(`📊 Transactions still without vendor_id: ${after[0].count}`);

    // Show sample
    console.log('\n📋 Sample transactions:');
    const [samples] = await pool.query(`
      SELECT t.tx_id, t.amount, t.vendor_id, u.name as vendor_name, DATE(t.timestamp) as date
      FROM transactions t
      LEFT JOIN users u ON t.vendor_id = u.user_id
      ORDER BY t.timestamp DESC
      LIMIT 5
    `);
    console.table(samples);

    console.log('\n🎉 Done! Now refresh your admin dashboard to see the vendor statistics.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

assignVendorToTransactions();
