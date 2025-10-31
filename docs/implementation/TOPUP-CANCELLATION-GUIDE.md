# Top-Up Cancellation with Reason Tracking

## Overview
This feature allows booth staff to cancel top-up (reload) transactions with a mandatory reason, which is then logged for audit purposes.

## Features

### 1. **Cancellation Reason Modal**
When a staff member clicks "CANCEL" during a top-up transaction (Step 3 - Tap Card), they are presented with a modal dialog requiring them to provide a cancellation reason.

### 2. **Predefined Reasons**
Staff can select from common cancellation reasons:
- Customer changed mind
- Wrong amount entered
- Card not working
- Customer left
- System error
- Timeout - Customer took too long
- Other (custom reason)

### 3. **Custom Reason Input**
If "Other" is selected, staff must type a custom reason (max 200 characters).

### 4. **Mandatory Reason**
The cancellation cannot proceed without selecting or entering a reason - this ensures accountability.

### 5. **Automatic Logging**
All cancellations are logged with:
- Pending transaction ID
- Amount that was to be reloaded
- Cashier ID and name
- Cancellation reason
- Timestamp

### 6. **Database Tracking**
The `pending_reloads` table stores:
- `cancellation_reason` - The reason provided
- `cancelled_at` - When it was cancelled
- `confirmed = 2` - Marks as failed/cancelled

## Database Schema Changes

### New Columns in `pending_reloads` table:
```sql
cancellation_reason VARCHAR(255) DEFAULT NULL
cancelled_at TIMESTAMP NULL DEFAULT NULL
```

## Installation

### 1. Apply Database Migration
Run the migration script to add the new columns:

```powershell
.\apply-cancellation-migration.ps1
```

Or manually apply using MySQL:
```powershell
mysql -u root -p canteen_db < migrations\add-cancellation-reason.sql
```

### 2. Restart Server
```powershell
.\start-server.ps1
```

## Usage

### For Staff Members:

1. **Start a Top-Up**
   - Click "Quick Top-Up" button
   - Enter amount and confirm
   
2. **If You Need to Cancel**
   - During "TAP CARD NOW" screen, click "CANCEL" button
   - A modal will appear asking for cancellation reason
   
3. **Select Reason**
   - Choose from predefined reasons, OR
   - Select "Other" and type your own reason
   
4. **Confirm Cancellation**
   - Click "Confirm Cancellation" button
   - Transaction will be cancelled and logged

### For Administrators:

**View Cancellation Logs:**
The logs are stored in `logs/combined-[DATE].log` with this format:

```
2025-10-28 14:23:45 [WARN] Top-up transaction cancelled {
  "action": "TOPUP_CANCELLED",
  "pending_id": 123,
  "amount": 100.00,
  "cashier_id": 5,
  "cashier_name": "John Doe",
  "reason": "Customer changed mind",
  "timestamp": "2025-10-28T14:23:45.123Z"
}
```

**Query Cancelled Transactions:**
```sql
SELECT 
  id,
  amount,
  cancellation_reason,
  cancelled_at,
  cashier_id
FROM pending_reloads
WHERE confirmed = 2 
  AND cancellation_reason IS NOT NULL
ORDER BY cancelled_at DESC;
```

## API Endpoint

### POST `/pending-reload/cancel`
Cancels a pending reload with a reason.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "pending_id": 123,
  "reason": "Customer changed mind"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Top-up cancelled successfully",
  "reason": "Customer changed mind"
}
```

**Error Responses:**
- `400` - Missing pending_id or reason
- `404` - Pending reload not found
- `400` - Transaction already processed (cannot cancel)
- `500` - Server error

## Benefits

1. **Accountability** - Every cancellation is tracked with a reason
2. **Audit Trail** - Complete history of cancelled transactions
3. **Analytics** - Understand why transactions fail
4. **Compliance** - Meets audit requirements for financial transactions
5. **Improved Service** - Identify common issues (e.g., faulty cards)

## Log Analysis

### Find Most Common Cancellation Reasons:
```sql
SELECT 
  cancellation_reason,
  COUNT(*) as count,
  SUM(amount) as total_amount_lost
FROM pending_reloads
WHERE confirmed = 2 
  AND cancellation_reason IS NOT NULL
GROUP BY cancellation_reason
ORDER BY count DESC;
```

### Daily Cancellation Report:
```sql
SELECT 
  DATE(cancelled_at) as date,
  COUNT(*) as cancelled_count,
  SUM(amount) as cancelled_amount
FROM pending_reloads
WHERE confirmed = 2 
  AND cancelled_at IS NOT NULL
GROUP BY DATE(cancelled_at)
ORDER BY date DESC;
```

## Security

- Only authenticated staff members can cancel transactions
- Cancellation reason is mandatory (cannot be bypassed)
- All cancellations are logged with full context
- Timestamps use server time for consistency
- Cancelled transactions cannot be reversed

## Testing

1. **Test Normal Cancellation:**
   - Start a top-up
   - Click cancel
   - Select a predefined reason
   - Verify cancellation completes

2. **Test Custom Reason:**
   - Start a top-up
   - Click cancel
   - Select "Other"
   - Type custom reason
   - Verify cancellation completes

3. **Test Validation:**
   - Try to cancel without selecting reason (should show warning)
   - Try to select "Other" without typing (should show warning)

4. **Check Logs:**
   - Verify entry appears in `logs/combined-[DATE].log`
   - Verify database record has reason and timestamp

## Troubleshooting

**Cancellation Modal Not Appearing:**
- Check browser console for JavaScript errors
- Ensure Bootstrap modal library is loaded

**Cancellation Not Being Logged:**
- Check server logs for errors
- Verify logger is properly configured
- Check file permissions on logs directory

**Database Errors:**
- Verify migration was applied successfully
- Check that columns exist: `DESCRIBE pending_reloads;`
- Ensure MySQL user has UPDATE permissions

## Future Enhancements

Potential improvements:
- Dashboard showing cancellation statistics
- Alert when cancellation rate is high
- Integration with performance metrics
- Export cancellation reports to CSV
- Notification to admin on unusual cancellation patterns
