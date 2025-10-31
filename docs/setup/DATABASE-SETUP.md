# 🗄️ Database Setup Guide

This guide will help you set up the database for the Smart Canteen System from scratch.

---

## 📋 What's Included

- **`schema.sql`**: Complete database structure (all tables, indexes, foreign keys)
- This file contains NO data - just the structure
- Safe to run multiple times (uses `DROP TABLE IF EXISTS`)

---

## 🚀 Quick Setup (New Installation)

### Method 1: Using MySQL Workbench (Easiest!)

1. **Open MySQL Workbench**
2. **Connect to your MySQL server**
3. **Click** File → Open SQL Script
4. **Select** `schema.sql` from your project folder
5. **Click** the ⚡ Execute button (or press `Ctrl+Shift+Enter`)
6. **Done!** All tables are created

### Method 2: Using Command Line

```bash
# Windows PowerShell
mysql -u root -p < schema.sql

# After entering password, database is ready!
```

### Method 3: Using MySQL Command Prompt

```sql
mysql> source C:/MyProj/canteen-server/schema.sql;
```

---

## 📊 Database Structure

### Tables Created:

| Table | Purpose | Rows (typical) |
|-------|---------|----------------|
| **users** | All system users (students, staff, vendors, admins) | 100-1000 |
| **menu** | Food items and prices | 20-50 |
| **transactions** | Purchase history | 1000+ |
| **reloads** | Balance reload history | 500+ |
| **pending_reloads** | Temp: reload workflow | 0-10 |
| **pending_sales** | Temp: sale workflow | 0-10 |
| **pending_rfid_links** | Temp: card linking | 0-5 |
| **card_hotlist** | Blocked RFID cards | 0-20 |
| **devices** | Registered ESP32 devices | 1-5 |

---

## 👤 Creating Your First Admin User

After running the schema, you need to create an admin account:

### Option 1: Use the Setup Script

```powershell
.\setup-admin.ps1
```

This will create an admin account via the API endpoint.

### Option 2: Direct MySQL Insert

```sql
USE canteen_db;

-- Insert admin user (password = 'admin123')
INSERT INTO users (username, password, name, role) 
VALUES (
  'admin', 
  '$2b$10$Z6mOJUg3M7Qc0rB6vORbneh4XojlsIVA0Xnyw16CXvPHEnI6GlMMC',
  'System Administrator',
  'admin'
);
```

---

## 🎯 Verifying the Setup

Run these queries in MySQL Workbench to verify:

```sql
-- Check all tables were created
SHOW TABLES;

-- Should show 9 tables:
-- card_hotlist, devices, menu, pending_reloads, pending_rfid_links,
-- pending_sales, reloads, transactions, users

-- Check users table structure
DESCRIBE users;

-- Check if admin user exists
SELECT user_id, username, name, role FROM users WHERE role = 'admin';
```

---

## 🔄 Resetting the Database

**⚠️ WARNING: This will DELETE ALL DATA!**

If you need to start fresh:

```sql
-- Method 1: Drop and recreate
DROP DATABASE canteen_db;
source schema.sql;

-- Method 2: Just re-run schema.sql
-- (Uses DROP TABLE IF EXISTS, so it's safe)
source schema.sql;
```

---

## 📝 Adding Sample Data (Optional)

Want to test with sample data? Create some users:

```sql
USE canteen_db;

-- Student account (password: password123)
INSERT INTO users (username, password, name, role, rfid_uid, balance) 
VALUES ('student1', '$2b$10$8Iur1Hiq8.5ibc4d1Z77nuRSHRXsc1Cv4auSHMw9yU2YUJ1sQnRsC', 
        'Juan Dela Cruz', 'student', 'ABC12345', 100.00);

-- Staff account (password: password123)
INSERT INTO users (username, password, name, role) 
VALUES ('staff1', '$2b$10$8Iur1Hiq8.5ibc4d1Z77nuRSHRXsc1Cv4auSHMw9yU2YUJ1sQnRsC', 
        'Maria Santos', 'staff');

-- Vendor account (password: password123)
INSERT INTO users (username, password, name, role) 
VALUES ('vendor1', '$2b$10$8Iur1Hiq8.5ibc4d1Z77nuRSHRXsc1Cv4auSHMw9yU2YUJ1sQnRsC', 
        'Food Vendor', 'vendor');

-- Sample menu items
INSERT INTO menu (item_name, price) VALUES
('Adobo Meal', 120.00),
('Sinigang Meal', 130.00),
('Chicken Inasal', 110.00),
('Rice', 10.00),
('Beverage', 20.00);
```

**All passwords above are:** `password123`

---

## 🔐 Security Notes

1. **Change default admin password** immediately after first login
2. **Remove `/setup-admin` endpoint** from `server.js` after creating admin
3. **Use strong passwords** for production
4. **Backup regularly** using MySQL dump

---

## 💾 Backup Your Database

### Create a backup:

```bash
# Backup structure + data
mysqldump -u root -p canteen_db > backup_$(date +%Y%m%d).sql

# Backup structure only
mysqldump -u root -p --no-data canteen_db > schema_backup.sql
```

### Restore from backup:

```bash
mysql -u root -p canteen_db < backup_20251022.sql
```

---

## 🆘 Troubleshooting

### Error: "Unknown database 'canteen_db'"

**Solution**: The `CREATE DATABASE` line might have failed. Run:
```sql
CREATE DATABASE canteen_db;
USE canteen_db;
source schema.sql;
```

### Error: "Table already exists"

**Solution**: This is normal. The script uses `DROP TABLE IF EXISTS`, so just ignore or:
```sql
DROP DATABASE canteen_db;
CREATE DATABASE canteen_db;
source schema.sql;
```

### Error: "Access denied for user 'root'"

**Solution**: Check your MySQL password:
```bash
mysql -u root -p
# Enter your MySQL root password
```

### Schema looks outdated

**Solution**: Export a fresh schema from your current database:
```bash
mysqldump -u root -p --no-data canteen_db > schema_new.sql
```

---

## 📚 Next Steps

After setting up the database:

1. ✅ Create admin user (see above)
2. ✅ Configure `.env` file with database credentials
3. ✅ Start the server: `node server.js`
4. ✅ Login at `http://localhost:3000`
5. ✅ Create staff, vendor, and student accounts

---

## 🎓 Understanding the Schema

### Key Relationships:

```
users
  ├─→ transactions (user purchases)
  ├─→ reloads (balance top-ups)
  └─→ pending_rfid_links (RFID card linking)

menu
  └─→ transactions (items purchased)

pending_reloads ──→ (confirmed) ──→ reloads
pending_sales ──→ (confirmed) ──→ transactions
```

### Workflow:

1. **Staff creates pending_reload** → Student taps RFID → **reload confirmed**
2. **Vendor creates pending_sale** → Student taps RFID → **transaction recorded**
3. **Student links RFID** → Tap new card → **RFID paired to account**

---

## ✅ Checklist

Before starting development:

- [ ] Database created (`canteen_db`)
- [ ] All 9 tables created
- [ ] Admin user created
- [ ] `.env` file configured
- [ ] Server starts without errors
- [ ] Can login to web interface

---

## 📞 Need Help?

If you encounter issues:

1. Check MySQL is running: `mysql -V`
2. Check database exists: `SHOW DATABASES;`
3. Check tables exist: `USE canteen_db; SHOW TABLES;`
4. Check server.js logs for database connection errors

---

**You're all set!** 🎉

Your database is ready for the Smart Canteen System!

