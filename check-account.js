// Quick debug script to check canteen_manager account
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAccount() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    console.log('Checking canteen_manager account...\n');

    // Check if role exists in ENUM
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM users WHERE Field = 'role'"
    );
    console.log('Available roles:', columns[0].Type);

    // Check for menu_manager account
    const [users] = await connection.query(
      'SELECT user_id, name, username, role FROM users WHERE username = ?',
      ['menu_manager']
    );

    if (users.length === 0) {
      console.log('\n❌ Account "menu_manager" NOT FOUND!');
      console.log('Run: node setup-canteen-manager.js');
    } else {
      console.log('\n✅ Account found:');
      console.log(users[0]);
      console.log('\nLogin credentials:');
      console.log('  Username: menu_manager');
      console.log('  Password: manager123');
      console.log('\n  URL: http://localhost:3000');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkAccount();
