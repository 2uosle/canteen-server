// Setup script for Canteen Manager role
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
    console.log('Setting up Canteen Manager role...\n');

    // Run migration
    console.log('Step 1: Running migration...');
    await connection.query(`
      ALTER TABLE users 
      MODIFY role ENUM('student','staff','vendor','admin','canteen_manager') 
      COLLATE utf8mb4_unicode_ci DEFAULT 'student'
    `);
    console.log('✓ Migration completed - canteen_manager role added\n');

    // Check if test account already exists
    const [existing] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      ['menu_manager']
    );

    if (existing.length > 0) {
      console.log('⚠ Test account "menu_manager" already exists. Skipping creation.\n');
    } else {
      // Hash password
      console.log('Step 2: Creating test account...');
      const password = 'manager123';
      const hash = await bcrypt.hash(password, 10);

      // Insert test account
      await connection.query(
        'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
        ['Menu Manager', 'menu_manager', hash, 'canteen_manager']
      );
      console.log('✓ Test account created\n');
    }

    // Display login credentials
    console.log('─'.repeat(50));
    console.log('LOGIN CREDENTIALS:');
    console.log('  Username: menu_manager');
    console.log('  Password: manager123');
    console.log('─'.repeat(50));

    // Verify setup
    console.log('\nStep 3: Verifying setup...');
    const [users] = await connection.query(
      'SELECT user_id, name, username, role FROM users WHERE role = ?',
      ['canteen_manager']
    );
    console.log('✓ Canteen manager accounts:', users);

    // Show role enum
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM users WHERE Field = 'role'"
    );
    console.log('\n✓ User roles available:', columns[0].Type);

    console.log('\n✅ Setup complete! You can now login as canteen manager.');

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('❌ Account already exists');
    } else if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠ Migration already applied (role already exists)');
      
      // Still try to create the test account
      try {
        const password = 'manager123';
        const hash = await bcrypt.hash(password, 10);
        await connection.query(
          'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
          ['Menu Manager', 'menu_manager', hash, 'canteen_manager']
        );
        console.log('✓ Test account created');
        console.log('\nLOGIN: menu_manager / manager123');
      } catch (insertError) {
        if (insertError.code === 'ER_DUP_ENTRY') {
          console.log('✓ Test account already exists');
          console.log('\nLOGIN: menu_manager / manager123');
        } else {
          console.error('Error creating account:', insertError.message);
        }
      }
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  } finally {
    await connection.end();
  }
}

setup();
