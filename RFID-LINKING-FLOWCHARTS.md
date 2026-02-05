# RFID Linking - Visual Workflows

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEUTap RFID Linking System                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Staff Interface  →  Backend API  →  Database  ←  ESP32 Device  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📱 User Interface Flow

### Dashboard → RFID Linking Page

```
┌────────────────────────────────────┐
│     Staff Dashboard                │
│                                    │
│  [Quick Top-Up]  [Link RFID]      │  ← Click "Link RFID"
│                                    │
│  Reload Performance Dashboard      │
│  └─ Charts & Statistics            │
└────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────┐
│   RFID Card Linking Page           │
│                                    │
│  [◀ Back to Dashboard]             │
│                                    │
│  Search: [____________] [Search]   │
│  ☐ Only show users without RFID    │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Student No. │ Name │ Course  │ │
│  ├──────────────────────────────┤ │
│  │ 2023-0001  │ Juan │ BSIE    │ │
│  │ Status: No RFID [Link RFID] │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

## 🔄 Complete Linking Flow

### Step-by-Step Sequence Diagram

```
Staff                Frontend              Backend              Database         ESP32
  │                     │                     │                    │              │
  │ 1. Click           │                     │                    │              │
  │ "Link RFID"        │                     │                    │              │
  │─────────────────>  │                     │                    │              │
  │                     │                     │                    │              │
  │                     │ 2. Open Modal       │                    │              │
  │                     │    "Waiting..."     │                    │              │
  │                     │                     │                    │              │
  │                     │ 3. Start Polling    │                    │              │
  │                     │ (every 500ms)       │                    │              │
  │                     │──────────────────>  │                    │              │
  │                     │                     │ 4. Check for scan  │              │
  │                     │                     │ GET /rfid/pending  │              │
  │                     │                     │──────────────────> │              │
  │                     │                     │ ◀──No scan yet     │              │
  │                     │ ◀──{waiting}────────│                    │              │
  │                     │                     │                    │              │
  │ 5. Ask student      │                     │                    │              │
  │    to tap card      │                     │                    │              │
  │─────────────────>   │                     │                    │              │
  │                     │                     │                    │              │
Student taps card ─────────────────────────────────────────────────────────────> │
  │                     │                     │                    │              │
  │                     │                     │ 6. Receive scan    │              │
  │                     │                     │ ◀──POST /rfid/scan─┘              │
  │                     │                     │    {uid: "AB..."}                 │
  │                     │                     │                                   │
  │                     │                     │ 7. Store scan                     │
  │                     │                     │──────────────────>                │
  │                     │                     │ INSERT INTO                       │
  │                     │                     │ pending_rfid_scans                │
  │                     │                     │                                   │
  │                     │ 8. Poll (next cycle)│                                   │
  │                     │──────────────────>  │                                   │
  │                     │                     │ 9. Find scan                      │
  │                     │                     │──────────────────>                │
  │                     │                     │ SELECT * FROM                     │
  │                     │                     │ pending_rfid_scans                │
  │                     │                     │ ◀──Scan found!                    │
  │                     │                     │                                   │
  │                     │                     │ 10. Validate                      │
  │                     │                     │     (Check duplicate)             │
  │                     │                     │──────────────────>                │
  │                     │                     │ SELECT * FROM users               │
  │                     │                     │ WHERE rfid_uid=?                  │
  │                     │                     │ ◀──NULL (OK!)                     │
  │                     │                     │                                   │
  │                     │                     │ 11. BEGIN TRANSACTION             │
  │                     │                     │──────────────────>                │
  │                     │                     │ UPDATE users                      │
  │                     │                     │ SET rfid_uid='AB...'              │
  │                     │                     │                                   │
  │                     │                     │ UPDATE pending_rfid_scans         │
  │                     │                     │ SET consumed=1                    │
  │                     │                     │ COMMIT                            │
  │                     │                     │                                   │
  │                     │ 12. Success!        │                                   │
  │                     │ ◀──{status:"success",                                   │
  │                     │     uid:"AB...",                                        │
  │                     │     user:{...}}     │                                   │
  │                     │                                                         │
  │                     │ 13. Show Success    │                                   │
  │                     │     Message         │                                   │
  │ ◀──"Card linked!"───┤                                                         │
  │                     │                                                         │
  │                     │ 14. Refresh Table                                       │
  │                     │     (auto after 2s) │                                   │
  │                     │                                                         │
```

## ❌ Error Flow: Duplicate Card

```
Frontend              Backend              Database
   │                     │                    │
   │ Poll                │                    │
   │──────────────────>  │                    │
   │                     │ Find scan          │
   │                     │──────────────────> │
   │                     │ ◀──Scan found      │
   │                     │                    │
   │                     │ Check duplicate    │
   │                     │──────────────────> │
   │                     │ SELECT * FROM users│
   │                     │ WHERE rfid_uid=?   │
   │                     │ ◀──FOUND! User #456│
   │                     │    (Juan Santos)   │
   │                     │                    │
   │                     │ Mark consumed      │
   │                     │──────────────────> │
   │                     │ UPDATE consumed=1  │
   │                     │                    │
   │ Error Response      │                    │
   │ ◀──{status:"error", │                    │
   │     message:"Card   │                    │
   │     already linked  │                    │
   │     to Juan Santos"}│                    │
   │                     │                    │
   │ Display Error       │                    │
   │ [Retry] button      │                    │
```

## ⏱️ Timeout Flow

```
Frontend
   │
   │ Start Timer (60s)
   │ Start Polling
   │────────────────> Poll (500ms intervals)
   │                  └─> {status: "waiting"}
   │                  └─> {status: "waiting"}
   │                  └─> {status: "waiting"}
   │                       ... (120 polls)
   │
   │ [60 seconds elapsed]
   │
   │ Stop Polling
   │ Show Timeout Message
   │ Enable [Retry] Button
   │
   └─> "No card detected"
```

## 🔍 Search Flow

```
Staff Input              Backend Query                     Result
   │                         │                               │
   │ Type: "juan"            │                               │
   │─────────────────────>   │                               │
   │                         │ SELECT * FROM users           │
   │                         │ WHERE role='student'          │
   │                         │   AND (name LIKE '%juan%'     │
   │                         │   OR username LIKE '%juan%'   │
   │                         │   OR student_number           │
   │                         │       LIKE '%juan%')          │
   │                         │ LIMIT 100                     │
   │                         │                               │
   │                         │ ◀─────────────────────────────┤
   │                         │   [                           │
   │                         │     {user_id: 123,            │
   │                         │      name: "Juan Dela Cruz",  │
   │                         │      student_no: "2023-0001", │
   │                         │      has_rfid: false},        │
   │                         │     {user_id: 456,            │
   │                         │      name: "Juan Santos",     │
   │                         │      student_no: "2023-0015", │
   │                         │      has_rfid: true}          │
   │                         │   ]                           │
   │                         │                               │
   │ Render Table            │                               │
   │ ◀────────────────────── │                               │
   │ [2 results]             │                               │
```

## 🎛️ Filter Toggle Flow

```
Initial State (No Filter)
┌────────────────────────────┐
│ ☐ Only show users without  │
│   RFID                     │
│                            │
│ Results: 50 students       │
│ - 30 with RFID            │
│ - 20 without RFID         │
└────────────────────────────┘
           │
           │ Click checkbox
           ▼
Filter Applied
┌────────────────────────────┐
│ ☑ Only show users without  │
│   RFID                     │
│                            │
│ Results: 20 students       │
│ - 0 with RFID             │
│ - 20 without RFID         │
│                            │
│ (Query includes:           │
│  AND rfid_uid IS NULL)     │
└────────────────────────────┘
```

## 🔓 Unlink Flow

```
Staff                Frontend              Backend              Database
  │                     │                     │                    │
  │ Click "Unlink"      │                     │                    │
  │─────────────────>   │                     │                    │
  │                     │ Confirm Dialog      │                    │
  │                     │ "Are you sure?"     │                    │
  │ Confirm             │                     │                    │
  │─────────────────>   │                     │                    │
  │                     │ POST /rfid/unlink   │                    │
  │                     │──────────────────>  │                    │
  │                     │                     │ UPDATE users       │
  │                     │                     │ SET rfid_uid=NULL  │
  │                     │                     │──────────────────> │
  │                     │                     │ ◀──1 row affected  │
  │                     │ ◀──{success: true}──│                    │
  │                     │                     │                    │
  │                     │ Refresh Table       │                    │
  │                     │ (status changes     │                    │
  │                     │  to "No RFID")      │                    │
  │ ◀──"Card unlinked"──┤                     │                    │
```

## 🗄️ Database State Machine

```
User State Transitions:

┌─────────────────┐
│  New Student    │
│  rfid_uid: NULL │
└────────┬────────┘
         │
         │ Link RFID
         │ (POST /rfid/pending)
         ▼
┌─────────────────┐
│  RFID Linked    │
│  rfid_uid: "AB" │
└────────┬────────┘
         │
         │ Unlink RFID
         │ (POST /rfid/unlink)
         ▼
┌─────────────────┐
│  RFID Removed   │
│  rfid_uid: NULL │
└─────────────────┘
         │
         │ Re-link
         │ (Same flow)
         ▼
     (Back to Linked)
```

## 🔄 Polling State Machine

```
Modal State Transitions:

┌─────────────┐
│   Closed    │
└──────┬──────┘
       │ Click "Link RFID"
       ▼
┌─────────────┐
│   Waiting   │ ◄─┐
│  (Polling)  │   │ No scan yet
└──────┬──────┘   │ (Continue)
       │          │
       ├──────────┘
       │
       │ Scan detected
       ▼
┌─────────────┐
│  Validating │
└──────┬──────┘
       │
       ├──────────────────┬────────────────┐
       │                  │                │
       │ Valid            │ Duplicate      │ Timeout
       ▼                  ▼                ▼
┌─────────────┐    ┌─────────────┐  ┌─────────────┐
│   Success   │    │    Error    │  │   Timeout   │
│ [Close]     │    │  [Retry]    │  │  [Retry]    │
└─────────────┘    └─────────────┘  └─────────────┘
       │                  │                │
       └─────[Close]──────┴────[Retry]─────┘
                          │
                          ▼
                    (Back to Waiting)
```

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Flow Layers                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Presentation Layer (Browser)                                       │
│  ├─ RFID Linking Page (index.html)                                 │
│  ├─ Search Interface                                                │
│  ├─ Results Table                                                   │
│  └─ Linking Modal                                                   │
│                              │                                       │
│                              ▼                                       │
│  Application Layer (JavaScript)                                     │
│  ├─ showRfidLinking()                                              │
│  ├─ searchRfidUsers()                                              │
│  ├─ startRfidLink()                                                │
│  ├─ startRfidPolling()   ◄────── 500ms interval                   │
│  └─ handleRfidSuccess/Error()                                      │
│                              │                                       │
│                              ▼                                       │
│  API Layer (Express Routes)                                         │
│  ├─ GET  /rfid/search-users  [auth: staff]                        │
│  ├─ POST /rfid/scan          [no auth]                            │
│  ├─ GET  /rfid/pending       [auth: staff]                        │
│  └─ POST /rfid/unlink        [auth: staff]                        │
│                              │                                       │
│                              ▼                                       │
│  Data Layer (MySQL)                                                 │
│  ├─ users                    (permanent storage)                    │
│  │  └─ rfid_uid varchar(32)                                        │
│  └─ pending_rfid_scans       (temporary storage)                    │
│     ├─ uid varchar(32)                                             │
│     ├─ consumed tinyint(1)                                         │
│     └─ scanned_at datetime                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 🎯 Key Decision Points

```
When scan is received:

              Is scan recent?
              (< 60 seconds)
                    │
         ┌──────────┴──────────┐
         NO                   YES
         │                     │
    Ignore scan          Is UID unique?
                              │
                   ┌──────────┴──────────┐
                  NO                    YES
                  │                      │
           Return error           Link to user
           "Already in use"       Mark consumed
                                  Return success
```

---

## 📝 Legend

```
Symbols Used:
─────>  Data flow / Action
◄─────  Response / Result
│       Vertical connection
├───    Branch point
└───    End of branch
[...]   Button or action
{...}   Data object
┌───┐   Box/Container
```

---

This visual guide shows all possible paths and states in the RFID linking system!
