# 🔧 Scripts Reference

This folder contains all PowerShell scripts and utility JavaScript files for the NEUTap system.

## 🚀 PowerShell Scripts

### Server Management
- **`start-server.ps1`** - Start the Node.js server
- **`validate-env.ps1`** - Validate .env configuration
- **`setup-env.ps1`** - Interactive environment setup wizard

### Admin & Setup
- **`setup-admin.ps1`** - Create admin user account

### Database & Backup
- **`quick-backup.ps1`** - Quick database backup
- **`restore.ps1`** - Restore from backup

### Testing
- **`run-full-system-tests.ps1`** - Run complete test suite
- **`run-thesis-tests.ps1`** - Run thesis-specific tests
- **`test-security.ps1`** - Security validation tests
- **`test-security-fixes.ps1`** - Security fix verification
- **`test-validation.ps1`** - Input validation tests
- **`test-websocket.ps1`** - WebSocket functionality tests

### Logging & Monitoring
- **`view-logs.ps1`** - View application logs
- **`generate-log-report.ps1`** - Generate log reports
- **`generate-thesis-logs.ps1`** - Generate thesis log data

### Git & Version Control
- **`github-setup.ps1`** - Setup GitHub repository
- **`github-recover.ps1`** - Recover from Git issues

### Other Utilities
- **`fix-rate-limit.ps1`** - Fix rate limiting issues

---

## 🔧 JavaScript Utilities

### Account Management
- **`check-account.js`** - Check user account details
- **`assign-vendor.js`** - Assign vendor role to users
- **`setup-canteen-manager.js`** - Setup canteen manager account

### Database
- **`check-database.js`** - Verify database connection and schema

### Testing & Data Generation
- **`test-vendor-stats.js`** - Test vendor statistics
- **`generate-audit-logs.js`** - Generate audit log data

---

## 📖 Usage Examples

### Start the server
```powershell
.\scripts\start-server.ps1
```

### Setup environment
```powershell
.\scripts\setup-env.ps1
```

### Create admin account
```powershell
.\scripts\setup-admin.ps1
```

### View logs
```powershell
.\scripts\view-logs.ps1
```

### Run tests
```powershell
.\scripts\run-full-system-tests.ps1
```

### Check account
```powershell
node scripts/check-account.js <username>
```

### Backup database
```powershell
.\scripts\quick-backup.ps1
```

---

## 🔒 Important Notes

- Always run PowerShell scripts from the **project root** directory
- JavaScript utilities use Node.js: `node scripts/script-name.js`
- Some scripts require database connection (check .env first)
- Backup scripts create files in `backup/` folder
- Test scripts output to `coverage/` or `logs/`

---

## 🆘 Troubleshooting

### Script won't run?
```powershell
# Enable script execution (first time only)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Can't find script?
```powershell
# Make sure you're in the project root
cd c:\MyProj\canteen-server
```

### Database connection fails?
```powershell
# Validate your .env configuration
.\scripts\validate-env.ps1
```

---

**For more help**, see the main documentation at [../docs/README.md](../docs/README.md)
