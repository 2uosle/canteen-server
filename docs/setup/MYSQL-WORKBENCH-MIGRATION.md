# 🗄️ MySQL Workbench Migration Guide

## How to Add the Cancelled Transactions Table

---

## 📋 Step-by-Step Instructions

### **Step 1: Open MySQL Workbench**
1. Launch MySQL Workbench
2. Connect to your MySQL server (default: `localhost:3306`)

### **Step 2: Select Database**
1. In the left sidebar, expand **"Schemas"**
2. Find and select **`canteen_db`**
3. Double-click on it to set it as default

### **Step 3: Open SQL Editor**
1. Click **"File"** → **"New Query Tab"**
   - OR press `Ctrl+T`
   - OR click the SQL Editor tab at the top

### **Step 4: Paste the Migration SQL**

Copy and paste this SQL into the editor:

```sql
-- Migration: Add cancelled_transactions table
-- Date: 2025-01-XX
-- Purpose: Track cancelled/failed vendor transactions

CREATE TABLE IF NOT EXISTS `cancelled_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pending_id` int NOT NULL,
  `item_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `vendor_id` int NOT NULL,
  `vendor_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancelled_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ct_pending` (`pending_id`),
  KEY `idx_ct_vendor` (`vendor_id`),
  KEY `idx_ct_date` (`cancelled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log of cancelled/failed transactions';
```

### **Step 5: Execute the SQL**
1. Click the **Execute** button (⚡ lightning icon)
   - OR press `Ctrl+Enter`
2. Wait for the query to complete

### **Step 6: Verify Success**
You should see:
```
0 row(s) affected
Execution Time : 0.045 sec
Transfer Time  : 0.000 sec
Total Time     : 0.046 sec
```

### **Step 7: Check the Table**
1. In the left sidebar under **`canteen_db`**
2. Click the refresh icon (🔄) next to "Tables"
3. Look for **`cancelled_transactions`** in the list
4. Right-click → **"Select Rows - Limit 1000"** to view structure

---

## ✅ Success Indicators

### You know it worked when:
- ✅ Query executed without errors
- ✅ `cancelled_transactions` appears in the Tables list
- ✅ You can right-click and view table data
- ✅ Columns match the SQL structure

---

## ❌ If You Get Errors

### Error: "Table already exists"
**Solution:** The table already exists. You can either:
1. Ignore it (it's already there)
2. Or modify line 1 to: `DROP TABLE IF EXISTS \`cancelled_transactions\`;`

### Error: "Access denied"
**Solution:** You need admin privileges. Use your MySQL root user:
1. Click the connection settings (⚙️)
2. Verify you're using root user
3. Enter correct password

### Error: "Database does not exist"
**Solution:** Create the database first:
```sql
CREATE DATABASE IF NOT EXISTS canteen_db;
USE canteen_db;
```

---

## 🔍 Verify Table Structure

After running the migration, you should see these columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | Primary key, auto-increment |
| `pending_id` | INT | Links to original pending sale |
| `item_name` | VARCHAR(150) | Name of cancelled item |
| `amount` | DECIMAL(10,2) | Amount of transaction |
| `vendor_id` | INT | Vendor who cancelled |
| `vendor_name` | VARCHAR(150) | Vendor's name |
| `reason` | VARCHAR(255) | Cancellation reason |
| `cancelled_at` | DATETIME | Timestamp |

---

## 📝 Alternative: Using Command Line

If you prefer command line:

```bash
# Navigate to project directory
cd c:\MyProj\canteen-server

# Run migration
mysql -u root -p canteen_db < migrations/add-cancelled-transactions-table.sql
```

Enter your MySQL password when prompted.

---

## 🎯 Quick Visual Guide

```
MySQL Workbench Interface:

┌─────────────────────────────────────────┐
│  [File] [Edit] [...]                    │  ← Top Menu
├─────────────────────────────────────────┤
│  Schemas │ SQL Editor                   │
│  ├─ canteen_db                          │
│  │  ├─ Tables                           │
│  │  │  └─ cancelled_transactions ◄──┐   │
│  │  └─ Views                          │   │  ← Left Sidebar
├─────────────────────────────────────────┤   │
│                                         │   │
│  SQL Editor                             │   │
│  ┌─────────────────────────────────┐   │   │
│  │ CREATE TABLE cancelled_trans...  │   │   │
│  │                                   │   │   │
│  └─────────────────────────────────┘   │   │
│  [Execute] ◄── Click here!         │   │   │  ← Right Panel
└─────────────────────────────────────────┘   │
         ▲                                    │
         └────────────────────────────────────┘
         Both areas show the same info
```

---

## 💡 Pro Tips

### Tip 1: Use Auto-Complete
- Start typing `cancelled_transactions`
- MySQL Workbench will suggest the table name
- Press `Tab` to autocomplete

### Tip 2: Save Your Query
- Before executing, click **File → Save**
- Save as: `add-cancelled-transactions.sql`
- You can reuse it later!

### Tip 3: View Table Data
After creation:
1. Right-click `cancelled_transactions`
2. Select **"Select Rows - Limit 1000"**
3. See the empty table ready for data

### Tip 4: Check Indexes
To see the indexes we created:
```sql
SHOW INDEXES FROM cancelled_transactions;
```

---

## 🚀 Next Steps

After the migration:

1. **Restart your server:**
   ```bash
   node server.js
   ```

2. **Test the cancellation:**
   - Login as vendor
   - Start a sale transaction
   - Click CANCEL
   - Enter reason
   - Check the database for the log entry

3. **View cancellations in database:**
   ```sql
   SELECT * FROM cancelled_transactions;
   ```

---

## 📚 Related Files

- Migration SQL: `migrations/add-cancelled-transactions-table.sql`
- Schema file: `schema.sql`
- API endpoint: `server.js` (POST /pending-sale/cancel)
- Documentation: `TRANSACTION-CANCELLATION-GUIDE.md`

---

## ✅ You're Done!

The `cancelled_transactions` table is now ready to log all transaction cancellations!

**Happy auditing!** 📊

