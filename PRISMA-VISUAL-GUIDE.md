# 🎨 Prisma Studio - Visual Database Guide

## 🖥️ What You'll See in Prisma Studio

When you run `npm run db:studio` and open `http://localhost:5555`, you'll see:

---

## 📊 Main Interface Layout

```
┌─────────────────────────────────────────────────────────┐
│  PRISMA STUDIO                                    [⚙️]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📁 Models (Left Sidebar)        Data View (Main)       │
│  ├── User                    ┌──────────────────────┐   │
│  ├── Menu                    │  user_id │ name      │   │
│  ├── Transaction             ├──────────┼───────────┤   │
│  ├── Reload                  │    1     │ Juan Cruz │   │
│  ├── PendingReload           │    2     │ Maria San │   │
│  ├── PendingSale             │    3     │ Pedro Lim │   │
│  ├── PendingRfidLink         └──────────┴───────────┘   │
│  ├── CardHotlist                                         │
│  └── Device                  [Add Record] [Filter]       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 👥 User Table View

Click on **User** to see:

| user_id | name | username | role | rfid_uid | balance | is_card_locked |
|---------|------|----------|------|----------|---------|----------------|
| 1 | Juan Dela Cruz | juan.dc | student | A1B2C3D4 | ₱250.00 | false |
| 2 | Maria Santos | vendor_maria | vendor | null | ₱0.00 | false |
| 3 | Pedro Rodriguez | staff_pedro | staff | null | ₱0.00 | false |
| 4 | Admin User | admin | admin | null | ₱0.00 | false |

**Features:**
- ✏️ Click any cell to edit
- ➕ Click "Add Record" to create new user
- 🔍 Search by name, username, or RFID
- 🔗 Click on relations to see connected data

---

## 🍽️ Menu Table View

Click on **Menu** to see:

| item_id | item_name | price | active |
|---------|-----------|-------|--------|
| 1 | Chicken Adobo | ₱45.00 | ✓ |
| 2 | Pancit Canton | ₱35.00 | ✓ |
| 3 | Siopao | ₱25.00 | ✓ |
| 4 | Bottled Water | ₱15.00 | ✓ |

**Edit menu items directly:**
- Change prices
- Add new items
- Deactivate old items

---

## 💰 Transaction Table View

Click on **Transaction** to see:

| tx_id | user → | item → | amount | timestamp |
|-------|--------|--------|--------|-----------|
| 1 | Juan Dela Cruz | Chicken Adobo | ₱45.00 | 2025-10-28 10:30 |
| 2 | Maria Santos | Pancit Canton | ₱35.00 | 2025-10-28 11:15 |
| 3 | Juan Dela Cruz | Bottled Water | ₱15.00 | 2025-10-28 12:00 |

**Special features:**
- 🔗 Click "user →" to jump to that user's details
- 🔗 Click "item →" to jump to that menu item
- 📊 See full purchase history
- 🔍 Filter by date, user, or item

---

## 💵 Reload Table View

Click on **Reload** to see:

| reload_id | user → | amount | cashier → | timestamp |
|-----------|--------|--------|-----------|-----------|
| 1 | Juan Dela Cruz | ₱500.00 | Pedro Rodriguez | 2025-10-28 08:00 |
| 2 | Maria Santos | ₱300.00 | Pedro Rodriguez | 2025-10-28 09:30 |

**View reload history:**
- See who reloaded
- See which staff member processed it
- Track all balance additions

---

## 🔄 Pending Tables

### PendingReload
See active top-up requests waiting for RFID tap:

| id | amount | cashier_id | confirmed | created_at |
|----|--------|------------|-----------|------------|
| 1 | ₱100.00 | 3 | false | 2025-10-28 14:30 |

### PendingSale
See active sale transactions waiting for card tap:

| id | item_name | amount | vendor_id | confirmed |
|----|-----------|--------|-----------|-----------|
| 1 | Chicken Adobo | ₱45.00 | 2 | false |

### PendingRfidLink
See active RFID pairing requests:

| id | user_id | uid | confirmed | created_at |
|----|---------|-----|-----------|------------|
| 1 | 5 | null | false | 2025-10-28 15:00 |

---

## 🚫 CardHotlist Table

See blocked RFID cards:

| rfid_uid | reason | created_at |
|----------|--------|------------|
| DEADBEEF | Lost card reported | 2025-10-25 10:00 |
| BAD1234 | Suspicious activity | 2025-10-26 14:30 |

**Block/unblock cards:**
- Add new blocked cards
- Remove cards from hotlist
- Add block reason notes

---

## 📱 Device Table

See registered ESP32/Arduino devices:

| device_id | name | location | last_seen | enabled |
|-----------|------|----------|-----------|---------|
| ESP32-001 | Main Kiosk | Cafeteria Entrance | 2025-10-28 14:00 | ✓ |
| ESP32-002 | Vendor Station | Food Counter | 2025-10-28 14:30 | ✓ |

**Manage devices:**
- Enable/disable devices
- Update device names
- Track last connection time

---

## 🎯 Common Tasks in Prisma Studio

### 1. **Add a New Student**
- Click **User** model
- Click **Add Record**
- Fill in: name, username, password (hashed), role="student"
- Save

### 2. **Check Student Balance**
- Click **User** model
- Search for student name
- See `balance` column
- Click to edit if needed

### 3. **View Purchase History**
- Click **Transaction** model
- Filter by user or date
- See all purchases

### 4. **Add Menu Item**
- Click **Menu** model
- Click **Add Record**
- Fill in: item_name, price, active=true
- Save

### 5. **Link RFID Card**
- Click **User** model
- Find student
- Edit `rfid_uid` field
- Enter card UID (e.g., "A1B2C3D4")
- Save

### 6. **Block a Card**
- Click **CardHotlist** model
- Click **Add Record**
- Enter rfid_uid and reason
- Save

---

## 💡 Pro Tips

### Navigate Between Related Data
- Click the arrow (→) next to foreign keys
- Example: Click "user →" in Transaction to jump to that user

### Quick Filtering
- Use the search box at top of each table
- Works on all text fields

### Bulk Operations
- Select multiple rows (checkbox on left)
- Delete or export selected rows

### Refresh Data
- Press F5 or click refresh icon
- See live updates from your running server

### Export Data
- Click export button
- Download as CSV or JSON
- Great for reports or backups

---

## 🔐 Security Tips

✅ **Safe for development:**
- Use Prisma Studio freely on localhost
- Great for testing and debugging

❌ **Never in production:**
- Don't expose Prisma Studio to the internet
- Use only for local development
- Production databases need restricted access

---

## 🚀 Your Workflow

### Daily Development:
```bash
# Terminal 1: Start your server
node server.js

# Terminal 2: Start Prisma Studio
npm run db:studio
```

### Keep both running:
- Server on `localhost:3000` (main app)
- Prisma Studio on `localhost:5555` (database UI)

### Make changes:
- Users interact with app (localhost:3000)
- You view/edit data in Prisma Studio (localhost:5555)
- Changes sync in real-time!

---

## 📸 What It Looks Like

Prisma Studio has a clean, modern interface with:
- **Dark/Light mode toggle**
- **Clean table views**
- **Easy navigation**
- **Intuitive editing**
- **No SQL knowledge needed!**

---

## 🎉 Enjoy Your Visual Database!

Run `npm run db:studio` and explore your data visually!

No more SQL queries for simple tasks! 🎊

