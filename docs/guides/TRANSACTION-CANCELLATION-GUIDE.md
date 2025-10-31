# 🔄 Transaction Cancellation Feature

## ✅ Implementation Complete!

Vendors can now cancel transactions when students cannot pay or if something goes wrong. All cancellations are logged for audit purposes.

---

## 🎯 What Was Added

### 1. **Backend API** (`server.js`)
- ✅ `POST /pending-sale/cancel` - Cancel a pending sale
- ✅ `GET /cancelled-transactions` - View cancellation history

### 2. **Database Schema** (`schema.sql`)
- ✅ `cancelled_transactions` table to log all cancellations

### 3. **Frontend** (`public/js/app.js`)
- ✅ Enhanced `posCancelSale()` function
- ✅ Reason prompt for vendors
- ✅ API integration with cancellation endpoint
- ✅ Real-time notifications

### 4. **Real-Time Notifications** (`public/js/notifications.js`)
- ✅ `sale_cancelled` event handler
- ✅ Notifications for vendors and students
- ✅ Auto-refresh of sales list

---

## 📋 Database Schema

### New Table: `cancelled_transactions`

```sql
CREATE TABLE `cancelled_transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pending_id` INT NOT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `vendor_id` INT NOT NULL,
  `vendor_name` VARCHAR(150) DEFAULT NULL,
  `reason` VARCHAR(255) DEFAULT NULL,
  `cancelled_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ct_pending` (`pending_id`),
  KEY `idx_ct_vendor` (`vendor_id`),
  KEY `idx_ct_date` (`cancelled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log of cancelled/failed transactions';
```

**Columns:**
- `id` - Primary key
- `pending_id` - Links to original pending sale
- `item_name` - Name of the cancelled item
- `amount` - Amount of cancelled transaction
- `vendor_id` - Vendor who cancelled it
- `vendor_name` - Vendor's name for audit
- `reason` - Optional cancellation reason
- `cancelled_at` - Timestamp of cancellation

---

## 🚀 How to Use

### For Vendors:

1. **Start a sale transaction**
   - Add item and amount
   - Click "Continue"

2. **If student cannot pay:**
   - Click **"CANCEL"** button
   - Enter reason (optional)
   - Click OK

3. **Transaction is cancelled:**
   - Marked as cancelled in database
   - Logged in `cancelled_transactions` table
   - Notifications sent to relevant users
   - Sales list refreshes automatically

---

## 📊 API Endpoints

### Cancel Transaction

**Endpoint:** `POST /pending-sale/cancel`

**Request:**
```json
{
  "pending_id": 123,
  "reason": "Student unable to pay - insufficient funds"
}
```

**Response:**
```json
{
  "success": true,
  "pending_id": 123,
  "message": "Sale cancelled successfully",
  "logged": true
}
```

**Errors:**
- `400` - pending_id required
- `404` - Pending sale not found
- `400` - Sale already confirmed (cannot cancel)
- `400` - Sale already cancelled

---

### View Cancelled Transactions

**Endpoint:** `GET /cancelled-transactions`

**Response:**
```json
[
  {
    "id": 1,
    "pending_id": 123,
    "item_name": "Chicken Adobo",
    "amount": "45.00",
    "vendor_id": 5,
    "vendor_name": "Food Stall 1",
    "reason": "Student unable to pay",
    "cancelled_at": "2025-01-XX 10:30:00"
  }
]
```

---

## 🔍 Audit Trail

All cancellations are logged with:
- ✅ **Who cancelled it** (vendor info)
- ✅ **What was cancelled** (item name, amount)
- ✅ **When it was cancelled** (timestamp)
- ✅ **Why it was cancelled** (reason)

This provides a complete audit trail for:
- Financial reporting
- Dispute resolution
- System analytics
- Vendor accountability

---

## 🎨 User Flow

### Vendor Cancellation Flow:

```
1. Vendor clicks "Continue" on sale
   ↓
2. System creates pending sale
   ↓
3. Waiting for student to tap card
   ↓
4. Vendor clicks "CANCEL" button
   ↓
5. Prompt: "Why are you cancelling?"
   ↓
6. Vendor enters reason (optional)
   ↓
7. System logs cancellation
   ↓
8. Notification sent
   ↓
9. Sales list refreshes
   ↓
10. Done!
```

---

## 🔔 Real-Time Notifications

### Vendors See:
```
⚠️ Transaction cancelled: Chicken Adobo - Student unable to pay
```

### Students See:
```
⚠️ Transaction cancelled: Chicken Adobo - Cancelled by vendor
```

### Dashboard Updates:
- Sales list refreshes automatically
- Cancelled transactions appear in history
- Balance remains unchanged (no charge)

---

## 🛡️ Safety Features

### Prevented Scenarios:
- ❌ Cannot cancel confirmed transactions
- ❌ Cannot cancel already-cancelled transactions
- ❌ No balance change occurs
- ❌ No transaction record created

### What Happens on Cancel:
1. ✅ Pending sale marked as cancelled (`confirmed = 2`)
2. ✅ Entry added to `cancelled_transactions` table
3. ✅ Notification sent to relevant users
4. ✅ Sales list refreshes
5. ✅ No charge to student

---

## 📈 Use Cases

### Scenario 1: Insufficient Funds
- Student tries to purchase ₱50 item
- Only has ₱30 balance
- Vendor cancels with reason: "Insufficient funds"

### Scenario 2: Item Out of Stock
- Vendor sold last item
- Student already entered transaction
- Vendor cancels with reason: "Item out of stock"

### Scenario 3: Wrong Item Selected
- Vendor accidentally selected wrong item
- Student hasn't tapped yet
- Vendor cancels with reason: "Wrong item"

---

## 🧪 Testing

### Test 1: Cancel Transaction
1. Login as vendor
2. Start a sale transaction
3. Click "CANCEL" button
4. Enter reason: "Test cancellation"
5. Check console for success message
6. Verify no balance change for student

### Test 2: View Cancellation Log
1. Login as vendor
2. Make a test cancellation
3. Call API: `GET /cancelled-transactions`
4. Verify cancellation appears in list

### Test 3: Cannot Cancel Confirmed Sale
1. Login as vendor
2. Complete a sale (student taps)
3. Try to cancel it
4. Should receive error: "Sale already confirmed"

---

## 🗄️ Database Migration

**Run this SQL to add the table:**

```bash
mysql -u root -p canteen_db < migrations/add-cancelled-transactions-table.sql
```

**Or manually:**
```sql
USE canteen_db;

CREATE TABLE IF NOT EXISTS `cancelled_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pending_id` int NOT NULL,
  `item_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `vendor_id` int NOT NULL,
  `vendor_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancelled_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ct_pending` (`pending_id`),
  KEY `idx_ct_vendor` (`vendor_id`),
  KEY `idx_ct_date` (`cancelled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log of cancelled/failed transactions';
```

---

## 📝 Code Changes Summary

### Files Modified:
1. **`server.js`** - Added cancellation endpoints
2. **`public/js/app.js`** - Enhanced `posCancelSale()` function
3. **`public/js/notifications.js`** - Added cancellation notification handler
4. **`schema.sql`** - Added `cancelled_transactions` table

### Files Created:
1. **`migrations/add-cancelled-transactions-table.sql`** - Migration script
2. **`TRANSACTION-CANCELLATION-GUIDE.md`** - This guide

---

## ✅ Checklist

- [x] Backend cancellation endpoint created
- [x] Database table designed
- [x] Migration script created
- [x] Frontend cancel function enhanced
- [x] Reason prompt added
- [x] Logging implemented
- [x] Notifications added
- [x] Documentation written
- [ ] Database migration applied (pending)
- [ ] Testing completed (pending)

---

## 🎉 You're Ready!

**Next Steps:**
1. Run the database migration
2. Restart the server
3. Test the cancellation flow
4. Monitor the audit log

**Your vendors can now handle payment issues gracefully while maintaining a complete audit trail!** 🚀

