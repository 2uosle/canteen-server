# Multi-Item Sales: Comprehensive Solutions & Architecture

## Problem Statement
**Current limitation**: Vendors can only record ONE item per sale transaction. When a student buys multiple items (e.g., rice + chicken + drink), the vendor must:
- Create separate pending sales for each item
- Make the student tap 3 times
- Risk incomplete transactions if student walks away mid-process

**Goal**: Support multi-item orders in a single cart/transaction while keeping database, server APIs, and Arduino device in sync.

---

## Current System Architecture (As-Is)

### Database Schema
```
users (user_id, rfid_uid, balance, ...)
menu (item_id, item_name, price, active)
transactions (tx_id, user_id, item_id, custom_item, amount, vendor_id, timestamp)
pending_sales (id, item_id, item_name, amount, vendor_id, confirmed, created_at)
  └─ order_id column added but not used yet
```

### Current Workflow (Single Item)
1. **Vendor UI**: Record Sale → select item → enter amount → confirm
2. **Backend**: `POST /pending-sale` → insert into `pending_sales`
3. **Arduino**: Polls `/pending-sale/latest` → detects pending sale
4. **Student**: Taps RFID card
5. **Arduino**: `POST /pending-sale/confirm` with UID
6. **Backend**: 
   - Verify student balance
   - Deduct amount
   - Insert into `transactions`
   - Mark `pending_sales.confirmed = 1`

### Arduino Constraints
- **Polling-based**: Checks `/pending-sale/latest` every ~2 seconds
- **Stateless**: Only knows about the CURRENT pending sale
- **Limited memory**: ESP32 can handle moderate JSON payloads (~4KB)
- **No screen**: Cannot display itemized cart to student

---

## Migration Status ✅

You already have the foundation ready in `migrations/cart-sales-system.sql`:

### Tables Created
- ✅ **orders** (order_id, vendor_id, status, total_amount, student_id, paid_at, ...)
- ✅ **order_items** (id, order_id, item_id, custom_item, price, qty, line_total)
- ✅ **pending_sales** extended with `order_id` column

### Supporting Infrastructure
- ✅ Triggers to auto-update `orders.total_amount` when items added/removed
- ✅ Stored procedure `finalize_order_checkout(order_id, student_id)` for atomic payment
- ✅ View `v_transactions_enriched` to link transactions back to orders

### Backward Compatibility
- ✅ Legacy single-item flow still works (when `order_id` is NULL)
- ✅ Existing reports/analytics continue to work via `transactions` table

---

## Solution Options (Ranked by Complexity)

### **Option A: Session-Based Cart (Recommended)** ⭐

**How it works:**
1. Vendor opens "Record Sale" → enters **building mode**
2. Can add multiple items with quantities (e.g., 2× Rice, 1× Chicken, 1× Coke)
3. Cart UI shows running total in real-time
4. When ready: "Submit Order" → creates `order` + `order_items` in DB
5. Backend creates ONE `pending_sale` record linking to the `order_id`
6. Arduino sees the pending sale with **total amount** (individual items hidden)
7. Student taps once → stored procedure finalizes all items atomically

**Pros:**
- ✅ Student taps only ONCE regardless of item count
- ✅ Arduino unchanged (still polls `/pending-sale/latest`)
- ✅ Database handles complexity (already migrated)
- ✅ Vendor can modify cart before submission
- ✅ Supports combos, discounts, notes

**Cons:**
- ⚠️ Requires new cart UI (frontend work)
- ⚠️ Arduino doesn't "see" individual items (acceptable—student sees receipt after)

**Database Flow:**
```sql
-- Vendor adds items to cart:
INSERT INTO orders (vendor_id, status) VALUES (1, 'building');  -- order_id=42
INSERT INTO order_items (order_id, item_id, price, qty) VALUES (42, 5, 35.00, 2); -- Rice
INSERT INTO order_items (order_id, item_id, price, qty) VALUES (42, 8, 45.00, 1); -- Chicken
-- Triggers auto-update orders.total_amount = 115.00

-- Vendor submits order:
UPDATE orders SET status='awaiting_tap' WHERE order_id=42;
INSERT INTO pending_sales (order_id, item_name, amount, vendor_id) 
  VALUES (42, 'Multi-item order', 115.00, 1);  -- id=99

-- Arduino polls /pending-sale/latest → sees id=99, amount=115.00
-- Student taps → Arduino confirms:
POST /pending-sale/confirm { pending_id: 99, uid: "ABC123" }

-- Backend calls stored procedure:
CALL finalize_order_checkout(42, student_user_id);
-- This deducts 115.00 and inserts 3 rows into transactions (one per item)
```

**Arduino Changes:**
- ✅ **NONE** (already supports `order_id` logging if present)
- ✅ Polls same endpoint
- ✅ Confirms same way

**Server Changes:**
- ✅ **Already implemented** in `/pending-sale/confirm` (lines 847-910 in server.js)
- Just need to add cart API endpoints (see below)

**UI Changes:**
- 🔨 Build cart modal with:
  - Item search/quick-add buttons
  - Quantity steppers
  - Running total display
  - Submit button

---

### **Option B: Quick Multi-Add (Simplified Cart)**

**How it works:**
1. Vendor selects item → enters quantity → "Add More" or "Done"
2. Backend creates `order` immediately on first item
3. Each additional item appends to `order_items` via API
4. "Finish & Request Payment" → creates `pending_sale` linking to order

**Pros:**
- ✅ Simpler UI than full cart (progressive disclosure)
- ✅ Arduino/DB same as Option A
- ✅ Faster for small orders (2-3 items)

**Cons:**
- ⚠️ Can't easily remove items once added (need delete API)
- ⚠️ Order created even if vendor cancels mid-way (needs cleanup)

**Best for:**
- Vendors with predictable item counts (e.g., set meals)
- Touch-optimized POS terminals

---

### **Option C: Batch Single Items (Minimal Change)**

**How it works:**
1. Vendor adds items one by one (current flow)
2. Each creates a separate `pending_sale` record
3. Backend groups by `(vendor_id, timestamp within 30 sec)`
4. Arduino shows total of ALL pending sales for this vendor
5. Student taps once → backend processes all pending sales atomically

**Pros:**
- ✅ Minimal UI changes (reuse current modal)
- ✅ No cart state management

**Cons:**
- ❌ Race conditions (what if two vendors create sales at same time?)
- ❌ Confusing UX (student sees total without itemization)
- ❌ Hard to cancel individual items
- ❌ Arduino must aggregate multiple pending sales (complex)

**Verdict:** ❌ Not recommended—too error-prone

---

### **Option D: Pre-Built Combos/Presets**

**How it works:**
1. Admin creates preset "combos" in DB (e.g., "Meal A = Rice + Chicken + Drink")
2. Vendor selects preset → backend auto-creates `order` with all items
3. Rest follows Option A flow

**Pros:**
- ✅ Super fast for common orders
- ✅ Reduces vendor input errors
- ✅ Can pre-apply discounts to combos

**Cons:**
- ⚠️ Requires combo management UI
- ⚠️ Less flexible for custom orders

**Best for:**
- Canteens with standardized meal sets
- Combo with Option A for "Preset + Custom Items" mode

---

## Recommended Implementation Plan

### **Phase 1: Backend Cart APIs** (Already 80% Done!)

Run the migration:
```sql
-- Already exists in migrations/cart-sales-system.sql
SOURCE migrations/cart-sales-system.sql;
```

Add these endpoints to `server.js`:

```javascript
// Create new cart order
POST /orders
Body: { vendor_id, device_id }
Response: { order_id, status: 'building' }

// Add item to cart
POST /orders/:order_id/items
Body: { item_id, custom_item, price, qty }
Response: { success, line_total, order_total }

// Update item quantity
PATCH /orders/:order_id/items/:line_id
Body: { qty }

// Remove item from cart
DELETE /orders/:order_id/items/:line_id

// Submit cart for payment (creates pending_sale)
POST /orders/:order_id/submit
Response: { success, pending_sale_id, total_amount }

// Cancel entire cart
DELETE /orders/:order_id
```

### **Phase 2: Arduino** (ZERO Changes Required!)

Current Arduino code **already supports** multi-item orders:
```cpp
// Arduino polls /pending-sale/latest
// Sees: { id: 99, order_id: 42, amount: 115.00, ... }
// Student taps → Arduino confirms
// Backend calls finalize_order_checkout(42, student_id)
// Done!
```

**Optional enhancement** (for logging):
```cpp
if (ordPos != -1) {
  Serial.printf("➡ Multi-item order detected: order_id=%s, total=%.2f\n", 
    orderIdStr.c_str(), salePendingAmount);
}
```

### **Phase 3: Vendor Cart UI**

**Minimal Implementation (Quick Win):**

Add to `index.html` inside sale modal Step 1:
```html
<div class="cart-preview" id="saleCartPreview" style="display:none;">
  <div class="cart-header">Cart (3 items) — Total: ₱115.00</div>
  <div class="cart-items" id="saleCartItems"></div>
  <button onclick="clearCart()">Clear Cart</button>
</div>
<button onclick="addToCart()">+ Add Item</button>
<button onclick="submitCart()">Checkout (Tap Card)</button>
```

**JavaScript (`app.js`):**
```javascript
let currentOrderId = null;
let cartItems = [];

async function addToCart() {
  const itemId = $('posSaleItemId').value;
  const price = parseFloat($('posSaleAmount').value);
  const qty = parseInt($('posSaleQty').value) || 1;
  
  // Create order if first item
  if (!currentOrderId) {
    const res = await fetch('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ vendor_id: currentUser.user_id })
    });
    const data = await res.json();
    currentOrderId = data.order_id;
  }
  
  // Add item to order
  const res2 = await fetch(`/orders/${currentOrderId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ item_id: itemId, price, qty })
  });
  const item = await res2.json();
  
  cartItems.push(item);
  renderCart();
}

async function submitCart() {
  const res = await fetch(`/orders/${currentOrderId}/submit`, { method: 'POST' });
  const data = await res.json();
  
  // Now proceed to "Tap card" step
  posState.sale.pendingId = data.pending_sale_id;
  posShowStep('sale', 3);
  posStartSalePolling();
}
```

---

## Database Sync Verification

### Check Migration Applied:
```sql
SHOW TABLES LIKE 'orders';
SHOW TABLES LIKE 'order_items';
DESCRIBE pending_sales;  -- Should have 'order_id' column
SHOW PROCEDURE STATUS WHERE Name='finalize_order_checkout';
```

### Test Flow:
```sql
-- 1. Create order
INSERT INTO orders (vendor_id, status) VALUES (1, 'building');
SET @order_id = LAST_INSERT_ID();

-- 2. Add items
INSERT INTO order_items (order_id, item_id, price, qty) VALUES (@order_id, 5, 35.00, 2);
INSERT INTO order_items (order_id, item_id, price, qty) VALUES (@order_id, 8, 45.00, 1);

-- 3. Check totals auto-updated
SELECT order_id, subtotal, total_amount FROM orders WHERE order_id = @order_id;
-- Should show: subtotal=115.00, total_amount=115.00

-- 4. Submit for payment
UPDATE orders SET status='awaiting_tap' WHERE order_id = @order_id;
INSERT INTO pending_sales (order_id, item_name, amount, vendor_id) 
  VALUES (@order_id, 'Test multi-item order', 115.00, 1);

-- 5. Simulate student tap (replace with real student user_id)
CALL finalize_order_checkout(@order_id, 2);

-- 6. Verify transactions created
SELECT * FROM transactions WHERE vendor_id=1 ORDER BY tx_id DESC LIMIT 3;
-- Should show 3 rows (one per item)

-- 7. Verify order marked paid
SELECT status, paid_at, student_id FROM orders WHERE order_id = @order_id;
-- Should show: status='paid', paid_at=NOW(), student_id=2
```

---

## Arduino Compatibility Matrix

| Feature | Current (Single Item) | Option A (Cart) | Arduino Changes |
|---------|----------------------|-----------------|-----------------|
| Polling endpoint | `/pending-sale/latest` | Same | ✅ None |
| Confirm endpoint | `/pending-sale/confirm` | Same | ✅ None |
| Response format | `{id, amount, item_name}` | `{id, order_id, amount, item_name}` | ✅ Optional logging |
| Tap workflow | Tap once | Tap once | ✅ None |
| Multiple items | ❌ Multiple taps | ✅ Single tap | ✅ None |

**Verdict:** Arduino is **100% compatible** with cart system!

---

## Security & Edge Cases

### Handled by Current Migration:
- ✅ Atomicity: `finalize_order_checkout` uses transaction
- ✅ Balance validation before deduction
- ✅ Foreign key constraints prevent orphaned data
- ✅ Triggers keep totals in sync
- ✅ Cancelled orders don't create transactions

### Additional Safeguards Needed:
```javascript
// Server: Prevent cart tampering
app.post('/orders/:order_id/items', auth('vendor'), async (req, res) => {
  // Verify order belongs to this vendor
  const [[order]] = await pool.query(
    'SELECT vendor_id, status FROM orders WHERE order_id = ?', 
    [req.params.order_id]
  );
  if (order.vendor_id !== req.user.user_id) {
    return res.status(403).json({ error: 'Not your order' });
  }
  if (order.status !== 'building') {
    return res.status(400).json({ error: 'Order already submitted' });
  }
  // ... proceed
});
```

### Timeout Handling:
```sql
-- Auto-cancel orders abandoned for >10 minutes
CREATE EVENT IF NOT EXISTS cleanup_abandoned_orders
ON SCHEDULE EVERY 5 MINUTE
DO
  UPDATE orders 
  SET status='cancelled', cancelled_at=NOW(), cancellation_reason='Timeout - abandoned'
  WHERE status='building' 
    AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) > 10;
```

---

## Next Steps

### Immediate (No Breaking Changes):
1. ✅ Run `migrations/cart-sales-system.sql` (if not already done)
2. ✅ Test stored procedure with sample data
3. ✅ Verify existing single-item flow still works

### Short-Term (Backend):
4. Add cart API endpoints (`POST /orders`, `POST /orders/:id/items`, etc.)
5. Add validation middleware for cart operations
6. Test end-to-end: create cart → add items → submit → Arduino confirm

### Medium-Term (UI):
7. Build cart modal UI (item list, quantities, remove buttons)
8. Add quick-add buttons for popular items
9. Add keyboard shortcuts (Enter to add, Esc to clear)

### Optional Enhancements:
10. Preset combos/meal sets
11. Auto-complete for custom item names
12. Print receipt after successful payment
13. Vendor-specific item favorites

---

## Rollback Plan

If cart system causes issues:
```sql
-- Remove cart infrastructure (keeps existing data)
ALTER TABLE pending_sales DROP FOREIGN KEY fk_ps_order;
ALTER TABLE pending_sales DROP COLUMN order_id;
DROP PROCEDURE IF EXISTS finalize_order_checkout;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
```

Single-item flow continues to work perfectly.

---

## Questions to Decide

1. **UI Complexity**: Full cart UI (Option A) or quick multi-add (Option B)?
   - **Recommendation**: Start with Option A—more flexible long-term

2. **Preset Combos**: Worth building now or later?
   - **Recommendation**: Later—cart UI is priority

3. **Touch vs Mouse**: Optimize for touchscreen or mouse clicks?
   - **Recommendation**: Both—use large tap targets, support keyboard

4. **Cancel Workflow**: Allow item removal after adding to cart?
   - **Recommendation**: Yes—add DELETE endpoint for line items

5. **Order History**: Should vendors see their order history?
   - **Recommendation**: Yes—extend analytics to show order details

---

## Summary

**Best Solution: Option A (Session-Based Cart)**
- Database: ✅ Ready (migration exists)
- Server: 🔨 Add 5 cart endpoints (~200 lines)
- Arduino: ✅ No changes needed
- UI: 🔨 Build cart modal (~300 lines)
- Timeline: 2-4 hours for MVP

**You're 80% done** — just need the API endpoints and UI!
