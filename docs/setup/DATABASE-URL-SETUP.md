# 🔧 DATABASE_URL Setup Guide

## ⚡ Quick Answer

Add this line to your `.env` file:

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@127.0.0.1:3306/canteen_db"
```

**Replace `YOUR_PASSWORD` with your actual MySQL root password** (same as your `DB_PASS` value)

---

## 📋 Format Breakdown

```
DATABASE_URL="mysql://root:YOUR_PASSWORD@127.0.0.1:3306/canteen_db"
              ─────┬─ ──┬────────── ───┬─────── ─┬─── ─────┬────────
                   │    │             │          │         │
                USER   PASSWORD     HOST       PORT    DATABASE
                   │    │             │          │         │
            (DB_USER) (DB_PASS)  (DB_HOST)  (DB_PORT)  (DB_NAME)
```

---

## 🎯 Your Specific Values

Based on your `.env` file, you already have:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=<your_password>
DB_NAME=canteen_db
```

Combine them into:

```env
DATABASE_URL="mysql://root:<your_password>@127.0.0.1:3306/canteen_db"
```

---

## 📝 Examples

### Example 1: Password is "mypass123"
```env
DATABASE_URL="mysql://root:mypass123@127.0.0.1:3306/canteen_db"
```

### Example 2: No password (empty)
```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/canteen_db"
```

### Example 3: Password is "password"
```env
DATABASE_URL="mysql://root:password@127.0.0.1:3306/canteen_db"
```

---

## ⚠️ Special Characters in Password

If your password contains special characters like `@`, `:`, `/`, `#`, `?`, you need to URL-encode them:

| Character | Encoded | Example Password | Encoded in URL |
|-----------|---------|------------------|----------------|
| `@` | `%40` | `p@ss` | `p%40ss` |
| `:` | `%3A` | `p:ss` | `p%3Ass` |
| `/` | `%2F` | `p/ss` | `p%2Fss` |
| `#` | `%23` | `p#ss` | `p%23ss` |
| `?` | `%3F` | `p?ss` | `p%3Fss` |
| `&` | `%26` | `p&ss` | `p%26ss` |

### Example with special characters:
If password is `my@pass#123`, use:
```env
DATABASE_URL="mysql://root:my%40pass%23123@127.0.0.1:3306/canteen_db"
```

---

## ✅ How to Add It

**Option 1: Edit .env directly**
1. Open `.env` file in your editor
2. Find or add the line:
   ```env
   DATABASE_URL="mysql://root:YOUR_PASSWORD@127.0.0.1:3306/canteen_db"
   ```
3. Replace `YOUR_PASSWORD` with your actual password
4. Save the file

**Option 2: It might already be there!**
Check if you already have `DATABASE_URL` in your `.env` - I added a placeholder earlier.

---

## 🧪 Test If It Works

After adding `DATABASE_URL`, run:

```bash
npx prisma generate
```

**Success looks like:**
```
✔ Generated Prisma Client (v6.18.0) in 97ms
```

**Error looks like:**
```
Error: P1001: Can't reach database server at `127.0.0.1:3306`
```

---

## 🔍 Troubleshooting

### Error: "Can't reach database server"
- ❌ MySQL is not running
- ✅ Start MySQL server first

### Error: "Authentication failed"
- ❌ Wrong password in DATABASE_URL
- ✅ Check your DB_PASS value and use the same password

### Error: "Database does not exist"
- ❌ Database `canteen_db` not created
- ✅ Run: `mysql -u root -p` then `CREATE DATABASE canteen_db;`

### Error: "Missing DATABASE_URL"
- ❌ DATABASE_URL not in .env
- ✅ Add the line to your .env file

---

## 📍 Your .env File Should Look Like

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=your_actual_password
DB_NAME=canteen_db

# Prisma (ADD THIS LINE)
DATABASE_URL="mysql://root:your_actual_password@127.0.0.1:3306/canteen_db"
                         ^^^^^^^^^^^^^^^^^^^
                         USE YOUR REAL PASSWORD HERE!

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_please
JWT_EXPIRES_IN=2h

# ... rest of your config ...
```

---

## 🎯 Final Check

After adding `DATABASE_URL`:

1. ✅ MySQL server is running
2. ✅ Database `canteen_db` exists
3. ✅ Password matches `DB_PASS`
4. ✅ No spaces in the URL
5. ✅ URL is wrapped in quotes

Then run:
```bash
npm run db:studio
```

If it opens at `http://localhost:5555` - **Success!** 🎉

---

## 🆘 Still Having Issues?

Run this command to check your connection:
```bash
npx prisma db pull
```

This will try to connect and pull your schema. If it works, your DATABASE_URL is correct!

