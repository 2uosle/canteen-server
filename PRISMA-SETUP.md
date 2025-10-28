# 🗄️ Prisma Database UI Setup

## Overview
Prisma Studio provides a visual interface to view and edit your MySQL database at `http://localhost:5555`

---

## ✅ Setup Complete!

The following has been installed and configured:
- ✅ Prisma CLI (`prisma`)
- ✅ Prisma Client (`@prisma/client`)
- ✅ Database schema mapped to Prisma models
- ✅ Environment variables configured

---

## 🚀 How to Use Prisma Studio

### Start Prisma Studio
Run **any** of these commands:

```bash
# Option 1 - Short command
npm run db:studio

# Option 2 - Full command
npm run prisma:studio

# Option 3 - Direct command
npx prisma studio
```

This will:
1. Connect to your MySQL database
2. Open Prisma Studio at `http://localhost:5555`
3. Allow you to browse and edit data visually

---

## 📊 What You Can Do in Prisma Studio

### View All Tables
- **users** - Students, staff, vendors, admins
- **menu** - Food items and prices
- **transactions** - All purchases/sales
- **reloads** - Balance reload history
- **pending_reloads** - Active reload requests
- **pending_sales** - Active sale requests
- **pending_rfid_links** - Active RFID pairing requests
- **card_hotlist** - Blocked RFID cards
- **devices** - Registered ESP32/Arduino devices

### Features
- ✅ **Browse data** - View all records in tables
- ✅ **Search & filter** - Find specific records
- ✅ **Edit records** - Update data directly
- ✅ **Add records** - Create new entries
- ✅ **Delete records** - Remove data
- ✅ **View relationships** - See linked data between tables

---

## 📝 Other Prisma Commands

### Generate Prisma Client (after schema changes)
```bash
npm run prisma:generate
```

### Pull schema from database (if DB changed outside Prisma)
```bash
npm run prisma:pull
```

### Push schema changes to database
```bash
npm run prisma:push
```

---

## 🔧 Database Connection

Prisma uses the `DATABASE_URL` environment variable from your `.env` file:

```env
DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
```

This connects to the same MySQL database as your main server.

---

## 📁 File Structure

```
canteen-server/
├── prisma/
│   ├── schema.prisma       ← Database schema
│   └── migrations/         ← Database migrations (if used)
├── prisma.config.ts        ← Prisma configuration
├── node_modules/
│   └── @prisma/client/     ← Generated Prisma Client
└── .env                    ← Database credentials
```

---

## 🎯 Quick Start

**1. Start your MySQL server**

**2. Start Prisma Studio:**
```bash
npm run db:studio
```

**3. Open browser:**
- Navigate to `http://localhost:5555`
- Browse your database visually!

**4. Keep it running:**
- Prisma Studio will stay open
- Press `Ctrl+C` to stop

---

## 💡 Tips

### Viewing Live Data
- Keep Prisma Studio open while your server is running
- Refresh the page to see new data from transactions

### Editing User Balances
1. Open Prisma Studio
2. Click on `User` model
3. Find a student
4. Edit the `balance` field
5. Save changes

### Testing RFID Cards
1. Click on `User` model
2. Add/edit `rfidUid` field
3. Test with your physical cards

### Checking Transactions
1. Click on `Transaction` model
2. See all purchases with amounts
3. Click on related `user` or `item` to navigate

---

## 🔒 Security Note

- Prisma Studio is for **development only**
- Don't expose it to the internet
- Only run on localhost
- Production databases should use restricted access

---

## 📚 Learn More

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Studio Guide](https://www.prisma.io/docs/concepts/components/prisma-studio)
- [Prisma Client API](https://www.prisma.io/docs/concepts/components/prisma-client)

---

## 🎉 You're All Set!

Run `npm run db:studio` and enjoy your visual database interface!

