# 📝 Winston Logging - Quick Reference Card

## 🚀 Quick Start

```javascript
const logger = require('./logger');

logger.error('Something broke!');
logger.warn('Something suspicious');
logger.info('Important event');
logger.debug('Debugging info');
```

---

## 📊 Log Levels (Priority Order)

```
error → warn → info → http → debug → verbose
```

**Rule**: If you set level to `info`, you'll see: `error`, `warn`, and `info` (but not `debug`)

---

## 💡 Common Patterns

### **✅ Good Examples:**

```javascript
// Transaction completed
logger.info('Transaction completed', {
  userId: 123,
  amount: 500,
  itemName: 'Adobo'
});

// Error with context
logger.error('Database query failed', {
  error: err.message,
  userId: 123
});

// User action
logger.info('User logged in', {
  username: 'juan',
  role: 'student',
  ip: req.ip
});

// Warning
logger.warn('Low balance detected', {
  userId: 123,
  balance: 50
});
```

### **❌ Bad Examples:**

```javascript
// Too vague
logger.error('Failed');

// Missing context
logger.info('Done');

// Logging sensitive data
logger.info('Password changed', { newPassword: 'secret123' });

// Wrong log level
logger.error('User logged in'); // Use info instead
```

---

## 📁 Log Files

| File | Contains | Retention |
|------|----------|-----------|
| `combined-DATE.log` | Everything | 14 days |
| `error-DATE.log` | Errors only | 30 days |
| `access-DATE.log` | HTTP requests | 7 days |

**Location**: `logs/` directory

---

## 🔍 Viewing Logs

### **View entire file:**
```powershell
Get-Content logs/combined-2025-10-22.log
```

### **Last 50 lines:**
```powershell
Get-Content logs/combined-2025-10-22.log -Tail 50
```

### **Live tail (real-time):**
```powershell
Get-Content logs/combined-2025-10-22.log -Wait
```

### **Search for text:**
```powershell
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "error"
```

### **Search multiple files:**
```powershell
Select-String -Path "logs/*.log" -Pattern "cedrick"
```

---

## ⚙️ Configuration

### **Change log level (.env):**
```env
LOG_LEVEL=debug    # Development (show everything)
LOG_LEVEL=info     # Production (recommended)
LOG_LEVEL=error    # Only errors
```

### **Log retention:**
- Error logs: **30 days**
- Combined logs: **14 days**
- Access logs: **7 days**

Configured in `logger.js`

---

## 🎯 What to Log

### **DO:**
✅ Server start/stop  
✅ Database connection status  
✅ User login/logout  
✅ Transactions  
✅ Errors  
✅ Security events  
✅ Performance metrics  

### **DON'T:**
❌ Passwords  
❌ Credit card numbers  
❌ Personal IDs  
❌ Full session tokens  
❌ Every tiny detail  

---

## 🔥 Most Useful Commands

### **1. Count today's errors:**
```powershell
(Select-String -Path "logs/error-2025-10-22.log" -Pattern "ERROR").Count
```

### **2. Find specific user's activity:**
```powershell
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "userId.*123"
```

### **3. List all log files:**
```powershell
Get-ChildItem logs/ | Sort-Object LastWriteTime -Descending
```

### **4. View errors from last hour:**
```powershell
Get-Content logs/error-2025-10-22.log | Select-String -Pattern (Get-Date).ToString("HH:")
```

### **5. Export logs to file:**
```powershell
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "Transaction" > transactions.txt
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| No logs folder | Run `node server.js` once |
| Can't find today's log | Check filename: `combined-YYYY-MM-DD.log` |
| Logs too verbose | Set `LOG_LEVEL=info` in `.env` |
| No console output | Check `NODE_ENV` is not `production` |

---

## 📞 Common Scenarios

### **Debugging a transaction error:**
1. Check `error-DATE.log`
2. Search for transaction ID
3. Look for related user ID
4. Check timeline in `combined-DATE.log`

### **Finding failed logins:**
```powershell
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "Login failed"
```

### **Monitoring database health:**
```powershell
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "Database"
```

### **Checking server uptime:**
```powershell
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "server started"
```

---

## 🎓 Remember

1. **Use appropriate log levels** (don't use error for info!)
2. **Include context** (userId, transactionId, etc.)
3. **Don't log sensitive data** (passwords, tokens)
4. **Use structured data** (objects, not strings)
5. **Check logs regularly** (catch issues early)

---

## 📚 More Info

- Full guide: `LOGGING-GUIDE.md`
- Logger config: `logger.js`
- Current usage: Check `server.js`

---

**Quick tip**: Set up an alias for viewing logs:
```powershell
# Add to PowerShell profile
function Show-Logs { Get-Content logs/combined-$(Get-Date -Format yyyy-MM-dd).log -Wait }
```

Then just run: `Show-Logs`

---

✅ **You're all set!** Happy logging! 📝

