# 🚀 Quick Start Guide

## ✅ If Project Already Works (Your Current Setup)

```powershell
cd C:\MyProj\canteen-server
node server.js
```

**That's it!** Visit http://localhost:3000

---

## 🆕 If You Just Recovered from GitHub

### **Step 1: Get the Code**
```powershell
git clone https://github.com/YOUR-USERNAME/canteen-server.git
cd canteen-server
```

### **Step 2: Install Dependencies**
```powershell
npm install
```
This downloads all required packages (~30 seconds)

### **Step 3: Configure Database**
```powershell
# Copy environment template
copy .env.example .env

# Edit .env with your settings:
notepad .env
```

Set your database credentials:
```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=your_password
DB_NAME=canteen_db
```

### **Step 4: Start Server**
```powershell
node server.js
```

✅ **Server running at http://localhost:3000**

---

## 🎮 One-Command Start (After Recovery)

```powershell
.\start-server.ps1
```

This script automatically:
- ✅ Checks if Node.js is installed
- ✅ Installs dependencies if missing
- ✅ Warns if .env is missing
- ✅ Starts the server

---

## 📋 Full Recovery Checklist

After cloning from GitHub:

- [ ] `npm install` (installs packages)
- [ ] Create `.env` file (database config)
- [ ] Ensure MySQL is running
- [ ] Database `canteen_db` exists
- [ ] Database tables are created
- [ ] Run `node server.js`

---

## 🗄️ Database Setup

Your database is NOT backed up on GitHub (too large, sensitive data).

After recovery, you need:

### **Option 1: Fresh Database**
```sql
CREATE DATABASE canteen_db;
USE canteen_db;
-- Run your table creation scripts
```

### **Option 2: Restore from Backup**
```powershell
# If you have a backup file
mysql -u root -p canteen_db < backup.sql
```

---

## 🔧 Troubleshooting

### **Error: "Cannot find module 'express'"**
**Fix:** Run `npm install`

### **Error: "connect ECONNREFUSED"**
**Fix:** Check MySQL is running and `.env` has correct credentials

### **Error: ".env file not found"**
**Fix:** Copy `.env.example` to `.env` and edit it

### **Port 3000 already in use**
**Fix:** Stop other server or change port in `.env`:
```env
PORT=3001
```

---

## 💡 Development Workflow

### **Daily Start:**
```powershell
cd C:\MyProj\canteen-server
.\start-server.ps1
```

### **After Making Changes:**
```powershell
# Save locally
.\quick-backup.ps1 "Describe your changes"

# Backup to GitHub
git push
```

### **After Pulling Updates:**
```powershell
git pull
npm install  # In case new packages were added
node server.js
```

---

## 🌐 What Gets Backed Up on GitHub?

| Item | Backed Up? | Why? |
|------|-----------|------|
| `server.js` | ✅ Yes | Source code |
| `package.json` | ✅ Yes | Dependency list |
| `node_modules/` | ❌ No | Too large (reinstall with npm) |
| `.env` | ❌ No | Contains secrets |
| Database | ❌ No | Too large, sensitive data |
| `public/` | ✅ Yes | Frontend files |
| `config/` | ✅ Yes | Configuration code |
| Scripts (`.ps1`) | ✅ Yes | Helper tools |
| Documentation (`.md`) | ✅ Yes | Guides |

---

## 📦 Complete Recovery Example

```powershell
# 1. Clone from GitHub
cd C:\MyProj
git clone https://github.com/YOUR-USERNAME/canteen-server.git
cd canteen-server

# 2. Install dependencies
npm install

# 3. Configure environment
copy .env.example .env
notepad .env  # Edit database credentials

# 4. (Optional) Restore database
mysql -u root -p canteen_db < backup.sql

# 5. Start server
node server.js

# ✅ Server is running!
```

---

## 🎯 Remember

**The magic command after recovery:**
```powershell
npm install
```

This recreates `node_modules/` so `node server.js` works!

**Then just:**
```powershell
node server.js
```

---

## 🆘 Still Not Working?

Run the diagnostic:
```powershell
.\start-server.ps1
```

It will tell you exactly what's missing!

