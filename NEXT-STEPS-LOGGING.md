# 🎯 Winston Logging - What to Do Next

## ✅ What's Done

Winston logging is **fully implemented and working**! 

Your server is now logging to:
- `logs/combined-2025-10-22.log` - All logs (219 bytes)
- `logs/error-2025-10-22.log` - Errors only (0 bytes - no errors!)
- `logs/access-2025-10-22.log` - HTTP requests (0 bytes - none yet)

---

## 🎓 How to Use It

### **1. View Logs While Developing:**

**Option A: Live Tail (Real-time)**
```powershell
# Watch logs in real-time
Get-Content logs/combined-2025-10-22.log -Wait
```

**Option B: Last 20 Lines**
```powershell
Get-Content logs/combined-2025-10-22.log -Tail 20
```

**Option C: Open in Editor**
```powershell
code logs/combined-2025-10-22.log
```

### **2. Check for Errors:**
```powershell
# View error log
Get-Content logs/error-2025-10-22.log

# Search for errors in combined log
Select-String -Path "logs/combined-*.log" -Pattern "ERROR"
```

### **3. Search for Specific Events:**
```powershell
# Find cleanup logs
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "Cleanup"

# Find database logs
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "Database"

# Find specific user
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "cedrick"
```

---

## 🚀 Try It Out

### **Test 1: View Server Startup Logs**
```powershell
# Your server is already running, view the startup logs:
Get-Content logs/combined-2025-10-22.log
```

Expected output:
```
2025-10-22 21:13:40 [INFO] Cleanup job scheduled to run every 10 minutes
2025-10-22 21:13:40 [INFO] API server started on http://localhost:3000
2025-10-22 21:13:40 [INFO] Database connection established successfully
```

### **Test 2: Trigger Some Activity**
Use your canteen system (login, make a transaction, etc.) and watch the logs grow.

### **Test 3: Wait for Cleanup Job**
In 10 minutes, you should see a cleanup log appear:
```powershell
# Watch for cleanup logs
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "Cleanup"
```

---

## 📝 Add More Logging (Optional)

Want to log more events? Add logger calls to your code:

### **Example 1: Log User Logins**
Edit `server.js`, find the `/login` endpoint and add:
```javascript
logger.info('User logged in', { 
  username: data.username, 
  role: data.role,
  ip: req.ip 
});
```

### **Example 2: Log Transactions**
Find the transaction endpoint and add:
```javascript
logger.info('Transaction completed', {
  userId: req.user.userId,
  amount: req.body.amount,
  itemName: req.body.itemName
});
```

### **Example 3: Log Failed Operations**
In any `catch` block, replace `console.error` with:
```javascript
logger.error('Operation failed', {
  operation: 'transaction',
  userId: req.user.userId,
  error: err.message
});
```

---

## 🎨 PowerShell Alias (Convenience)

Add this to your PowerShell profile for quick log access:

```powershell
# Open PowerShell profile
notepad $PROFILE

# Add these functions:
function Show-Logs { 
  Get-Content "logs/combined-$(Get-Date -Format yyyy-MM-dd).log" -Wait 
}

function Show-Errors { 
  Get-Content "logs/error-$(Get-Date -Format yyyy-MM-dd).log" 
}

function Search-Logs { 
  param($Pattern)
  Select-String -Path "logs/combined-*.log" -Pattern $Pattern 
}
```

Then use:
```powershell
Show-Logs        # Live tail today's logs
Show-Errors      # View today's errors
Search-Logs "user"  # Search all logs for "user"
```

---

## 📚 Documentation Reference

| File | Purpose |
|------|---------|
| `WINSTON-LOGGING-IMPLEMENTATION.md` | Full implementation details |
| `LOGGING-GUIDE.md` | Complete user guide with examples |
| `LOGGING-QUICK-REFERENCE.md` | Quick commands cheat sheet |
| `logger.js` | Winston configuration (can be customized) |

---

## 🔧 Customization Options

### **Change Log Level:**
Edit `.env`:
```env
# Show everything (development)
LOG_LEVEL=debug

# Show only important stuff (production)
LOG_LEVEL=info

# Show only errors
LOG_LEVEL=error
```

### **Change Retention:**
Edit `logger.js`:
```javascript
// Keep error logs for 60 days instead of 30
maxFiles: '60d'
```

### **Change File Size:**
Edit `logger.js`:
```javascript
// Rotate at 50MB instead of 20MB
maxSize: '50m'
```

---

## ✅ Daily Workflow

1. **Start your server:**
   ```powershell
   node server.js
   ```

2. **In another terminal, watch logs:**
   ```powershell
   Get-Content logs/combined-2025-10-22.log -Wait
   ```

3. **Use your system normally** (login, transactions, etc.)

4. **Check for errors occasionally:**
   ```powershell
   Get-Content logs/error-2025-10-22.log
   ```

5. **Search logs when debugging:**
   ```powershell
   Select-String -Path "logs/combined-*.log" -Pattern "error"
   ```

---

## 🎯 Key Takeaways

1. **Logs are in `logs/` directory** - Check there first
2. **New file created each day** - Named `combined-YYYY-MM-DD.log`
3. **Errors go to separate file** - Check `error-YYYY-MM-DD.log` for issues
4. **Old logs auto-delete** - No need to clean up manually
5. **Use `Select-String` to search** - PowerShell's grep equivalent
6. **Use `-Wait` for real-time** - See logs as they happen

---

## 🎉 You're All Set!

Winston logging is **production-ready** and working perfectly!

Your next steps:
1. ✅ Try viewing the logs (commands above)
2. ✅ Use your canteen system and watch logs grow
3. ✅ (Optional) Add more logging to specific endpoints
4. ✅ (Optional) Set up PowerShell aliases for convenience

---

## 💡 Pro Tips

**Tip 1**: Keep a terminal open with live tail during development
```powershell
Get-Content logs/combined-2025-10-22.log -Wait
```

**Tip 2**: Check error logs after any issues
```powershell
Get-Content logs/error-2025-10-22.log
```

**Tip 3**: Search logs when investigating issues
```powershell
Select-String -Path "logs/*.log" -Pattern "transaction 123"
```

**Tip 4**: Archive important logs before they auto-delete
```powershell
Copy-Item logs/combined-2025-10-22.log -Destination backups/
```

---

**Happy logging!** 📝✨

Need help? Check `LOGGING-GUIDE.md` or `LOGGING-QUICK-REFERENCE.md`

