# 🛠️ Development Mode Guide

## Rate Limiting in Development vs Production

### 🟢 Development Mode (Default)

When running locally (`node server.js`), rate limiting is **much more lenient**:

| Feature | Development | Production |
|---------|------------|------------|
| **General Limit** | 1000 req/15min OR unlimited on localhost | 100 req/15min |
| **Login Limit** | 50 attempts/15min OR unlimited on localhost | 5 attempts/15min |
| **Localhost** | ✅ Rate limiting **disabled** | ❌ Rate limiting **enforced** |

**Result:** You can refresh/test as much as you want! 🎉

---

### 🔴 Production Mode

Set `NODE_ENV=production` in your `.env` file:

```env
NODE_ENV=production
```

**Strict limits enforced:**
- General: 100 requests per 15 minutes
- Login: 5 attempts per 15 minutes
- No exceptions for localhost

---

## 🚨 "Too Many Requests" Error Fix

### If You See This Error:
```json
{"error":"Too many requests from this IP, please try again later."}
```

### Solutions (Pick One):

#### **Option 1: Restart Server** ⚡ (Fastest)
```powershell
# Stop server (Ctrl+C)
# Start again
node server.js
```
✅ Counter resets immediately!

---

#### **Option 2: Wait 15 Minutes** ⏰
The counter automatically resets after the time window expires.

---

#### **Option 3: Already Fixed!** ✅
The server is now configured to **skip rate limiting on localhost** during development.

Just restart your server:
```powershell
node server.js
```

You should see unlimited access now!

---

## 🔍 How It Works

### Development Detection:
```javascript
// Server automatically detects:
const isDevelopment = process.env.NODE_ENV !== 'production';
const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1';

if (isDevelopment && isLocalhost) {
  // Skip rate limiting ✅
}
```

### Your IP Addresses (Localhost):
- `127.0.0.1` (IPv4)
- `::1` (IPv6)
- `::ffff:127.0.0.1` (IPv6-mapped IPv4)

All of these are automatically whitelisted in development!

---

## 🧪 Testing Rate Limiting

### Test in Development (Lenient):
```powershell
# This will NOT trigger rate limit:
for ($i=1; $i -le 200; $i++) {
    Invoke-RestMethod http://localhost:3000/health
}
# ✅ All 200 requests succeed!
```

### Test in Production Mode:
```powershell
# Set production mode
$env:NODE_ENV = "production"
node server.js

# This WILL trigger rate limit:
for ($i=1; $i -le 101; $i++) {
    Invoke-RestMethod http://localhost:3000/health
}
# ❌ Request 101 fails with "Too many requests"
```

---

## 📊 Rate Limit Status

### Check Your Remaining Requests:
```powershell
$response = Invoke-WebRequest http://localhost:3000/health -Method Get
$response.Headers
```

**Look for:**
```
RateLimit-Limit: 1000          # Total allowed
RateLimit-Remaining: 995       # How many left
RateLimit-Reset: 1698765432    # When counter resets
```

---

## ⚙️ Environment Variables

### Create `.env` File:
```env
# Development (default - lenient)
NODE_ENV=development

# Production (strict)
# NODE_ENV=production

# Other settings
PORT=3000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=your_password
DB_NAME=canteen_db
JWT_SECRET=your_secret_key
```

---

## 🎯 Best Practices

### ✅ DO:
- Use development mode for local testing
- Set production mode when deploying
- Test rate limiting before deployment
- Restart server after changing `.env`

### ❌ DON'T:
- Don't set `NODE_ENV=production` locally
- Don't disable rate limiting in production
- Don't commit `.env` to Git (already in `.gitignore`)

---

## 🚀 Quick Commands

### Start Development Server:
```powershell
# Default (development mode)
node server.js

# Or explicitly
$env:NODE_ENV = "development"
node server.js
```

### Start Production Server:
```powershell
$env:NODE_ENV = "production"
node server.js
```

### Check Current Mode:
```powershell
# In Node.js REPL
node
> process.env.NODE_ENV
'development' or 'production'
```

---

## 🆘 Troubleshooting

### Problem: Rate limit triggered on localhost

**Check if running in production mode:**
```powershell
node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
```

**Solution:**
```powershell
# Remove production mode
Remove-Item Env:\NODE_ENV
# Or set to development
$env:NODE_ENV = "development"
# Restart server
node server.js
```

---

### Problem: Rate limit not working in production

**Check rate limit configuration:**
```javascript
// In server.js, should see:
max: process.env.NODE_ENV === 'production' ? 100 : 1000
```

**Solution:**
```powershell
# Ensure production mode is set
$env:NODE_ENV = "production"
node server.js
```

---

## 📚 Summary

**In Development (Default):**
- ✅ Unlimited requests on localhost
- ✅ Easy testing
- ✅ No annoying rate limits

**In Production:**
- 🔒 Strict rate limits
- 🛡️ Full security protection
- 🚫 No exceptions

**Current Status:** ✅ Fixed! Localhost is whitelisted in development mode.

---

## 💡 Pro Tips

### Tip 1: Use Start Script
```powershell
.\start-server.ps1
# Automatically handles environment setup
```

### Tip 2: Check Headers in Browser
Open DevTools → Network tab → Click any request → Headers
Look for `RateLimit-Remaining`

### Tip 3: Clear Rate Limit Instantly
Just restart the server!

---

**You should now be able to access localhost:3000 without rate limit errors!** 🎉

