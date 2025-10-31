# Default Booth Accounts - Quick Reference

## 📍 Counter Accounts

Your system now has **3 pre-configured booth/counter accounts** ready to use:

### Counter 1 - Snack Bar
- **Username:** `counter1`
- **Password:** `counter123`
- **Role:** Vendor
- **User ID:** 30

### Counter 2 - Cafeteria
- **Username:** `counter2`
- **Password:** `counter123`
- **Role:** Vendor
- **User ID:** 6 (formerly food_vendor - retains all transaction history)

### Counter 3 - Snack Bar 2
- **Username:** `counter3`
- **Password:** `counter123`
- **Role:** Vendor
- **User ID:** 32

---

## 🔐 Security Note

**IMPORTANT:** The default password `counter123` should be changed after first login!

To change a password:
1. Log in to the counter account
2. Go to Account Settings
3. Change password to something secure

---

## 🔄 Re-running Setup

If you need to re-create these accounts or reset passwords:

```powershell
# Run the SQL script directly
Get-Content setup-default-booths.sql -Raw | mysql -u root -p"YOUR_PASSWORD" canteen_db
```

Or use the PowerShell script (if execution policy allows):
```powershell
.\setup-booths.ps1
```

---

## 📝 Files Created

- `setup-default-booths.sql` - SQL script to create the accounts
- `setup-booths.ps1` - PowerShell automation script
- `generate-booth-password.js` - Password hash generator

---

## ✅ Verification

All accounts created successfully on: **2025-11-01 01:20:30**

You can verify the accounts exist:
```sql
SELECT user_id, name, username, role 
FROM users 
WHERE role='vendor' 
ORDER BY username;
```
