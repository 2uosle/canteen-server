# 🔐 Create Admin Account Using MySQL Workbench - Step by Step

## 📋 Prerequisites

- ✅ MySQL Workbench installed
- ✅ You know your database connection details
- ✅ You have at least ONE existing user account (any role)

---

## 🎯 Method 1: Convert Existing User to Admin (Easiest!)

If you already have ANY account (student, staff, vendor), this is the simplest way!

### Step 1: Open MySQL Workbench

1. Launch **MySQL Workbench**
2. You should see your connections on the home screen

### Step 2: Connect to Your Database

1. Click on your connection (usually named something like "Local instance MySQL80" or "canteen_db")
2. Enter your password if prompted
3. You should now see the SQL editor

### Step 3: Select Your Database

In the SQL editor, type:

```sql
USE canteen_db;
```

**Or whatever your database is named**

Then click the **⚡ lightning bolt icon** to execute (or press `Ctrl+Enter`)

You should see: `1 row(s) affected`

### Step 4: Find Your Username

First, let's see what users you have. Type:

```sql
SELECT user_id, username, name, role FROM users;
```

Click **⚡ Execute**

You'll see a table like:
```
user_id | username      | name          | role
--------|---------------|---------------|--------
1       | cedrick       | Cedrick Dizon | student
2       | food_vendor   | Food Vendor   | vendor
3       | staff_john    | John Staff    | staff
```

**Remember the username** you want to make admin!

### Step 5: Make User an Admin

Type this SQL (replace `cedrick` with YOUR username):

```sql
UPDATE users 
SET role = 'admin' 
WHERE username = 'cedrick';
```

Click **⚡ Execute**

You should see: `1 row(s) affected`

### Step 6: Verify It Worked

Check that it was updated:

```sql
SELECT user_id, username, name, role FROM users WHERE username = 'cedrick';
```

Click **⚡ Execute**

You should now see:
```
user_id | username | name          | role
--------|----------|---------------|------
1       | cedrick  | Cedrick Dizon | admin
```

✅ **DONE!** Your account is now an admin!

### Step 7: Test Login

1. Go to `http://localhost:3000`
2. **Logout** if you're currently logged in
3. **Login** with your username and password
4. You should see the **Admin Dashboard**! 🎉

---

## 🎯 Method 2: Create a Brand New Admin Account

If you don't have any existing accounts, use this method:

### Step 1-3: Same as Above

1. Open MySQL Workbench
2. Connect to database
3. Run: `USE canteen_db;`

### Step 4: Create Admin Account

Run this SQL:

```sql
INSERT INTO users (username, password, name, role) 
VALUES (
    'admin', 
    '$2b$10$rPmHNzYzSdZ7hQqZ8YiCPOBxF5zY.xB9yPBqKLl0Qg0hRZXLrQ/oa', 
    'System Administrator', 
    'admin'
);
```

**Note**: The password hash above is for `admin123`

Click **⚡ Execute**

You should see: `1 row(s) affected`

### Step 5: Test Login

1. Go to `http://localhost:3000`
2. Login with:
   - **Username**: `admin`
   - **Password**: `admin123`
3. You should see the **Admin Dashboard**! 🎉

---

## 📸 Visual Guide

### What MySQL Workbench Looks Like:

```
┌─────────────────────────────────────────────────────┐
│ MySQL Workbench                                     │
├─────────────────────────────────────────────────────┤
│ File  Edit  View  Query  Database  Server  ...     │
├─────────────────────────────────────────────────────┤
│ Schemas                                 │ SQL Editor│
│ ▼ canteen_db                           │           │
│   ▶ Tables                              │  [Type   │
│     - items                             │   SQL    │
│     - menu_items                        │   here]  │
│     - pending_reloads                   │           │
│     - pending_rfid_links                │           │
│     - pending_sales                     │           │
│     - reloads                            │           │
│     - transactions                      │           │
│     - users                              │  ⚡Execute│
│   ▶ Views                               │           │
│   ▶ Stored Procedures                   │  Result:  │
│                                         │  [Shows   │
│                                         │   here]   │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Steps with Screenshots Description

### 1. **Opening the SQL Editor**
   - Top of window: Menu bar
   - Left side: "Schemas" panel (database tree)
   - Right side: Large text area (SQL Editor)
   - Below SQL Editor: Results panel

### 2. **Where to Type SQL**
   - Click in the large white/gray text area on the right
   - This is where you type or paste SQL commands

### 3. **How to Execute SQL**
   - Look for the **⚡ lightning bolt icon** above the SQL editor
   - OR press `Ctrl + Enter`
   - OR right-click and select "Execute Statement"

### 4. **Where Results Appear**
   - Below the SQL editor
   - Shows tables, success messages, or errors

---

## 🎯 Quick Copy-Paste Commands

### Check Your Database Name:
```sql
SHOW DATABASES;
```

### Select Your Database (replace if different):
```sql
USE canteen_db;
```

### See All Users:
```sql
SELECT user_id, username, name, role FROM users;
```

### Make Existing User Admin (REPLACE 'username'):
```sql
UPDATE users SET role = 'admin' WHERE username = 'YOUR_USERNAME_HERE';
```

### Create New Admin:
```sql
INSERT INTO users (username, password, name, role) 
VALUES ('admin', '$2b$10$rPmHNzYzSdZ7hQqZ8YiCPOBxF5zY.xB9yPBqKLl0Qg0hRZXLrQ/oa', 'Administrator', 'admin');
```

### Verify Admin Was Created/Updated:
```sql
SELECT username, name, role FROM users WHERE role = 'admin';
```

---

## ⚠️ Common Issues & Solutions

### Issue: "Unknown database 'canteen_db'"
**Solution**: Your database has a different name. Run:
```sql
SHOW DATABASES;
```
Find your canteen database name and use that instead.

---

### Issue: "Table 'users' doesn't exist"
**Solution**: Check if your table has a different name:
```sql
SHOW TABLES;
```
Look for a table that stores user information.

---

### Issue: "Duplicate entry for username"
**Solution**: The username already exists. Either:
1. Choose a different username for the new admin
2. Or update the existing user to admin (Method 1)

---

### Issue: "Can't see the database in the left panel"
**Solution**: 
1. Click the **refresh icon** (🔄) next to "Schemas"
2. Or close and reconnect to MySQL Workbench

---

## 🧪 Testing Your Admin Account

### After running the SQL:

1. **Open browser**: `http://localhost:3000`

2. **Logout** if currently logged in:
   - Click your name (top right)
   - Click "Logout"

3. **Login** with admin credentials:
   - Username: (the one you made admin)
   - Password: (your password)

4. **Check for Admin Dashboard**:
   - You should see stats cards at the top
   - User management table
   - Search and filter controls
   - "New User" button

5. **Success!** ✅ You're now an admin!

---

## 📝 Complete Example Walkthrough

Let's say your username is `cedrick`:

### Step-by-Step:

**1. Open MySQL Workbench** ✅

**2. Connect to your database** ✅

**3. Type and execute:**
```sql
USE canteen_db;
```
**Result**: `1 row(s) affected`

**4. Type and execute:**
```sql
SELECT user_id, username, name, role FROM users WHERE username = 'cedrick';
```
**Result**: 
```
user_id | username | name          | role
1       | cedrick  | Cedrick Dizon | student
```

**5. Type and execute:**
```sql
UPDATE users SET role = 'admin' WHERE username = 'cedrick';
```
**Result**: `1 row(s) affected`

**6. Verify - Type and execute:**
```sql
SELECT user_id, username, name, role FROM users WHERE username = 'cedrick';
```
**Result**: 
```
user_id | username | name          | role
1       | cedrick  | Cedrick Dizon | admin  ← Changed!
```

**7. Test login:**
- Go to http://localhost:3000
- Logout if needed
- Login as `cedrick`
- See Admin Dashboard! 🎉

---

## 🎯 Summary - The Absolute Fastest Way

If you already have an account:

```sql
-- 1. Use your database
USE canteen_db;

-- 2. Make yourself admin (REPLACE 'your_username')
UPDATE users SET role = 'admin' WHERE username = 'your_username';

-- 3. Verify
SELECT username, role FROM users WHERE role = 'admin';
```

**Done in 3 SQL commands!** ✅

---

## 🔐 Security Note

After you're done setting up admin:
- ✅ Change your password in the web interface
- ✅ Delete the `/setup-admin` endpoint from server.js (optional but recommended)

---

## 💡 Pro Tips

1. **Keep MySQL Workbench open** - useful for checking data while testing
2. **Use the "Execute" button** (⚡) or `Ctrl+Enter` - faster than clicking menus
3. **Select specific SQL** - if you have multiple commands, highlight one to run just that
4. **Check the Results panel** - always verify the "X row(s) affected" message

---

## ✅ You're Ready!

After running the UPDATE command in MySQL Workbench:
1. ✅ Your user is now an admin
2. ✅ Login to see the admin dashboard
3. ✅ Start managing your canteen system!

Need help? The error messages in MySQL Workbench are usually clear - just read what it says! 😊

