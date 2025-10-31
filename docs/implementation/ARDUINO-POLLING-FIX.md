# 🔧 Arduino Polling Failures - Fixed!

## 🔍 Issues Identified

### Problem Reports
Your Arduino serial monitor was showing failures for:
- ❌ **Reload polling** sometimes failing
- ❌ **Sale polling** sometimes failing  
- ❌ **RFID link polling** sometimes failing

### Root Causes Found

#### 1. **No Timeout/Expiry for Sales & Reloads** ⏰
```
Problem:
- pending_sales and pending_reloads had NO expiry logic
- Unlike rfid/link which expires after 2 minutes
- Old pending records stayed forever with confirmed=0
- Arduino kept polling stale records that would never complete
```

#### 2. **No Automatic Cleanup** 🗑️
```
Problem:
- Old pending records accumulated in database
- Never deleted even after hours/days
- Database grew larger over time
- Query performance degraded
```

#### 3. **Missing Data in Status Response** 📊
```
Problem:
- Status endpoints didn't return student name
- Status endpoints didn't return new balance
- UI couldn't show proper success details
```

#### 4. **Poor Error Visibility** 🔍
```
Problem:
- No logging when confirm operations failed
- Hard to debug Arduino issues
- Couldn't see why transactions failed
```

---

## ✅ Solutions Implemented

### 1. **Added 5-Minute Timeout** ⏰

Both `pending-sale/status` and `pending-reload/status` now:
- Check if record is older than 5 minutes
- Auto-mark as `confirmed=2` (failed) if expired
- Return `expired: true` flag
- Arduino stops polling and shows timeout

```javascript
// Check if expired (5 minutes timeout)
const TIMEOUT_MS = 5 * 60 * 1000;
const expired = new Date(row.created_at).getTime() < (Date.now() - TIMEOUT_MS);

// Auto-mark as failed if expired and not yet processed
if (expired && row.confirmed === 0) {
  await pool.query('UPDATE pending_sales SET confirmed = 2 WHERE id = ?', [req.params.id]);
  return res.json({
    confirmed: false,
    failed: true,
    expired: true
  });
}
```

### 2. **Automatic Cleanup Job** 🗑️

New background job runs every 10 minutes:
- Deletes pending_sales older than 10 minutes
- Deletes pending_reloads older than 10 minutes
- Deletes pending_rfid_links older than TTL + 1 minute
- Logs how many records were cleaned up

```javascript
async function cleanupPendingRecords() {
  // Delete old pending sales
  await pool.query(
    `DELETE FROM pending_sales 
     WHERE created_at < (NOW() - INTERVAL ? MINUTE)`,
    [10]
  );
  
  // Delete old pending reloads
  await pool.query(
    `DELETE FROM pending_reloads 
     WHERE created_at < (NOW() - INTERVAL ? MINUTE)`,
    [10]
  );
  
  // Delete old pending RFID links
  await pool.query(
    `DELETE FROM pending_rfid_links 
     WHERE created_at < (NOW() - INTERVAL ? SECOND)`,
    [RFID_LINK_TTL_SEC + 60]
  );
}

// Run every 10 minutes
setInterval(cleanupPendingRecords, 10 * 60 * 1000);
```

### 3. **Enhanced Status Responses** 📊

Now includes student info on success:
```javascript
res.json({
  confirmed: row.confirmed === 1,
  failed: row.confirmed === 2,
  expired: expired && row.confirmed === 0,
  amount: row.amount,
  student_name: row.student_name || null,  // ✅ NEW
  new_balance: row.new_balance || null      // ✅ NEW
});
```

### 4. **Better Error Logging** 🔍

All confirm endpoints now log:
```javascript
console.log(`[Sale Confirm] Attempt: pending_id=${pending_id}, uid=${uid}`);
console.log(`[Reload Confirm] Attempt: pending_id=${pending_id}, uid=${uid}, device=${device_id}`);
console.log(`[Link Confirm] Attempt: pending_id=${pending_id}, uid=${uid}, device=${device_id}`);

// On failure:
console.log(`[Sale Confirm] FAILED: Sale not found or already processed (id=${pending_id})`);
```

---

## 📊 How It Works Now

### Normal Transaction Flow ✅
```
1. Staff creates reload → pending_id=123, confirmed=0, created_at=NOW
2. Arduino polls /pending-reload/status/123
   - Within 5 min, confirmed=0 → Keep polling
3. Student taps card → Arduino POST /pending-reload/confirm
4. Server sets confirmed=1 → Transaction complete
5. Arduino polls again → Gets confirmed=true, stops polling
6. After 10 min → Cleanup job deletes the record
```

### Timeout Scenario (Student Never Taps) ⏰
```
1. Staff creates reload → pending_id=123, confirmed=0, created_at=NOW
2. Arduino polls /pending-reload/status/123
   - Within 5 min, confirmed=0 → Keep polling
3. 5 minutes pass, student never tapped
4. Arduino polls again → Server sees expired
5. Server auto-sets confirmed=2, returns failed=true, expired=true
6. Arduino stops polling, shows "Transaction expired"
7. After 10 min → Cleanup job deletes the record
```

### Stale Record Scenario (Arduino Offline) 🗑️
```
1. Reload created but Arduino went offline
2. Record sits in DB with confirmed=0
3. After 10 minutes → Cleanup job automatically deletes it
4. Database stays clean!
```

---

## 🎯 Benefits

### ✅ For Arduino
- **No more infinite polling** on stale records
- **Clear timeout signals** (5 min limit)
- **Better error messages** to display
- **Faster response** due to database cleanup

### ✅ For Database
- **Automatic cleanup** of old records
- **Better performance** (smaller tables)
- **No manual intervention** needed
- **Logs cleanup activity** for monitoring

### ✅ For Users (Staff/Vendors)
- **Timeouts show clearly** (not stuck forever)
- **Success shows student info** (name, balance)
- **System self-heals** from errors

### ✅ For Debugging
- **Console logs** show all attempts
- **Failure reasons** are logged
- **Easy to trace** issues in logs
- **Device ID** logged for multi-device setups

---

## 🔍 Monitoring Logs

### What You'll See Now

#### Successful Transaction
```
[Reload Confirm] Attempt: pending_id=123, uid=ABC123, device=esp32-counter1
(No error = success)
```

#### Failed Transaction
```
[Reload Confirm] Attempt: pending_id=456, uid=XYZ789, device=esp32-counter1
[Reload Confirm] FAILED: Reload not found or already processed (id=456)
```

#### Cleanup Activity
```
[Cleanup] Removed 5 old pending records (sales: 2, reloads: 2, links: 1)
```

#### Polling Timeout
```
Status check for pending_id=789 returned: { failed: true, expired: true }
```

---

## ⏱️ Timeout Configuration

### Current Settings
- **Sale/Reload Timeout**: 5 minutes
- **RFID Link Timeout**: 2 minutes (RFID_LINK_TTL_SEC)
- **Cleanup Age**: 10 minutes
- **Cleanup Frequency**: Every 10 minutes

### Why These Values?

**5 minutes for transactions:**
- Enough time for student to find card
- Not so long that system feels stuck
- Prevents indefinite waiting

**10 minutes for cleanup:**
- Gives time for retries if needed
- Runs frequently enough to keep DB clean
- Low overhead (only deletes old records)

---

## 🧪 Testing

### Test Timeout Behavior
```bash
# 1. Create a reload/sale via UI
# 2. Don't tap a card
# 3. Wait 5+ minutes
# 4. Check Arduino serial monitor
# Expected: Should show "Transaction expired" or similar
```

### Test Cleanup Job
```bash
# 1. Create several test transactions
# 2. Wait 10+ minutes
# 3. Check server console logs
# Expected: See "[Cleanup] Removed X old pending records..."
```

### Test Normal Flow
```bash
# 1. Create reload/sale via UI
# 2. Tap card within 5 minutes
# 3. Check transaction completes
# Expected: Success, shows student name & balance
```

---

## 📝 Database Schema Notes

### Required Columns (Already Exist)
```sql
-- pending_sales table
CREATE TABLE pending_sales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT,
  item_name VARCHAR(255),
  amount DECIMAL(10,2),
  confirmed TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- ✅ IMPORTANT
);

-- pending_reloads table
CREATE TABLE pending_reloads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  amount DECIMAL(10,2),
  cashier_id INT,
  confirmed TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- ✅ IMPORTANT
);

-- pending_rfid_links table
CREATE TABLE pending_rfid_links (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  uid VARCHAR(50),
  confirmed TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- ✅ IMPORTANT
);
```

The `created_at` column is essential for:
- Timeout detection
- Cleanup job
- Expiry logic

---

## 🚨 Troubleshooting

### Arduino Still Shows Failures?

1. **Check Server Logs**
   ```bash
   # Look for these patterns:
   [Sale Confirm] FAILED: ...
   [Reload Confirm] FAILED: ...
   [Link Confirm] FAILED: ...
   ```

2. **Check Database**
   ```sql
   -- See pending records
   SELECT * FROM pending_sales WHERE confirmed = 0;
   SELECT * FROM pending_reloads WHERE confirmed = 0;
   
   -- See expired records
   SELECT *, TIMESTAMPDIFF(MINUTE, created_at, NOW()) as age_minutes 
   FROM pending_sales 
   WHERE confirmed = 0 AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) > 5;
   ```

3. **Check Arduino Code**
   - Make sure it handles `expired: true` response
   - Make sure it stops polling after timeout
   - Make sure it sends correct pending_id

### Cleanup Not Running?

```bash
# Check server console logs
# Should see on startup:
[Cleanup] Scheduled cleanup job every 10 minutes

# Every 10 minutes (if records were deleted):
[Cleanup] Removed X old pending records...
```

### Status Returns Wrong Data?

The status endpoints now use JOIN queries to get student info.
If student_name or new_balance is null:
- It means transaction hasn't completed yet (confirmed != 1)
- Or the JOIN couldn't find matching user/transaction

---

## 📊 Performance Impact

### Before Fix
```
- Pending records never deleted
- Database grows indefinitely
- Queries slow down over time
- Arduino polls stale records forever
```

### After Fix
```
✅ Old records deleted every 10 minutes
✅ Database stays small and fast
✅ Arduino stops polling after 5 min timeout
✅ System self-heals automatically
```

---

## 🎉 Summary

### What Was Fixed
✅ Added 5-minute timeout for sales/reloads  
✅ Auto-cleanup job runs every 10 minutes  
✅ Status responses include student info  
✅ Better error logging for debugging  
✅ Expired records auto-marked as failed  
✅ Database stays clean automatically  

### Expected Results
- ✅ **Fewer polling failures** (expired records handled)
- ✅ **Clearer error messages** (logged and visible)
- ✅ **Better performance** (automatic cleanup)
- ✅ **Easier debugging** (comprehensive logs)

---

## 🔄 Next Steps

1. **Restart the server** to activate the cleanup job:
   ```bash
   npm start
   ```

2. **Monitor logs** for the next few transactions:
   ```bash
   # Look for:
   [Sale Confirm] Attempt: ...
   [Reload Confirm] Attempt: ...
   [Cleanup] Removed X old pending records...
   ```

3. **Test timeout behavior**:
   - Create a reload but don't tap card
   - Wait 5+ minutes
   - See if Arduino properly handles timeout

4. **Check Arduino serial monitor**:
   - Should see clearer error messages
   - Should stop polling after timeout
   - Should not poll stale records

---

**Git Commit:**
```
ce4a893 - Fix polling failures: add timeouts, auto-cleanup, and better error logging
```

**Status**: ✅ **Complete - Polling System Hardened!**

Your Arduino should now have much more reliable polling with proper timeout handling and automatic cleanup! 🎉

