# Vendor Statistics Setup Guide

## Problem
The vendor statistics feature is not showing data because the `transactions` table is missing the `vendor_id` column.

## Solution - Step by Step

### Step 1: Open MySQL Workbench
1. Open MySQL Workbench
2. Connect to your database server
3. Select the `canteen_db` database (or your database name)

### Step 2: Run the Migration SQL

Copy and paste this SQL script into MySQL Workbench and execute it:

```sql
USE canteen_db;

-- Add vendor_id column to transactions table
ALTER TABLE transactions 
ADD COLUMN vendor_id INT NULL AFTER item_id,
ADD INDEX idx_vendor_id (vendor_id),
ADD CONSTRAINT fk_transactions_vendor 
  FOREIGN KEY (vendor_id) REFERENCES users(user_id) 
  ON DELETE SET NULL;
```

### Step 3: Verify the Change

Run this query to check if the column was added:

```sql
DESCRIBE transactions;
```

You should see `vendor_id` in the list of columns.

### Step 4: (Optional) Update Existing Transactions

If you have existing transaction data and want to assign it to a vendor, run:

```sql
-- First, find your vendor user_ids
SELECT user_id, name, role FROM users WHERE role = 'vendor';

-- Then update transactions (replace '1' with actual vendor user_id)
UPDATE transactions SET vendor_id = 1 WHERE vendor_id IS NULL;
```

### Step 5: Restart the Server

The server code has been updated to:
1. Insert `vendor_id` when creating new transactions
2. Query `vendor_id` when fetching vendor statistics

**Important:** Restart your Node.js server to apply the changes:
- Press Ctrl+C in the terminal
- Run: `node server.js`

### Step 6: Test the Feature

1. Log in as admin
2. Go to Vendor Statistics section
3. Select date range (e.g., 10/22/2025 to 10/28/2025)
4. You should now see vendor data

## What Was Fixed in the Code

### Backend (server.js)
1. ✅ Fixed SQL queries to use correct column names:
   - `tx_id` instead of `transaction_id`
   - `menu` table instead of `menu_items`
   - `item_id` instead of `menu_item_id`

2. ✅ Updated transaction INSERT to include `vendor_id`:
   ```javascript
   INSERT INTO transactions (user_id, item_id, custom_item, amount, vendor_id, device_id)
   ```

3. ✅ Fixed `/admin/vendor-stats` endpoint
4. ✅ Fixed `/admin/vendor/:vendorId/transactions` endpoint

### Frontend (app.js)
1. ✅ Added error handling for vendor stats loading
2. ✅ Calendar icon now shows in red for better visibility

## Troubleshooting

### Still seeing "No data"?
1. Make sure you have vendor users in your database:
   ```sql
   SELECT * FROM users WHERE role = 'vendor';
   ```

2. Make sure you have transactions with vendor_id set:
   ```sql
   SELECT * FROM transactions WHERE vendor_id IS NOT NULL;
   ```

3. Check if dates are correct (use MySQL date format: YYYY-MM-DD)

### Error when running migration?
- If you get "Column already exists", the column was already added. Skip Step 2.
- If you get "Foreign key constraint fails", make sure your users table has the vendor users.

## Files Modified
- ✅ `server.js` - Fixed SQL queries and added vendor_id to transactions
- ✅ `public/js/app.js` - Added error handling
- ✅ `public/css/components.css` - Red calendar icon styling
- ✅ `migrations/add-vendor-id-to-transactions.sql` - Database migration script

