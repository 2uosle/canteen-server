# Quick Test Guide - Canteen Manager Role

## 🚀 Quick Start

### 1. Login
- **URL**: http://localhost:3001
- **Username**: `menu_manager`
- **Password**: `manager123`

### 2. Dashboard Overview
Upon login, you'll see two tabs:
- **Menu Items** - Manage all menu items
- **Analytics** - View sales statistics

---

## 📋 Test Scenarios

### Scenario 1: Add New Menu Item
1. Click **"Add Item"** button (top right of Menu Items tab)
2. Fill in the form:
   - Item Name: `Test Item`
   - Price: `50`
   - Active: ✓ (checked)
3. Click **"Save"**
4. ✅ Verify: Item appears in the table
5. ✅ Verify: Toast notification shows success

### Scenario 2: Edit Existing Item
1. Find any item in the table
2. Click the **pencil icon** (edit button)
3. Modify the price (e.g., change to `55`)
4. Click **"Save"**
5. ✅ Verify: Price updated in table
6. ✅ Verify: Analytics refresh with new price

### Scenario 3: Deactivate Item
1. Click **pencil icon** on any item
2. Uncheck **"Active"** toggle
3. Click **"Save"**
4. ✅ Verify: Status badge changes to gray "Inactive"
5. ✅ Verify: Active Items count decreases (Analytics tab)

### Scenario 4: Delete Item
1. Click **trash icon** on any item
2. Confirmation modal appears
3. Click **"Delete"**
4. ✅ Verify: Item removed from table
5. ✅ Verify: Total Items count decreases

### Scenario 5: View Analytics
1. Click **"Analytics"** tab
2. ✅ Verify: 4 stat cards display correctly
   - Total Items
   - Active Items
   - Average Price
   - Price Range
3. ✅ Verify: Chart displays top 10 selling items
4. ✅ Verify: Hover over chart bars to see revenue

---

## 🔍 Validation Tests

### Input Validation
- [ ] Try adding item with **empty name** → Should show warning toast
- [ ] Try adding item with **zero price** → Should show warning toast
- [ ] Try adding item with **negative price** → Should show warning toast
- [ ] Try adding item with **valid data** → Should succeed

### Role-Based Access
To test access control:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try accessing endpoints manually:
   ```javascript
   // This should work (you're logged in as canteen_manager)
   fetch('/api/menu-items', {
     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
   }).then(r => r.json()).then(console.log)
   ```
4. Login as **student** and try the same → Should get 403 error

### Logout Test
1. Click **Logout** button
2. ✅ Verify: Redirected to login page
3. ✅ Verify: Dashboard hidden
4. ✅ Verify: Token cleared from localStorage

---

## 🎨 UI/UX Checks

### Visual Verification
- [ ] Dashboard tabs render correctly
- [ ] Table has proper spacing and alignment
- [ ] Stat cards display with icons
- [ ] Chart renders without errors
- [ ] Buttons have hover effects
- [ ] Modals open/close smoothly
- [ ] Toast notifications appear and fade

### Responsive Check
1. Resize browser window to smaller width
2. ✅ Verify: Table remains scrollable
3. ✅ Verify: Stat cards stack on mobile
4. ✅ Verify: Chart maintains aspect ratio

---

## 📊 Analytics Accuracy

### Test Data Integrity
1. Go to **Record Sale** (if you have vendor/staff access in another browser)
2. Record several sales with different items
3. Return to canteen manager dashboard
4. ✅ Verify: Analytics reflect the new sales
5. ✅ Verify: Chart updates with new data

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to load menu items"
**Solution**: Check if server is running (`node server.js`)

### Issue: Chart not displaying
**Solution**: 
1. Check browser console for errors
2. Verify Chart.js is loaded in index.html
3. Ensure analytics endpoint returns data

### Issue: 403 Forbidden error
**Solution**: 
1. Verify you're logged in as canteen_manager
2. Check token in localStorage
3. Confirm migration was run successfully

### Issue: Changes not saving
**Solution**:
1. Check browser console for errors
2. Verify database connection
3. Check server logs: `logs/combined.log`

---

## 💡 Quick Tips

### Add Test Data Quickly
Run this in MySQL Workbench to add sample items:
```sql
INSERT INTO menu (item_name, price, active) VALUES
('Chicken Adobo', 45.00, 1),
('Pork Sinigang', 50.00, 1),
('Pancit Canton', 35.00, 1),
('Lumpia Shanghai', 40.00, 1),
('Fried Rice', 25.00, 1),
('Banana Cue', 15.00, 1);
```

### View Logs
Check Winston logs for all menu operations:
```powershell
Get-Content logs\combined.log -Tail 20
```

### Reset Test Account
If you need to reset the password:
```javascript
// Run: node -e "console.log(require('bcryptjs').hashSync('newpassword', 10))"
// Then update in MySQL:
UPDATE users SET password = 'hashed_password' WHERE username = 'menu_manager';
```

---

## ✅ Final Checklist

Before considering testing complete:
- [ ] Can login as canteen_manager
- [ ] Can view all menu items
- [ ] Can add new items
- [ ] Can edit existing items
- [ ] Can delete items (with confirmation)
- [ ] Can toggle active status
- [ ] Analytics display correct stats
- [ ] Chart renders top selling items
- [ ] Input validation works
- [ ] Access control enforced (403 for non-managers)
- [ ] Logout works correctly
- [ ] No console errors
- [ ] No server errors in logs

---

## 📞 Need Help?

Check these files:
- Implementation details: `CANTEEN-MANAGER-COMPLETE.md`
- Server logs: `logs/combined.log`
- Database schema: `schema.sql`
- API endpoints: `server.js` (lines 1368-1553)

**Happy Testing!** 🎉
