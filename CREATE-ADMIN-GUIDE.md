# 🔐 How to Create Your First Admin Account

## Quick & Easy Method (Recommended)

### Step 1: Make Sure Server is Running

```powershell
.\start-server.ps1
```

OR

```powershell
node server.js
```

### Step 2: Run the Setup Script

```powershell
.\setup-admin.ps1
```

The script will:
1. ✅ Check if server is running
2. ✅ Ask for admin username (default: `admin`)
3. ✅ Ask for admin name (default: `System Administrator`)
4. ✅ Ask for password (default: `admin123`)
5. ✅ Create the admin account
6. ✅ Open your browser to login page

### Step 3: Login!

1. Go to `http://localhost:3000`
2. Login with your credentials:
   - **Username**: (what you entered, default: `admin`)
   - **Password**: (what you entered, default: `admin123`)
3. **You'll see the Admin Dashboard!** 🎉

---

## Alternative Method 1: Using the API Directly

If the script doesn't work, use this method:

### 1. Make sure server is running

### 2. Open PowerShell and run:

```powershell
$body = @{
    username = "admin"
    password = "admin123"
    name = "System Administrator"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/setup-admin" -Method POST -Body $body -ContentType "application/json"
```

### 3. Login at `http://localhost:3000`

---

## Alternative Method 2: Database Update (if you have an existing account)

If you already have an account (student/staff/vendor), you can promote it to admin:

### Option A: Using MySQL Workbench or phpMyAdmin

Run this SQL:
```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

### Option B: Using MySQL Command Line

```bash
mysql -u root -p
USE canteen_db;
UPDATE users SET role = 'admin' WHERE username = 'your_username';
exit;
```

Then login with that account - you'll see the admin dashboard!

---

## ⚠️ IMPORTANT: Security Warning

After creating your admin account, **DELETE the setup endpoint** from `server.js`!

### How to Remove the Setup Endpoint:

1. Open `server.js`
2. Find lines **1132-1161** (search for `/setup-admin`)
3. **Delete** or **comment out** the entire endpoint:

```javascript
// TEMPORARY: First-time admin setup endpoint (REMOVE AFTER USE!)
app.post('/setup-admin', async (req, res) => {
  // ... DELETE THIS ENTIRE BLOCK ...
});
```

4. Restart the server

**Why?** This endpoint allows anyone to check if an admin exists. It's only meant for initial setup!

---

## ✅ Verification

After logging in as admin, you should see:

```
┌─────────────────────────────────────────┐
│  Admin Dashboard                         │
│  ┌──────────┬──────────┬──────────┐    │
│  │ Total    │ Students │ Staff    │    │
│  │  Users   │          │          │    │
│  └──────────┴──────────┴──────────┘    │
│                                         │
│  User Management                        │
│  [Search]  [Filters]  [+ New User]     │
└─────────────────────────────────────────┘
```

If you see this - **SUCCESS!** ✅

---

## 🐛 Troubleshooting

### Problem: "Server is not running"
**Solution**: Start the server first with `.\start-server.ps1` or `node server.js`

### Problem: "Admin already exists"
**Solution**: An admin account was already created. Try logging in with:
- Username: `admin`
- Password: `admin123`

Or update an existing user to admin using the database method.

### Problem: "Cannot connect to localhost:3000"
**Solution**: 
1. Check if server is actually running (you should see "API running on http://localhost:3000")
2. Check if another app is using port 3000
3. Try `http://127.0.0.1:3000` instead

### Problem: "After login, I don't see admin dashboard"
**Solution**: 
1. Check `localStorage` in browser console:
   - Press F12 → Console
   - Type: `localStorage.getItem('role')`
   - Should return: `"admin"`
2. If not admin, update database: `UPDATE users SET role = 'admin' WHERE username = 'your_username'`
3. Logout and login again

---

## 🎯 Quick Start

**TL;DR - The Fastest Way:**

```powershell
# 1. Start server (if not running)
.\start-server.ps1

# 2. In another PowerShell window:
.\setup-admin.ps1

# 3. Login at http://localhost:3000
#    Username: admin
#    Password: admin123

# 4. You're in! Now delete the /setup-admin endpoint from server.js
```

---

## 📝 Default Credentials

If you used the script with defaults:
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ CHANGE THIS PASSWORD IMMEDIATELY!**

How to change:
1. Login as admin
2. Click your name (top right)
3. Click "Settings"
4. Enter old and new password
5. Click "Update Password"

---

## 🎉 Success!

Once you're logged in as admin, you can:
- ✅ View all users
- ✅ Create new users
- ✅ Edit user info
- ✅ Lock/unlock cards
- ✅ Reset passwords
- ✅ Unpair RFID
- ✅ Delete users
- ✅ Search and filter users

All while **respecting user privacy** (no balance/transaction amounts shown)!

Enjoy your new admin dashboard! 🚀

