# RFID Linking System - Deployment Checklist

## 📋 Pre-Deployment

### ✅ Code Review
- [x] Backend API endpoints implemented
- [x] Frontend UI components created
- [x] JavaScript functions added
- [x] Database migration prepared
- [x] Error handling added
- [x] Authentication checks in place
- [x] No syntax errors (verified)

### ✅ Documentation
- [x] Technical guide (RFID-LINKING-GUIDE.md)
- [x] Quick start guide (RFID-LINKING-QUICK-START.md)
- [x] Implementation summary (RFID-LINKING-SUMMARY.md)
- [x] Visual flowcharts (RFID-LINKING-FLOWCHARTS.md)
- [x] This deployment checklist

## 🚀 Deployment Steps

### Step 1: Database Migration
```powershell
# Open MySQL Command Line or Workbench
mysql -u root -p
```

```sql
-- Select the database
USE canteen_db;

-- Run the migration
SOURCE migrations/add_pending_rfid_scans.sql;

-- Verify tables were created
SHOW TABLES LIKE 'pending_rfid_scans';
DESCRIBE pending_rfid_scans;

-- Verify user table columns (optional)
DESCRIBE users;
```

**Expected Output:**
- ✅ Table `pending_rfid_scans` created
- ✅ Columns: scan_id, uid, device_id, link_session_id, consumed, scanned_at
- ✅ Indexes created on uid, consumed, scanned_at

**Verification:**
```sql
-- Should return 0 rows (empty table)
SELECT COUNT(*) FROM pending_rfid_scans;

-- Check if student_number and course columns exist
SHOW COLUMNS FROM users WHERE Field IN ('student_number', 'course');
```

### Step 2: Server Restart
```powershell
# Stop the current server (if running)
# Press Ctrl+C in the terminal where server is running

# Navigate to project directory
cd c:\MyProj\canteen-server

# Start the server
node server.js
```

**Expected Output:**
```
[timestamp] info: Server listening on port 3000
[timestamp] info: Database connected
```

**Verification:**
```powershell
# Test server health
curl http://localhost:3000/health
```

### Step 3: Verify API Endpoints

#### Test 1: Search Users (requires staff login)
```powershell
# First login to get token
$body = @{
    username = "staff_username"
    password = "staff_password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.token

# Test search endpoint
Invoke-RestMethod -Uri "http://localhost:3000/rfid/search-users?q=&onlyNoRfid=false" -Headers @{Authorization="Bearer $token"}
```

**Expected**: List of students returned

#### Test 2: Device Scan Endpoint
```powershell
# Test from device perspective (no auth)
$scan = @{
    uid = "TEST12345678"
    device_id = "NEUTap-Test"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/rfid/scan" -Method POST -Body $scan -ContentType "application/json"
```

**Expected**: `{"success": true, "uid": "TEST12345678"}`

#### Test 3: Pending Scan Check
```powershell
# Use staff token from Test 1
Invoke-RestMethod -Uri "http://localhost:3000/rfid/pending?userId=1" -Headers @{Authorization="Bearer $token"}
```

**Expected**: `{"status": "waiting"}` (if no recent scan)

### Step 4: Frontend Verification

1. **Open Browser**: Navigate to `http://localhost:3000`

2. **Login as Staff**:
   - Username: [your staff username]
   - Password: [your staff password]

3. **Check Dashboard**:
   - ✅ "Link RFID" button is visible (yellow button)
   - ✅ Button is next to "Quick Top-Up"

4. **Open RFID Linking Page**:
   - Click "Link RFID" button
   - ✅ Page loads with search interface
   - ✅ "Back to Dashboard" button visible
   - ✅ Search input and filter toggle present

5. **Test Search**:
   - Type any search term
   - Press Enter or click Search
   - ✅ Results table populates
   - ✅ Status badges show correctly
   - ✅ Action buttons appear

6. **Test Filter**:
   - Check "Only show users without RFID"
   - ✅ Results update automatically
   - ✅ Only unlinked users shown

### Step 5: End-to-End Test

**Full Linking Flow:**

1. **Prepare Test Card**:
   - Have an RFID card ready
   - Ensure ESP32 is powered on and connected

2. **Find Test User**:
   - Search for a user without RFID
   - Note their name and student number

3. **Start Linking**:
   - Click "Link RFID" button for that user
   - ✅ Modal opens
   - ✅ Shows "Waiting for card tap..."
   - ✅ Spinner is visible
   - ✅ User info displays correctly

4. **Tap Card**:
   - Have user tap card on NEUTap reader
   - ✅ Within 2-5 seconds, success message appears
   - ✅ RFID UID is displayed
   - ✅ "Close" button enabled

5. **Verify**:
   - Close modal
   - ✅ Table auto-refreshes (after 2 seconds)
   - ✅ User status changed to "RFID Linked"
   - ✅ "Link RFID" button changed to "Unlink"

6. **Test Database**:
```sql
-- Check if RFID was linked
SELECT user_id, name, rfid_uid 
FROM users 
WHERE name = 'Test User Name';
```
   - ✅ rfid_uid is populated

7. **Check Logs**:
```powershell
# Check server logs
Get-Content logs\app.log -Tail 20
```
   - ✅ "RFID successfully linked" message present

### Step 6: Error Testing

**Test 1: Duplicate Card**

1. Try to link the same card to a different user
2. ✅ Error message: "This card is already linked to [Name]"
3. ✅ Modal shows error state
4. ✅ "Retry" button appears

**Test 2: Timeout**

1. Start linking process
2. Don't tap any card
3. Wait 60 seconds
4. ✅ Timeout message appears
5. ✅ "Retry" button enabled

**Test 3: Cancel**

1. Start linking process
2. Click "Cancel" before tapping
3. ✅ Modal closes
4. ✅ Polling stops (check Network tab in DevTools)

**Test 4: Unlink**

1. Find a user with RFID
2. Click "Unlink" button
3. ✅ Confirmation dialog appears
4. Confirm
5. ✅ RFID removed from user
6. ✅ Table refreshes with "No RFID" status

## 🔍 Post-Deployment Verification

### Database Check
```sql
-- Check pending scans table
SELECT * FROM pending_rfid_scans ORDER BY scanned_at DESC LIMIT 10;

-- Check linked users
SELECT 
  COUNT(*) as total_students,
  SUM(CASE WHEN rfid_uid IS NOT NULL THEN 1 ELSE 0 END) as linked,
  SUM(CASE WHEN rfid_uid IS NULL THEN 1 ELSE 0 END) as not_linked
FROM users 
WHERE role = 'student';

-- Check for recent linking activity
SELECT u.name, u.rfid_uid, u.student_number
FROM users u
WHERE u.rfid_uid IS NOT NULL
  AND u.role = 'student'
ORDER BY u.user_id DESC
LIMIT 10;
```

### Log Verification
```powershell
# Check for any errors
Get-Content logs\app.log | Select-String "error|ERROR" -Context 2

# Check for linking activity
Get-Content logs\app.log | Select-String "RFID.*link" -Context 1
```

### Browser Console Check
1. Open DevTools (F12)
2. Go to Console tab
3. ✅ No red errors
4. ✅ No failed network requests

### Network Monitoring
1. Open DevTools → Network tab
2. Start linking process
3. ✅ See polling requests to `/rfid/pending` every 500ms
4. ✅ See POST to `/rfid/scan` when card tapped
5. ✅ All requests return 200 OK (or expected status)

## 📊 Performance Verification

### Response Times
- Search users: < 200ms ✅
- Start linking: < 50ms ✅
- Poll pending: < 100ms ✅
- Complete link: < 500ms ✅

### Polling Efficiency
```javascript
// In browser console, check active polling:
console.log('Poll interval:', rfidLinkingPollInterval);
console.log('Linking active:', rfidLinkingActive);
```

### Memory Check
```powershell
# Check Node.js memory usage
Get-Process node | Select-Object Name, PM, VM
```
- ✅ Memory stable (no leaks)

## 🔒 Security Verification

### Authentication Tests
1. **No Auth**:
```powershell
# Should fail with 401
Invoke-RestMethod -Uri "http://localhost:3000/rfid/search-users"
```
   - ✅ Returns 401 Unauthorized

2. **Student Auth** (should fail):
```powershell
# Login as student, try to access
Invoke-RestMethod -Uri "http://localhost:3000/rfid/search-users" -Headers @{Authorization="Bearer $studentToken"}
```
   - ✅ Returns 403 Forbidden

3. **Staff Auth** (should succeed):
```powershell
# Already tested in Step 3
```
   - ✅ Returns 200 OK with data

### Input Validation
1. **SQL Injection Test**:
   - Search: `'; DROP TABLE users; --`
   - ✅ No errors, search returns safely

2. **XSS Test**:
   - Search: `<script>alert('xss')</script>`
   - ✅ Rendered as text, not executed

## 📱 Mobile Testing

1. **Access from Phone**:
   - Navigate to `http://[server-ip]:3000`
   - Login as staff
   - ✅ Layout is responsive
   - ✅ Buttons are touch-friendly
   - ✅ Modal works on mobile

2. **Tablet Testing**:
   - Same as mobile
   - ✅ Table columns visible
   - ✅ Search works with on-screen keyboard

## 🎓 User Training Checklist

### Staff Training
- [ ] Show how to access RFID Linking page
- [ ] Demonstrate search functionality
- [ ] Explain filter toggle purpose
- [ ] Walk through linking process
- [ ] Show error handling (duplicate card)
- [ ] Demonstrate unlinking process
- [ ] Explain timeout scenario

### Documentation Provided
- [ ] Quick Start Guide shared
- [ ] Visual flowchart shown
- [ ] Common errors document provided
- [ ] Contact person for issues identified

## 🚨 Rollback Plan

If issues occur, rollback steps:

### 1. Disable Feature
```sql
-- Temporarily remove staff access (optional)
-- This is drastic, only if critical issues
```

### 2. Revert Code
```powershell
# Use git to revert (if using version control)
git revert <commit-hash>

# Or manually remove:
# - RFID linking page from index.html
# - JavaScript functions from app.js
# - API endpoints from server.js
```

### 3. Revert Database
```sql
-- Only if necessary
DROP TABLE pending_rfid_scans;

-- Remove columns (optional, won't break existing system)
ALTER TABLE users DROP COLUMN student_number;
ALTER TABLE users DROP COLUMN course;
```

## 📞 Support Contacts

### During Deployment
- Developer: [Your contact]
- Database Admin: [DBA contact]
- IT Support: [IT support]

### Post-Deployment
- Issues: Check RFID-LINKING-GUIDE.md Troubleshooting section
- Bugs: Log in issue tracker
- Questions: Refer to Quick Start Guide

## ✅ Sign-Off Checklist

### Technical Lead
- [ ] Code reviewed and approved
- [ ] Tests passed
- [ ] Documentation complete
- [ ] Rollback plan understood

### Database Admin
- [ ] Migration script reviewed
- [ ] Backup taken before migration
- [ ] Migration executed successfully
- [ ] Indexes verified

### QA Team
- [ ] End-to-end tests passed
- [ ] Error scenarios tested
- [ ] Performance acceptable
- [ ] Security checks passed

### System Admin
- [ ] Server restarted successfully
- [ ] Logs monitored
- [ ] No errors in production
- [ ] Backup systems verified

### Product Owner
- [ ] Feature meets requirements
- [ ] User experience approved
- [ ] Training materials ready
- [ ] Ready for staff use

## 🎉 Go-Live

**Date**: _______________  
**Time**: _______________  
**Deployed By**: _______________  
**Verified By**: _______________  

**Status**: 🟢 LIVE | 🟡 ISSUES | 🔴 ROLLED BACK

**Notes**:
_________________________________________________
_________________________________________________
_________________________________________________

---

## 📅 Post-Deployment Monitoring

### Day 1
- [ ] Monitor server logs hourly
- [ ] Check linking success rate
- [ ] Verify no performance degradation
- [ ] Address any staff questions

### Week 1
- [ ] Gather staff feedback
- [ ] Monitor error rates
- [ ] Check database growth
- [ ] Review linking statistics

### Month 1
- [ ] Analyze usage patterns
- [ ] Identify improvement opportunities
- [ ] Plan next iteration features
- [ ] Update documentation if needed

---

**Deployment Checklist Version**: 1.0  
**Last Updated**: November 23, 2025  
**Status**: Ready for Production ✅
