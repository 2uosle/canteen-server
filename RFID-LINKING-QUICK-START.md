# RFID Linking - Quick Start

## 🚀 Setup (5 minutes)

### 1. Run Database Migration
```powershell
# Open MySQL and run:
mysql -u root -p canteen_db
```

```sql
-- Copy and paste from migrations/add_pending_rfid_scans.sql
-- Or run:
source migrations/add_pending_rfid_scans.sql;
```

### 2. Restart Server
```powershell
# Stop server (Ctrl+C if running)
node server.js
```

## 📱 How to Use

### For Staff:

1. **Login** as staff/admin
2. Click **"Link RFID"** button (yellow button on dashboard)
3. **Search** for student (by name or student number)
4. Optional: Check **"Only show users without RFID"**
5. Click **"Link RFID"** button next to student name
6. **Ask student to tap card** on NEUTap reader
7. ✅ **Success!** Card is linked

### Workflow Diagram:
```
Staff Opens Page → Search Student → Click "Link RFID" 
    ↓
Modal Opens: "Waiting for card tap..."
    ↓
Student Taps Card → ESP32 Sends to Server
    ↓
System Validates (checks for duplicates)
    ↓
✅ Success: Card Linked  OR  ❌ Error: Already in use
```

## 🔧 ESP32 Integration

### No Changes Needed!

Your existing ESP32 code already works. The device just needs to send scans to:

**POST** `http://your-server:3000/rfid/scan`

```json
{
  "uid": "AB12CD34",
  "device_id": "NEUTap-01"
}
```

The server automatically handles whether it's:
- A linking request (staff is waiting)
- A balance check (normal operation)
- A purchase (vendor mode)

## ⚠️ Troubleshooting

### "No card detected" (Timeout)
- ✅ Ensure ESP32 is powered on and connected
- ✅ Verify network connectivity
- ✅ Check ESP32 serial monitor for errors
- ✅ Try tapping the card again

### "Card already linked to X"
- This card is already registered to another student
- Options:
  1. Use a different card
  2. Unlink from the other student first (if it's a mistake)

### "Failed to search users"
- Check if you're logged in as staff/admin
- Verify server is running
- Check browser console (F12) for errors

## 📊 Features

✅ **Search by Name or Student Number**  
✅ **Filter: Show only users without RFID**  
✅ **Real-time Card Detection** (polls every 500ms)  
✅ **Duplicate Prevention** (automatic validation)  
✅ **60-Second Timeout** (with retry option)  
✅ **Unlink Cards** (for lost/replacement cards)  
✅ **Auto-Refresh** (table updates after linking)  

## 🎯 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/rfid/search-users?q=juan&onlyNoRfid=true` | Search students |
| POST | `/rfid/scan` | ESP32 sends card tap |
| GET | `/rfid/pending?userId=123` | Poll for scan (links card) |
| POST | `/rfid/unlink` | Remove RFID from user |

## 📝 Testing Script

Run this quick test:

1. **Search**: Type "juan" → should show matching students
2. **Filter**: Check "Only show users without RFID" → list updates
3. **Link**: Click "Link RFID" → modal opens
4. **Tap**: Use a card → should link within 1-2 seconds
5. **Verify**: Card status changes to "RFID Linked" ✅
6. **Unlink**: Click "Unlink" → confirms removal

## 📦 Files Created/Modified

### New Files:
- `migrations/add_pending_rfid_scans.sql` - Database schema
- `RFID-LINKING-GUIDE.md` - Full documentation
- `RFID-LINKING-QUICK-START.md` - This file

### Modified Files:
- `server.js` - Added 3 new API endpoints (~150 lines)
- `public/index.html` - Added RFID linking page + modal (~150 lines)
- `public/js/app.js` - Added linking functions (~250 lines)

## 🔐 Security

- ✅ Staff/Admin authentication required
- ✅ Duplicate RFID prevention
- ✅ Database transactions (atomic operations)
- ✅ No manual UID entry (reduces errors)
- ✅ Audit trail (scanned_at timestamps)

## 💡 Tips

1. **Bulk Linking**: Keep the page open and link multiple students in sequence
2. **Pre-filter**: Use "Only show users without RFID" to focus on unlinked accounts
3. **Fast Search**: Type just first name or last few digits of student number
4. **Error Recovery**: "Retry" button works after timeouts or errors

## 📞 Need Help?

Check these in order:
1. Browser Console (F12) → Console tab
2. Server Logs → `logs/` directory  
3. MySQL Logs → Check for connection errors
4. ESP32 Serial Monitor → Verify card readings

---

**Ready to start?** Run the migration, restart the server, and login as staff!
