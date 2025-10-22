# 🔧 Environment Configuration Guide

## What is `.env`?

The `.env` file stores **sensitive configuration** for your canteen server:
- Database passwords
- Secret keys
- API tokens
- Server settings

**Why it matters:**
- ✅ Separates config from code
- ✅ Different settings for dev/production
- ✅ Keeps secrets out of Git
- ✅ Easy to change without editing code

---

## 📋 Quick Setup

### Step 1: Create .env File

```powershell
# Copy template to .env
copy env.template .env
```

### Step 2: Edit .env

```powershell
# Open in notepad
notepad .env

# Or use VS Code
code .env
```

### Step 3: Fill in Required Values

**Minimum required:**
```env
PORT=3000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=your_actual_mysql_password
DB_NAME=canteen_db

JWT_SECRET=your_generated_secret_key
```

### Step 4: Test

```powershell
node server.js
# Should start without errors!
```

---

## 🔑 Required Configuration

### 1. **Database Settings** 🗄️

```env
DB_HOST=127.0.0.1        # Your MySQL server address
DB_USER=root             # MySQL username
DB_PASS=YourPassword123  # MySQL password (CHANGE THIS!)
DB_NAME=canteen_db       # Database name
```

**How to find your MySQL password:**
- Check your MySQL installation notes
- Try common defaults: `root`, `password`, `admin`
- Reset if forgotten: [MySQL Password Reset Guide](https://dev.mysql.com/doc/refman/8.0/en/resetting-permissions.html)

---

### 2. **JWT Secret** 🔐

```env
JWT_SECRET=a1b2c3d4e5f6...  # 64+ character random string
```

**Generate a strong secret:**

```powershell
# Method 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Method 2: Online generator
# Visit: https://randomkeygen.com/ (use "Fort Knox Passwords")

# Method 3: PowerShell
$bytes = New-Object byte[] 64; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

**Example output:**
```
a7f2b9e1c4d8f3a6b2e5c9d1f7a3b8e4c6d9f2a5b7e1c8d4f6a9b3e7c2d5f1a8
```

Copy this and paste it as your `JWT_SECRET`.

---

## ⚙️ Optional Configuration

### Redis (Caching) ☁️

```env
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true       # Set to true after installing Redis
REDIS_PREFIX=canteen:    # Prefix for all Redis keys
```

**When to enable:**
- ✅ High traffic (100+ concurrent users)
- ✅ Faster balance lookups
- ✅ Session management
- ❌ Not needed for small installations

**Install Redis:**
```powershell
# Windows: Download from https://github.com/microsoftarchive/redis/releases
# Or use WSL: sudo apt install redis-server
```

---

### WebSocket (Real-time Updates) 🔄

```env
WS_PORT=3001             # WebSocket server port
WS_ENABLED=true          # Set to true for real-time features
```

**Features enabled:**
- ✅ Live balance updates (no page refresh!)
- ✅ Real-time transaction notifications
- ✅ Instant device sync
- ✅ Live admin dashboards

---

### Rate Limiting 🚦

```env
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes in milliseconds
RATE_LIMIT_MAX=100             # Max requests per window
AUTH_RATE_LIMIT_MAX=5          # Login attempts per window
```

**Adjust for your needs:**

| Use Case | Settings |
|----------|----------|
| **Small school** | `RATE_LIMIT_MAX=200` |
| **Large cafeteria** | `RATE_LIMIT_MAX=500` |
| **High security** | `AUTH_RATE_LIMIT_MAX=3` |
| **Testing** | `RATE_LIMIT_MAX=1000` |

---

## 🌍 Environment Modes

### Development Mode (Default)

```env
NODE_ENV=development
```

**Characteristics:**
- ✅ Detailed error messages
- ✅ Lenient rate limits
- ✅ SQL query logging
- ✅ Hot reload friendly
- ✅ Localhost whitelisted

**Use for:**
- Local development
- Testing
- Debugging

---

### Production Mode

```env
NODE_ENV=production
```

**Characteristics:**
- 🔒 Strict rate limits
- 🔒 Minimal error details
- 🔒 Optimized performance
- 🔒 Security headers enforced
- 🔒 No debug output

**Requirements:**
- ✅ Strong JWT_SECRET
- ✅ Secure database password
- ✅ HTTPS enabled
- ✅ Specific CORS origin
- ✅ Firewall configured

---

## 🎯 Configuration Examples

### Local Development

```env
PORT=3000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=root
DB_NAME=canteen_db

JWT_SECRET=dev_secret_not_for_production
JWT_EXPIRES_IN=24h

REDIS_ENABLED=false
WS_ENABLED=false

CORS_ORIGIN=*
DEBUG=true
SQL_DEBUG=true
```

---

### Production Server

```env
PORT=3000
NODE_ENV=production

DB_HOST=mysql.yourdomain.com
DB_USER=canteen_user
DB_PASS=Str0ng_P@ssw0rd_2024!
DB_NAME=canteen_production

JWT_SECRET=a7f2b9e1c4d8f3a6b2e5c9d1f7a3b8e4c6d9f2a5b7e1c8d4f6a9b3e7c2d5f1a8b4e7c9d2
JWT_EXPIRES_IN=2h

REDIS_ENABLED=true
REDIS_URL=redis://redis.yourdomain.com:6379

WS_ENABLED=true
WS_PORT=3001

CORS_ORIGIN=https://canteen.yourdomain.com
TRUST_PROXY=true

RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5

TZ=Asia/Manila
LOG_LEVEL=warn
```

---

## 🔍 Troubleshooting

### Error: "Cannot connect to database"

**Check:**
1. Is MySQL running? `Get-Service mysql*`
2. Correct password in `.env`?
3. Database exists? `CREATE DATABASE canteen_db;`
4. User has permissions? `GRANT ALL ON canteen_db.* TO 'root'@'localhost';`

---

### Error: "JWT Secret is not defined"

**Fix:**
```env
# Add to .env
JWT_SECRET=your_secret_here
```

**Generate one:**
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### Error: "EADDRINUSE: address already in use"

**Fix:**
```env
# Change port in .env
PORT=3001
```

Or kill process using port 3000:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

---

## 🔐 Security Best Practices

### ✅ DO:
1. **Generate strong secrets**
   ```powershell
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Use different secrets for dev/production**
   - Dev: Simple, easy to remember
   - Production: Complex, randomly generated

3. **Restrict database user permissions**
   ```sql
   CREATE USER 'canteen'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON canteen_db.* TO 'canteen'@'localhost';
   ```

4. **Set specific CORS origins in production**
   ```env
   CORS_ORIGIN=https://yourdomain.com
   ```

5. **Use environment variables on production servers**
   - Don't use `.env` file in production
   - Set variables in hosting platform (Heroku, AWS, etc.)

---

### ❌ DON'T:
1. **Never commit .env to Git** (already in `.gitignore`)
2. **Never share your JWT_SECRET**
3. **Never use default passwords in production**
4. **Never set `CORS_ORIGIN=*` in production**
5. **Never disable rate limiting in production**

---

## 📊 Configuration Validation

### Check if .env is loaded:

```javascript
// In Node.js
console.log(process.env.DB_NAME);  // Should print 'canteen_db'
console.log(process.env.JWT_SECRET);  // Should print your secret
```

### Test database connection:

```powershell
# Using MySQL client
mysql -h 127.0.0.1 -u root -p
# Enter password from .env
USE canteen_db;
SHOW TABLES;
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] `NODE_ENV=production`
- [ ] Strong `JWT_SECRET` (64+ characters)
- [ ] Secure database password
- [ ] Specific `CORS_ORIGIN` (not `*`)
- [ ] `RATE_LIMIT_MAX` set appropriately
- [ ] `AUTH_RATE_LIMIT_MAX=5` or less
- [ ] Database user with limited permissions
- [ ] HTTPS enabled
- [ ] Firewall configured
- [ ] `.env` file not in Git
- [ ] Backup strategy in place
- [ ] Monitoring configured

---

## 📁 File Structure

```
canteen-server/
├── .env                 ← Your actual config (not in Git)
├── env.template         ← Template to copy from
├── .gitignore          ← Ensures .env is never committed
├── ENV-SETUP.md        ← This guide
└── server.js           ← Loads .env automatically
```

---

## 💡 Pro Tips

### Tip 1: Multiple Environments

```powershell
# Development
copy env.template .env.development

# Production
copy env.template .env.production

# Use specific file
$env:NODE_ENV="production"
node -r dotenv/config server.js dotenv_config_path=.env.production
```

### Tip 2: Validate on Startup

Add to `server.js`:
```javascript
const required = ['DB_HOST', 'DB_USER', 'DB_PASS', 'JWT_SECRET'];
required.forEach(key => {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
});
```

### Tip 3: Use .env for Scripts

```javascript
// backup-script.js
require('dotenv').config();
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS
};
```

---

## 🆘 Quick Reference

| Variable | Required? | Default | Description |
|----------|-----------|---------|-------------|
| `PORT` | ✅ | `3000` | Server port |
| `NODE_ENV` | ✅ | `development` | Environment mode |
| `DB_HOST` | ✅ | - | MySQL host |
| `DB_USER` | ✅ | - | MySQL user |
| `DB_PASS` | ✅ | - | MySQL password |
| `DB_NAME` | ✅ | - | Database name |
| `JWT_SECRET` | ✅ | - | JWT signing key |
| `REDIS_ENABLED` | ❌ | `false` | Enable Redis |
| `WS_ENABLED` | ❌ | `false` | Enable WebSocket |

---

**Ready to configure? Run:**
```powershell
copy env.template .env
notepad .env
```

Then fill in your values and start the server! 🚀

