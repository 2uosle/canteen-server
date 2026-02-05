# RFID Linking System - Implementation Guide

## Overview

A complete RFID card linking system that allows staff to link RFID cards to student accounts through a user-friendly interface. The system follows a tap-to-link workflow without manual ID entry.

## Features

### User Experience
- **Search & Filter**: Search students by name or student number
- **Filter by Status**: Show only users without RFID cards
- **One-Click Linking**: Click "Link RFID" → Student taps card → Done
- **Real-time Feedback**: Live polling for card taps with visual status updates
- **Error Handling**: Clear messages for duplicate cards or timeouts
- **Unlinking**: Staff can unlink cards (lost card replacement)

### Security & Validation
- **Duplicate Prevention**: Checks if RFID is already linked to another user
- **Staff/Admin Only**: Only authenticated staff can access linking functions
- **60-Second Timeout**: Automatic timeout if no card is detected
- **Transaction Safety**: Uses database transactions for atomic operations

## Database Schema

### New Table: `pending_rfid_scans`

```sql
CREATE TABLE `pending_rfid_scans` (
  `scan_id` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(32) NOT NULL,
  `device_id` varchar(100) DEFAULT NULL,
  `link_session_id` int DEFAULT NULL,
  `consumed` tinyint(1) NOT NULL DEFAULT '0',
  `scanned_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`scan_id`),
  KEY `idx_uid_consumed` (`uid`, `consumed`),
  KEY `idx_scanned_at` (`scanned_at`)
);
```

### Enhanced `users` Table

```sql
ALTER TABLE `users` 
  ADD COLUMN `student_number` varchar(50) DEFAULT NULL,
  ADD COLUMN `course` varchar(100) DEFAULT NULL,
  ADD UNIQUE KEY `idx_student_number` (`student_number`);
```

## API Endpoints

### 1. Search Users
**GET** `/rfid/search-users`

Query parameters:
- `q`: Search term (matches name, username, student_number)
- `onlyNoRfid`: Filter users without RFID (`true`/`false`)

Response:
```json
{
  "success": true,
  "users": [
    {
      "user_id": 123,
      "name": "Juan Dela Cruz",
      "username": "jdelacruz",
      "student_number": "2023-0001",
      "course": "BSIE",
      "has_rfid": false,
      "rfid_uid": null,
      "balance": 100.00
    }
  ]
}
```

### 2. Receive RFID Scan from Device
**POST** `/rfid/scan`

Body:
```json
{
  "uid": "AB12CD34",
  "device_id": "NEUTap-01"
}
```

Response:
```json
{
  "success": true,
  "uid": "AB12CD34",
  "message": "Scan stored, awaiting link confirmation"
}
```

### 3. Poll for Pending Scan & Link
**GET** `/rfid/pending?userId=123`

Responses:

**Waiting (no scan yet):**
```json
{
  "status": "waiting"
}
```

**Success (card linked):**
```json
{
  "status": "success",
  "uid": "AB12CD34",
  "user": {
    "user_id": 123,
    "name": "Juan Dela Cruz",
    "student_number": "2023-0001",
    "rfid_uid": "AB12CD34"
  }
}
```

**Error (duplicate card):**
```json
{
  "status": "error",
  "message": "This card is already linked to Maria Santos (2023-0002)"
}
```

### 4. Unlink RFID
**POST** `/rfid/unlink`

Body:
```json
{
  "user_id": 123
}
```

## Frontend Components

### Page Structure
- **Search Bar**: Text input with Enter key support
- **Filter Toggle**: Checkbox to show only users without RFID
- **Results Table**: Displays students with their linking status
- **Link Modal**: Real-time feedback during the linking process

### User Flow

1. **Staff opens RFID Linking page** (`Link RFID` button on dashboard)
2. **Search for student** (by name or student number)
3. **Click "Link RFID"** on a user without RFID
4. **Modal opens** showing "Waiting for card tap..."
5. **Student taps card** on NEUTap reader
6. **ESP32 sends scan** to `/rfid/scan` endpoint
7. **Frontend polls** `/rfid/pending` every 500ms
8. **Backend validates** and links the card
9. **Success message** displays with RFID UID
10. **Table updates** automatically

### JavaScript Functions

```javascript
// Navigation
showRfidLinking()      // Show RFID linking page
hideRfidLinking()      // Back to dashboard

// Search
searchRfidUsers()      // Search with current filters

// Linking Process
startRfidLink(userId, userName, studentNo)  // Open modal, start polling
startRfidPolling()     // Poll /rfid/pending every 500ms
stopRfidPolling()      // Stop polling
cancelRfidLink()       // Cancel and close modal
retryRfidLink()        // Retry after error/timeout

// Unlinking
confirmUnlinkRfid(userId, userName)  // Confirm before unlinking
unlinkRfid(userId)     // Remove RFID from user

// Status Handlers
handleRfidSuccess(data)    // Show success message
handleRfidError(message)   // Show error message
handleRfidTimeout()        // Show timeout message
```

## ESP32 Integration

### Device Workflow

When a card is tapped on the PN532 reader:

```cpp
// Pseudo-code for Arduino/ESP32
void onCardDetected(String uid) {
  // Send RFID scan to server
  HTTPClient http;
  http.begin(serverUrl + "/rfid/scan");
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"uid\":\"" + uid + "\",\"device_id\":\"NEUTap-01\"}";
  int httpCode = http.POST(payload);
  
  if (httpCode == 200) {
    Serial.println("Scan sent successfully");
  }
  
  http.end();
}
```

### No Device-Side Changes Needed

The device doesn't need to know about linking mode. It simply:
1. Reads any card tap
2. Sends the UID to `/rfid/scan`
3. Server handles whether it's for linking, payment, or balance check

## Setup Instructions

### 1. Run Database Migration

```bash
# In MySQL Workbench or CLI
mysql -u root -p canteen_db < migrations/add_pending_rfid_scans.sql
```

### 2. Restart Server

```bash
# Stop current server (Ctrl+C)
# Start again
node server.js
```

### 3. Access RFID Linking

1. Login as **Staff** or **Admin**
2. Click the **"Link RFID"** button (yellow button next to Quick Top-Up)
3. Search for students and start linking!

## Timeout & Cleanup

### Automatic Timeout
- Frontend stops polling after **60 seconds** if no card is detected
- User can retry or cancel

### Database Cleanup
Clean up old scans periodically:

```sql
-- Delete scans older than 1 hour
DELETE FROM pending_rfid_scans 
WHERE scanned_at < (NOW() - INTERVAL 1 HOUR);
```

Consider adding this to a cron job or scheduled task.

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Card already linked to X" | RFID is in use by another user | Use a different card or unlink the existing user first |
| "No card detected" | Timeout (60s) with no tap | Retry and ensure card is tapped properly |
| "Failed to search users" | Server error or network issue | Check server logs, verify authentication |
| "HTTP 403" | Not authenticated as staff/admin | Re-login as staff |

### Debug Mode

Check browser console for:
```javascript
// Polling status
console.log('Polling for user:', rfidLinkingUserId);

// Scan received
console.log('Scan response:', data);

// Errors
console.error('Linking error:', err);
```

## Testing Checklist

- [ ] Search returns correct students
- [ ] Filter "Only show users without RFID" works
- [ ] Link RFID modal opens with correct user info
- [ ] ESP32 scan is received and stored
- [ ] Frontend polling detects the scan
- [ ] Card is successfully linked to user
- [ ] Duplicate card shows error message
- [ ] Timeout triggers after 60 seconds
- [ ] Retry button works after error/timeout
- [ ] Unlink removes RFID from user
- [ ] Table refreshes after successful link/unlink

## Code Files Modified

### Backend
- `server.js`: Added 3 new endpoints (search-users, scan, pending)
- `migrations/add_pending_rfid_scans.sql`: Database schema

### Frontend
- `public/index.html`: Added RFID Linking page + modal
- `public/js/app.js`: Added ~250 lines of linking logic

## Future Enhancements

1. **Bulk Linking**: Link multiple students in sequence
2. **Link History**: Track who linked which cards and when
3. **Card Replacement**: Automatically unlink old card when linking new one
4. **QR Code Backup**: Alternative authentication method
5. **Mobile App**: Dedicated mobile interface for linking
6. **Analytics**: Dashboard showing linking statistics

## Support

For issues or questions:
1. Check server logs: `logs/` directory
2. Check browser console for frontend errors
3. Verify database connection and schema
4. Ensure ESP32 device is online and configured correctly

---

**Version**: 1.0  
**Date**: November 23, 2025  
**Author**: NEUTap Canteen System
