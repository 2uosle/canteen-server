# 🧪 Cart System - Quick Test Guide

## Prerequisites
1. Server must be running (`.\start-server.ps1`)
2. Database must have cart migration applied
3. You must be logged in as a vendor

---

## Step 1: Verify Database Migration

**Open MySQL Workbench** and run:

```sql
-- Run the verification script
SOURCE c:/MyProj/canteen-server/migrations/verify-cart-migration.sql;
```

**Expected Results:**
- ✅ `orders` table exists (exists_count = 1)
- ✅ `order_items` table exists (exists_count = 1)
- ✅ `pending_sales.order_id` column exists
- ✅ `finalize_order_checkout` stored procedure exists
- ✅ 3 triggers exist on `order_items` table

**If migration not applied**, run:
```sql
SOURCE c:/MyProj/canteen-server/migrations/cart-sales-system.sql;
```

---

## Step 2: Start Server

```powershell
cd c:\MyProj\canteen-server
.\start-server.ps1
```

**Expected Output:**
```
Server running on port 3000
MySQL Connected
Redis Connected
WebSocket server listening on port 3001
```

---

## Step 3: Login as Vendor

1. Open browser: `http://localhost:3000`
2. Login with vendor credentials
3. You should see the POS dashboard

---

## Step 4: Test Cart - Add Items

### Test 4.1: Add Menu Item
1. Click **"Record Sale"** button
2. Click the **item search** box
3. Select a menu item from dropdown (e.g., "Coffee")
   - ✅ Price should auto-fill
   - ✅ Keypad should be disabled
4. Change **Quantity** to `2`
5. Click **"ADD TO CART"**
   - ✅ Toast: "Item added to cart"
   - ✅ Item appears in cart preview on right
   - ✅ Shows: "Coffee", "×2", "₱50.00 each", line total
   - ✅ Total updates

### Test 4.2: Add Custom Item
1. In item search, type `"Pandesal"`
2. Clear the price field
3. Enter price: `5`
4. Change quantity to `3`
5. Click **"ADD TO CART"**
   - ✅ Toast: "Item added to cart"
   - ✅ "Pandesal" appears in cart
   - ✅ Total updates (previous total + 15)

### Test 4.3: Add More Items
- Add 3-5 different items
- Mix menu items and custom items
- Vary quantities (1, 2, 5, etc.)
- ✅ All items appear in scrollable list
- ✅ Total continuously updates

---

## Step 5: Test Cart - Remove Items

1. In cart preview, click the **red X** button on any item
   - ✅ Item disappears
   - ✅ Total decreases
   - ✅ Toast: "Item removed"

2. Remove items until cart is empty
   - ✅ Shows: "Your cart is empty" message
   - ✅ Checkout button should be disabled (optional feature)

---

## Step 6: Test Cart - Clear Cart

1. Add 2-3 items to cart
2. Click **"Clear Cart"** button
   - ✅ Confirmation dialog appears
3. Click **OK**
   - ✅ All items removed
   - ✅ Total resets to ₱0.00
   - ✅ Toast: "Cart cleared"

---

## Step 7: Test Cart - Checkout Flow

### Setup: Add Test Items
1. Add 3 items to cart:
   - Coffee × 2 @ ₱50 = ₱100
   - Burger × 1 @ ₱80 = ₱80
   - Juice × 2 @ ₱30 = ₱60
   - **Total: ₱240**

### Checkout
1. Review cart (3 items, ₱240 total)
2. Click **"CHECKOUT"** button
   - ✅ Modal switches to Step 3 (tap screen)
   - ✅ Shows: "₱240.00" and "3 items"
   - ✅ Message: "Waiting for card tap..."

### Backend Verification (Optional)
Open another terminal and check database:
```sql
USE canteen_db;

-- Check if pending_sale was created
SELECT * FROM pending_sales 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 1;
-- Should show: order_id, amount=240, item_name='Multi-item order'

-- Check the order
SELECT * FROM orders WHERE id = <order_id_from_above>;
-- Should show: status='awaiting_tap', total_amount=240

-- Check order items
SELECT * FROM order_items WHERE order_id = <order_id>;
-- Should show 3 rows (Coffee×2, Burger×1, Juice×2)
```

---

## Step 8: Arduino Tap (If Available)

**If you have Arduino connected:**
1. Arduino should detect pending_sale
2. Arduino display shows: "Tap your card"
3. Student taps RFID card
4. ✅ Web interface shows success screen
5. ✅ All 3 items processed
6. ✅ Total ₱240 deducted from student balance

**Verify transactions:**
```sql
SELECT * FROM transactions 
WHERE student_id = <student_id>
ORDER BY timestamp DESC 
LIMIT 3;
-- Should show 3 separate transactions for Coffee, Burger, Juice
```

**If Arduino NOT available:**
Simulate tap via API:
```powershell
# Get the pending_id from the database query above
# Replace <pending_id> and use a test card_uid

curl -X POST http://localhost:3000/tap `
  -H "Content-Type: application/json" `
  -d '{"pending_id": <pending_id>, "card_uid": "TEST12345678"}'
```

---

## Step 9: Test Edge Cases

### Test 9.1: Empty Cart Checkout
1. Open sale modal
2. Don't add any items
3. Click **"CHECKOUT"**
   - ✅ Toast: "Cart is empty"
   - ✅ Modal stays on Step 1

### Test 9.2: Invalid Price
1. Enter custom item
2. Leave price empty or enter `0`
3. Click **"ADD TO CART"**
   - ✅ Toast: "Please enter valid price"

### Test 9.3: Invalid Item Name
1. Leave item search empty
2. Enter price
3. Click **"ADD TO CART"**
   - ✅ Toast: "Please enter item name"

### Test 9.4: Cart Persistence
1. Add 2 items to cart
2. Close the modal (X button or click outside)
3. Reopen "Record Sale"
   - ✅ Cart should still show 2 items
   - ✅ Total preserved

### Test 9.5: Single Item (Legacy Flow)
1. Add 1 item to cart
2. Immediately click **"CHECKOUT"**
   - ✅ Should work exactly like before
   - ✅ Creates pending_sale
   - ✅ Student taps once
   - ✅ 1 transaction created

---

## Step 10: Test Security (Optional)

### Test 10.1: Order Ownership
1. Login as **Vendor A**
2. Create order, get order_id from network tab
3. Logout, login as **Vendor B**
4. Try to access Vendor A's order via API:
   ```javascript
   fetch('http://localhost:3000/orders/<vendor_a_order_id>', {
     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
   })
   ```
   - ✅ Should return 403 or empty response (ownership check)

### Test 10.2: Status Validation
1. Create order, submit it (status changes to 'awaiting_tap')
2. Try to add items to that order:
   ```javascript
   fetch('http://localhost:3000/orders/<order_id>/items', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + token,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({ custom_item: 'Test', price: 10, qty: 1 })
   })
   ```
   - ✅ Should return error (can't modify order with status != 'building')

---

## ✅ Success Checklist

### Basic Functionality
- [ ] Can add menu items to cart
- [ ] Can add custom items to cart
- [ ] Can change quantity before adding
- [ ] Items appear in cart preview
- [ ] Total updates correctly
- [ ] Can remove items from cart
- [ ] Can clear entire cart
- [ ] Can checkout cart
- [ ] Tap screen shows correct total and item count

### Edge Cases
- [ ] Empty cart checkout shows warning
- [ ] Invalid inputs show warnings
- [ ] Cart persists across modal close/reopen
- [ ] Single-item sale still works

### Arduino Integration (If Available)
- [ ] Arduino detects pending_sale
- [ ] Student taps card
- [ ] All items processed atomically
- [ ] Transactions created correctly
- [ ] Balance deducted correctly
- [ ] Order status changes to 'paid'

### Database Integrity
- [ ] Orders table updated
- [ ] Order_items table has all items
- [ ] Totals match (order.total_amount = SUM(order_items.line_total))
- [ ] Triggers maintain accuracy
- [ ] Stored procedure executes without errors

---

## 🐛 Common Issues

### "Failed to add item"
- Check browser console for error details
- Verify JWT token is valid
- Check server logs for validation errors
- Ensure you're logged in as vendor

### Cart doesn't appear
- Hard reload page (Ctrl+F5)
- Check browser console for JavaScript errors
- Verify `app.js` loaded correctly
- Check if HTML elements exist (F12 → Elements tab)

### Checkout does nothing
- Check browser console
- Verify cart has items
- Check network tab for failed requests
- Look at server logs

### Arduino doesn't detect
- Verify Arduino is running and polling
- Check `/pending-sale/latest` endpoint manually
- Verify pending_sale record exists in database
- Check Arduino serial monitor for errors

### Tap doesn't process
- Verify `/tap` endpoint receives request
- Check backend logs for stored procedure errors
- Verify student has sufficient balance
- Check if `finalize_order_checkout` exists in database

---

## 📝 Testing Notes Template

Use this template to document your test results:

```
Date: _____________
Tester: _____________
Environment: Development / Production

[ ] Step 1: Database migration verified
[ ] Step 2: Server started successfully
[ ] Step 3: Logged in as vendor
[ ] Step 4: Add items - all tests passed
[ ] Step 5: Remove items - works correctly
[ ] Step 6: Clear cart - works correctly
[ ] Step 7: Checkout flow - successful
[ ] Step 8: Arduino tap - all items processed
[ ] Step 9: Edge cases - all handled
[ ] Step 10: Security - validated

Issues Found:
1. ___________________________________
2. ___________________________________
3. ___________________________________

Overall Result: PASS / FAIL

Notes:
_____________________________________________
_____________________________________________
```

---

## 🎉 Expected Final Result

After all tests pass:

✅ **Vendors can**:
- Build multi-item orders efficiently
- Review cart before checkout
- Remove mistakes
- See running total
- Checkout entire cart with one student tap

✅ **Students experience**:
- One tap for entire order (no matter how many items)
- Faster checkout
- Accurate charges

✅ **System maintains**:
- Data integrity (triggers, constraints)
- Atomicity (all-or-nothing processing)
- Security (ownership, validation)
- Backward compatibility (single-item still works)

---

**Ready to test! 🚀**

*If you encounter any issues during testing, check the troubleshooting section in CART-IMPLEMENTATION-COMPLETE.md*
