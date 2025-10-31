# Smart Canteen System

RFID-based cashless payment system for canteen/cafeteria management.

## Features

- 💳 **RFID Payment**: Tap-to-pay with RFID cards
- 👥 **Multi-Role System**: Staff, Vendor, and Student accounts
- 🔒 **Security**: Card locking, JWT authentication, password hashing, Helmet, rate limiting
- 📊 **Reports**: Transaction history and CSV exports
- 🎨 **Modern UI**: Responsive design with dark/light theme
- 🏪 **POS Interface**: Touch-optimized transaction flow with numeric keypad
- 🔔 **Real-Time Updates**: WebSocket notifications for live balance updates
- 🔧 **Hardware Integration**: ESP32 + PN532 RFID reader

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment

**Option 1: Interactive Setup (Recommended)**
```bash
.\scripts\setup-env.ps1
# Follow the wizard to create .env
```

**Option 2: Manual Setup**
```bash
copy env.template .env
notepad .env
# Fill in your database credentials and other settings
```

**Option 3: Validate Existing .env**
```bash
.\scripts\validate-env.ps1
# Checks if your .env is properly configured
```

### 3. Setup Database
Create a MySQL database named `canteen_db` and run the schema. 
📖 See [docs/setup/DATABASE-SETUP.md](docs/setup/DATABASE-SETUP.md) for detailed instructions.

### 4. Start Server
```bash
npm start
# or
.\scripts\start-server.ps1
```

The server will run on `http://localhost:3001`

## 📚 Documentation

All documentation has been organized into [docs/](docs/):
- **[docs/setup/](docs/setup/)** - Initial setup guides
- **[docs/guides/](docs/guides/)** - User and feature guides  
- **[docs/implementation/](docs/implementation/)** - Technical details
- **[docs/testing/](docs/testing/)** - Testing guides

📖 **Start here**: [docs/README.md](docs/README.md)

## User Roles

- **Staff**: Reload balances, register users, pair RFID cards
- **Vendor**: Record sales, view transaction history
- **Student**: Check balance, view transaction history, lock/unlock card

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /register` - Create new account
- `POST /logout` - Logout
- `GET /whoami` - Get current user info

### Transactions
- `POST /transaction` - Record transaction (device)
- `POST /pending-sale` - Create pending sale (vendor)
- `POST /pending-sale/confirm` - Confirm sale with card tap
- `GET /report` - Get transaction report
- `GET /report/csv` - Download transactions CSV

### Balance Management
- `POST /reload` - Reload balance (staff)
- `POST /pending-reload` - Create pending reload
- `POST /pending-reload/confirm` - Confirm reload with tap
- `GET /balance/:uid` - Check balance by RFID UID

### RFID Management
- `POST /rfid/link/start` - Start RFID pairing
- `POST /rfid/link/confirm` - Confirm RFID pairing
- `GET /rfid/link/status/:id` - Check pairing status
- `POST /rfid/unlink` - Unlink RFID from user

## Hardware Setup

See `Arduino1/Arduino1.ino` for ESP32 firmware.

### Required Components
- ESP32 DevKit
- PN532 NFC/RFID Module (I2C)
- RFID Cards (ISO14443A)

### Wiring
- SDA → GPIO 21
- SCL → GPIO 22

## Database Schema

Required tables:
- `users` - User accounts (students, staff, vendors)
- `transactions` - Purchase history
- `reloads` - Balance top-up history
- `menu` - Available items
- `pending_sales` - Temporary pending sales
- `pending_reloads` - Temporary pending reloads
- `pending_rfid_links` - RFID pairing requests

## Development

### Project Structure
```
canteen-server/
├── server.js              # Main application
├── public/
│   ├── index.html         # Web interface
│   ├── js/app.js          # Frontend logic
│   └── css/components.css # Styles & animations
├── config/
│   ├── redis.js           # Redis configuration
│   └── websocket.js       # WebSocket server
├── docs/                  # 📚 All documentation
│   ├── setup/             # Setup guides
│   ├── guides/            # User guides
│   ├── implementation/    # Technical docs
│   └── testing/           # Test guides
├── scripts/               # PowerShell scripts
├── Arduino1/              # ESP32 firmware
├── prisma/                # Database schema
├── logs/                  # Application logs
└── tests/                 # Test files
```

📖 **Full documentation**: [docs/README.md](docs/README.md)

### Useful Scripts
All scripts are now in the `scripts/` folder:
- `scripts/start-server.ps1` - Start the server
- `scripts/setup-env.ps1` - Interactive environment setup
- `scripts/validate-env.ps1` - Validate .env configuration
- `scripts/setup-admin.ps1` - Create admin account
- `scripts/view-logs.ps1` - View application logs
- `scripts/quick-backup.ps1` - Quick database backup

## Version Control (Git)

### Save your current work
```bash
git add .
git commit -m "Description of changes"
```

### View history
```bash
git log --oneline
```

### Restore to previous version
```bash
git checkout <commit-hash>
```

### Create experimental branch
```bash
git branch experimental
git checkout experimental
# Make changes...
git checkout main  # Return to main branch
```

## License

ISC

## Author

Your Name

