# Cart Migration Quickstart (Fix 500: Table 'canteen_db.orders' doesn't exist)

This fixes the 500 errors when calling `/orders` by creating the required `orders` and `order_items` tables, triggers, and stored procedure.

## What this does
- Creates tables: `orders`, `order_items`
- Adds `order_id` to `pending_sales` (backward compatible)
- Adds triggers to keep `orders.total_amount` in sync with items
- Creates stored procedure `finalize_order_checkout` (order-based)

## Prereqs
- MySQL server running
- Credentials for a user with DDL rights on `canteen_db`
- `mysql` CLI installed (optional; Workbench also works)

## Option A: PowerShell (recommended on Windows)

```powershell
# From repo root
cd c:\MyProj\canteen-server

# Run and follow the password prompt
# (Adjust -User, -Host, -Port, -Database as needed)
.\apply-cart-migration.ps1 -User root -Host 127.0.0.1 -Port 3306 -Database canteen_db
```

This will:
1) Test MySQL connectivity
2) Apply `migrations/cart-sales-system.sql`
3) Run verification `migrations/verify-cart-migration.sql`

## Option B: MySQL Workbench
1) Open `migrations/cart-sales-system.sql`
2) Select the `canteen_db` schema in the SCHEMAS panel
3) Press the lightning bolt (Execute)
4) Open `migrations/verify-cart-migration.sql` and run it

## Verify
You should see:
- Tables `orders`, `order_items` exist
- `pending_sales.order_id` column exists
- Triggers on `order_items` present
- Procedure `finalize_order_checkout` present

## Restart the server
After applying migrations, restart the Node server so any prepared statements/procedures are refreshed.

```powershell
# From repo root
.\start-server.ps1
```

## Troubleshooting
- Error: Unknown database 'canteen_db'
  - Create the DB first or change the `-Database` parameter to the correct one (see `DATABASE-SETUP.md`).
- Error: Table 'menu' doesn't exist
  - The cart migration references `menu(item_id)`. Ensure you ran the base schema first.
- Error: Foreign key constraints fail
  - Run the script with an account that has `REFERENCES` and `ALTER` permissions.
- Still getting 500 after migration
  - Restart the Node server
  - Check server logs for SQL errors
  - Make sure the server is pointing to the same database you migrated (see `DATABASE-URL-SETUP.md`).

## Notes
- The Arduino flow is unaffected. It will display the total amount from `pending_sales` as before.
- Frontend now supports quick-add: click menu items to add qty=1 rapidly, then checkout once.
