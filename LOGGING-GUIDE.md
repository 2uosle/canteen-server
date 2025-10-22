# 📝 Winston Logging System - User Guide

## ✅ What Was Implemented

Your Smart Canteen System now has a professional logging system using **Winston** with automatic file rotation and structured logging.

---

## 📁 Log Files Structure

After starting the server, log files are automatically created in the `logs/` directory:

```
canteen-server/
  ├── logs/
  │   ├── combined-2025-10-22.log    (All logs)
  │   ├── error-2025-10-22.log       (Errors only)
  │   ├── access-2025-10-22.log      (HTTP requests)
  │   ├── combined-2025-10-21.log    (Yesterday's logs)
  │   └── error-2025-10-21.log       (Yesterday's errors)
  ├── logger.js                      (Winston configuration)
  └── server.js
```

---

## 🎯 Log Levels

The system uses standard Winston log levels:

| Level | When to Use | Example | Logged To |
|-------|-------------|---------|-----------|
| **error** | Critical errors | Database connection failed | `error-DATE.log` + `combined-DATE.log` + Console |
| **warn** | Warnings | Failed login attempt | `combined-DATE.log` + Console |
| **info** | Important events | Server started, User logged in | `combined-DATE.log` + Console |
| **http** | HTTP requests | GET /api/balance | `access-DATE.log` + `combined-DATE.log` |
| **debug** | Debugging info | Query took 150ms | `combined-DATE.log` + Console (dev only) |

---

## 📊 Log Format

### **File Logs (structured):**
```
2025-10-22 14:20:36 [INFO] API server started on http://localhost:3000
2025-10-22 14:20:36 [INFO] Database connection established successfully
2025-10-22 14:20:36 [INFO] Cleanup job scheduled to run every 10 minutes
2025-10-22 14:25:15 [INFO] Cleanup: Removed old pending records {"total":5,"sales":2,"reloads":2,"links":1}
2025-10-22 14:30:42 [ERROR] Database health check failed {"error":"Connection timeout"}
```

### **Console Output (colored, simpler):**
```
14:20:36 info: API server started on http://localhost:3000
14:20:36 info: Database connection established successfully
14:20:36 info: Cleanup job scheduled to run every 10 minutes
14:25:15 info: Cleanup: Removed old pending records
14:30:42 error: Database health check failed
```

---

## 🔍 What's Being Logged Now

### **1. Server Lifecycle:**
- ✅ Server startup
- ✅ Database connection status
- ✅ Cleanup job scheduling

### **2. Database Operations:**
- ✅ Connection failures
- ✅ Health check results

### **3. Cleanup Jobs:**
- ✅ Number of records cleaned
- ✅ Breakdown by type (sales, reloads, links)
- ✅ Cleanup errors

### **4. Admin Operations:**
- ✅ User list loading failures

---

## 🚀 How to Use Logging in Your Code

### **Basic Logging:**
```javascript
const logger = require('./logger');

// Info message
logger.info('User logged in successfully');

// Error message
logger.error('Payment processing failed');

// Warning
logger.warn('Low balance detected');

// Debug (only in development)
logger.debug('Query completed');
```

### **Structured Logging (Recommended):**
```javascript
// Log with context
logger.info('Transaction completed', {
  userId: 123,
  amount: 500,
  itemName: 'Adobo',
  transactionId: 67
});

// Log error with details
logger.error('Database query failed', {
  error: err.message,
  query: 'SELECT * FROM users',
  userId: 123
});

// Log HTTP request
logger.http('API request received', {
  method: 'POST',
  path: '/login',
  ip: req.ip
});
```

---

## 📖 Viewing Logs

### **1. View Today's Combined Logs:**
```powershell
# PowerShell
Get-Content logs/combined-2025-10-22.log

# Or use a text editor
code logs/combined-2025-10-22.log
```

### **2. View Today's Errors Only:**
```powershell
Get-Content logs/error-2025-10-22.log
```

### **3. Search for Specific Text:**
```powershell
# Search for "error" in today's logs
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "error"

# Search for specific user
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "cedrick"

# Search for transaction logs
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "Transaction"
```

### **4. View Last 50 Lines:**
```powershell
Get-Content logs/combined-2025-10-22.log -Tail 50
```

### **5. Live Tail (watch logs in real-time):**
```powershell
Get-Content logs/combined-2025-10-22.log -Wait
```

---

## 🔧 Configuration

### **Log Retention:**

The logger is configured to automatically rotate and clean up old logs:

| Log Type | Retention | Max Size |
|----------|-----------|----------|
| **Error logs** | 30 days | 20 MB per file |
| **Combined logs** | 14 days | 20 MB per file |
| **Access logs** | 7 days | 20 MB per file |

After the retention period, old log files are automatically deleted.

### **Changing Log Level:**

Set the `LOG_LEVEL` environment variable in your `.env` file:

```env
# .env
LOG_LEVEL=debug    # Show everything (development)
LOG_LEVEL=info     # Show info and above (production)
LOG_LEVEL=warn     # Show warnings and errors only
LOG_LEVEL=error    # Show errors only
```

Default: `info` in production, `debug` in development

---

## 🐛 Troubleshooting

### **Logs folder doesn't exist?**
**Solution**: It's created automatically on first run. Just start the server:
```powershell
node server.js
```

### **Can't find today's log file?**
**Solution**: Check the date format. Files are named: `combined-YYYY-MM-DD.log`
```powershell
# List all log files
Get-ChildItem logs/
```

### **Log files are too large?**
**Solution**: The logger automatically rotates when files reach 20MB. Old rotated files are named:
```
combined-2025-10-22.log
combined-2025-10-22.log.1
combined-2025-10-22.log.2
```

### **Logs not showing in console?**
**Solution**: Console logging is enabled by default. Check if you're running in production mode:
```powershell
# Make sure NODE_ENV is not set to 'production'
echo $env:NODE_ENV
```

---

## 💡 Best Practices

### **1. Use Appropriate Log Levels:**
```javascript
// ❌ Bad
logger.error('User logged in');

// ✅ Good
logger.info('User logged in', { username: 'juan', role: 'student' });
```

### **2. Include Context:**
```javascript
// ❌ Bad
logger.error('Failed');

// ✅ Good
logger.error('Payment processing failed', { 
  userId: 123, 
  amount: 500, 
  error: err.message 
});
```

### **3. Don't Log Sensitive Data:**
```javascript
// ❌ Bad
logger.info('User logged in', { password: 'secret123' });

// ✅ Good
logger.info('User logged in', { username: 'juan' });
```

### **4. Use Structured Data:**
```javascript
// ❌ Bad
logger.info(`User ${userId} purchased ${itemName} for ${amount}`);

// ✅ Good
logger.info('Purchase completed', { userId, itemName, amount });
```

---

## 📊 Log Analysis Examples

### **Count Errors Today:**
```powershell
(Select-String -Path "logs/error-2025-10-22.log" -Pattern "ERROR").Count
```

### **Find All Database Errors:**
```powershell
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "Database.*failed"
```

### **Extract All User Login Events:**
```powershell
Select-String -Path "logs/combined-2025-10-22.log" -Pattern "User logged in"
```

### **Group Errors by Type:**
```powershell
Select-String -Path "logs/error-2025-10-22.log" -Pattern "ERROR" | 
  ForEach-Object { $_.Line -replace '.*\[ERROR\] ', '' -replace ' \{.*', '' } | 
  Group-Object | 
  Sort-Object Count -Descending
```

---

## 🎯 What to Log

### **DO Log:**
- ✅ Server startup/shutdown
- ✅ Database connection status
- ✅ User authentication (login/logout)
- ✅ Important transactions
- ✅ Errors and exceptions
- ✅ Security events (failed logins, locked cards)
- ✅ Performance metrics
- ✅ Cleanup job results

### **DON'T Log:**
- ❌ Passwords
- ❌ Credit card numbers
- ❌ Personal identification numbers
- ❌ Session tokens (full tokens)
- ❌ Every single database query (too verbose)

---

## 🔐 Security Notes

1. **`.gitignore` excludes logs** - Log files won't be committed to Git
2. **Logs contain user actions** - Treat them as sensitive data
3. **Rotate logs regularly** - Already configured (automatic)
4. **Restrict log file access** - Only admins should access production logs

---

## 📚 Next Steps

### **Want more detailed logging?**
Add more logger calls in your code:

```javascript
// In login endpoint
app.post('/login', async (req, res) => {
  try {
    // ... login logic
    logger.info('User logged in', { 
      username: data.username, 
      role: data.role,
      ip: req.ip 
    });
  } catch (err) {
    logger.error('Login failed', { 
      username: req.body.username,
      error: err.message 
    });
  }
});
```

### **Want to log HTTP requests?**
Install Morgan (HTTP request logger):
```powershell
npm install morgan
```

Then add to `server.js`:
```javascript
const morgan = require('morgan');
const logger = require('./logger');

app.use(morgan('combined', { stream: logger.stream }));
```

---

## ✅ Summary

Your canteen system now has:

✅ **Professional logging** with Winston  
✅ **Automatic file rotation** (by day + size)  
✅ **Separate error logs** for easy debugging  
✅ **Structured logging** with JSON metadata  
✅ **Console + file output** for development and production  
✅ **Automatic cleanup** of old logs  
✅ **Configurable log levels** via environment variables  

**Log files location**: `logs/` directory  
**Log format**: Timestamped, structured, searchable  
**Retention**: 7-30 days depending on type  

---

## 📞 Questions?

- **How do I view logs?** → Check `logs/` folder
- **Where are errors?** → Check `logs/error-DATE.log`
- **Can I search logs?** → Yes! Use `Select-String` in PowerShell
- **Are logs backed up?** → No, add them to your backup strategy if needed

---

**Happy logging!** 📝✨

