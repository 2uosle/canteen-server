require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { Parser } = require('json2csv');
const app = express();
app.use(cors());
app.use(express.json());
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = require('../config/env');

// DB pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'canteen_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper: DB connectivity check
async function checkDb() {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    return rows && rows.length ? true : false;
  } catch (err) {
    console.error('DB check failed:', err.message);
    return false;
  }
}

/* =====================
   AUTH MIDDLEWARE
   ===================== */
function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ error: "No token provided" });

    const token = header.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ error: "Forbidden: wrong role" });
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

/* =====================
   ROUTES
   ===================== */

// Health check
app.get('/health', async (req, res) => {
  const dbOk = await checkDb();
  res.json({ ok: true, db: dbOk });
});

// Add user (admin only if you want later)
app.post('/addUser', async (req, res) => {
  try {
    const { name, rfid_uid = null, role = 'student', balance = 0, password = null } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const [result] = await pool.query(
      'INSERT INTO users (name, rfid_uid, role, balance, password) VALUES (?, ?, ?, ?, ?)',
      [name, rfid_uid, role, parseFloat(balance), hashedPassword]
    );
    res.json({ success: true, userId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

// Reload (top-up) → now PROTECTED for staff only
app.post('/reload', auth('staff'), async (req, res) => {
  try {
    const { rfid_uid, amount } = req.body;
    const cashier_id = req.user.user_id; // from JWT

    if (!rfid_uid || amount === undefined) {
      return res.status(400).json({ error: 'rfid_uid and amount required' });
    }

    // find student
    const [users] = await pool.query('SELECT user_id, balance FROM users WHERE rfid_uid = ?', [rfid_uid]);
    if (!users.length) return res.status(404).json({ error: 'User not found' });
    const student = users[0];

    const newBal = parseFloat(student.balance) + parseFloat(amount);
    await pool.query('UPDATE users SET balance = ? WHERE user_id = ?', [newBal, student.user_id]);

    await pool.query(
      'INSERT INTO reloads (user_id, amount, cashier_id) VALUES (?, ?, ?)',
      [student.user_id, parseFloat(amount), cashier_id]
    );

    res.json({ success: true, user_id: student.user_id, new_balance: newBal, cashier_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Balance check by UID
app.get('/balance/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    const [rows] = await pool.query('SELECT user_id, name, role, balance FROM users WHERE rfid_uid = ?', [uid]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Transaction (ESP32 endpoint)
app.post('/transaction', async (req, res) => {
  try {
    const { uid, item_id, amount, device_id } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });

    const [users] = await pool.query('SELECT user_id, balance FROM users WHERE rfid_uid = ?', [uid]);
    if (!users.length) return res.status(404).json({ error: 'User not found' });
    const user = users[0];

    let price = null;
    if (item_id) {
      const [items] = await pool.query('SELECT price FROM menu WHERE item_id = ?', [item_id]);
      if (!items.length) return res.status(404).json({ error: 'Menu item not found' });
      price = parseFloat(items[0].price);
    } else if (amount !== undefined) {
      price = parseFloat(amount);
    } else {
      return res.status(400).json({ error: 'item_id or amount required' });
    }

    if (parseFloat(user.balance) < price) {
      return res.status(400).json({ success: false, message: 'Insufficient balance', balance: user.balance });
    }

    const newBal = parseFloat(user.balance) - price;
    await pool.query('UPDATE users SET balance = ? WHERE user_id = ?', [newBal, user.user_id]);
    await pool.query(
      'INSERT INTO transactions (user_id, item_id, amount, device_id) VALUES (?, ?, ?, ?)',
      [user.user_id, item_id || null, price, device_id || null]
    );

    res.json({ success: true, balance: newBal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Reports (transactions list for dashboard)
app.get('/report', async (req, res) => {
  try {
    const { from, to } = req.query;
    let q = `
      SELECT 
        t.tx_id, 
        t.timestamp, 
        u.name AS user_name, 
        u.rfid_uid, 
        COALESCE(m.item_name, t.custom_item) AS item_name, 
        t.amount, 
        t.device_id
      FROM transactions t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN menu m ON t.item_id = m.item_id
    `;
    const params = [];

    if (from && to) {
      q += ' WHERE t.timestamp BETWEEN ? AND ?';
      params.push(from, to);
    }

    q += ' ORDER BY t.timestamp DESC LIMIT 2000';

    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Staff list
app.get('/staff', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT user_id, name FROM users WHERE role='staff'");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Reload history
app.get('/reloads', auth('staff'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.reload_id, u.name AS student, s.name AS cashier, r.amount, r.timestamp
       FROM reloads r
       JOIN users u ON r.user_id = u.user_id
       LEFT JOIN users s ON r.cashier_id = s.user_id
       ORDER BY r.timestamp DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// CSV Export for Transactions
app.get('/report/csv', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         t.tx_id, 
         u.name AS student, 
         COALESCE(m.item_name, t.custom_item) AS item_name, 
         t.amount, 
         t.timestamp
       FROM transactions t
       JOIN users u ON t.user_id = u.user_id
       LEFT JOIN menu m ON t.item_id = m.item_id
       ORDER BY t.timestamp DESC`
    );

    const json2csv = new Parser();
    const csv = json2csv.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.get('/reloads/csv', auth('staff'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.reload_id, u.name AS student, s.name AS cashier, r.amount, r.timestamp
       FROM reloads r
       JOIN users u ON r.user_id = u.user_id
       LEFT JOIN users s ON r.cashier_id = s.user_id
       ORDER BY r.timestamp DESC`
    );
    const json2csv = new Parser();
    const csv = json2csv.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('reloads.csv');
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register
app.post('/register', async (req, res) => {
  try {
    const { name, role, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, role, password) VALUES (?,?,?)",
      [name, role, hashedPassword]
    );
    res.json({ user_id: result.insertId, name, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Login (by username preferred; falls back to name)
app.post('/login', async (req, res) => {
  try {
    const username = (req.body.username ?? '').toString().trim();
    const name     = (req.body.name ?? '').toString().trim(); // fallback
    const password = (req.body.password ?? '').toString();

    let rows;
    if (username) {
      [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    } else {
      [rows] = await pool.query("SELECT * FROM users WHERE name = ?", [name]);
    }
    if (!rows.length) return res.status(400).json({ error: "User not found" });

    const user = rows[0];
    const dbHash = (user.password || '').toString().trim();
    const match = await bcrypt.compare(password, dbHash);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, role: user.role, username: user.username, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Optional: logout endpoint (client should also clear localStorage)
app.post('/logout', (req, res) => {
  // With stateless JWT, there’s nothing to invalidate server-side
  res.json({ success: true, message: "Logged out" });
});


// Whoami
app.get('/whoami', auth(), (req, res) => {
  res.json({ user_id: req.user.user_id, role: req.user.role });
});

// Server start
const port = process.env.PORT || 3000;
app.use(express.static('public'));
app.listen(port, async () => {
  console.log(`API running on http://localhost:${port}`);
  const ok = await checkDb();
  console.log('DB reachable:', ok);
});


// Student dashboard: get my profile
app.get('/student/me', auth('student'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT user_id, name, username, rfid_uid, balance FROM users WHERE user_id = ?",
      [req.user.user_id]
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student dashboard: get my last 10 transactions
app.get('/student/transactions', auth('student'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.tx_id, t.timestamp, m.item_name, t.amount
       FROM transactions t
       LEFT JOIN menu m ON t.item_id = m.item_id
       WHERE t.user_id = ?
       ORDER BY t.timestamp DESC
       LIMIT 10`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student dashboard: get my last 5 reloads
app.get('/student/reloads', auth('student'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.reload_id, r.amount, r.timestamp, s.name AS cashier
       FROM reloads r
       LEFT JOIN users s ON r.cashier_id = s.user_id
       WHERE r.user_id = ?
       ORDER BY r.timestamp DESC
       LIMIT 5`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Create a pending sale (either item_id OR custom item_name)
app.post('/pending-sale', auth('vendor'), async (req, res) => {
  try {
    let { item_id, item_name, amount } = req.body;
    if ((!item_id && !item_name) || amount == null) {
      return res.status(400).json({ error: 'item_id or item_name and amount required' });
    }

    const vendor_id = req.user.user_id;
    const price = parseFloat(amount);

    // If item_id is provided, fetch item_name from menu
    if (item_id) {
      const [menuRows] = await pool.query("SELECT item_name FROM menu WHERE item_id = ?", [item_id]);
      if (!menuRows.length) return res.status(404).json({ error: "Menu item not found" });
      item_name = menuRows[0].item_name;
    }

    const [r] = await pool.query(
      'INSERT INTO pending_sales (item_id, item_name, amount, vendor_id) VALUES (?,?,?,?)',
      [item_id || null, item_name || null, price, vendor_id]
    );

    res.json({ success: true, pending_id: r.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




// ESP32 polls: check if there's a pending sale
app.get('/pending-sale/latest', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM pending_sales WHERE confirmed=0 ORDER BY created_at DESC LIMIT 1"
    );
    res.json(rows.length ? rows[0] : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student taps card to confirm sale
app.post('/pending-sale/confirm', async (req, res) => {
  try {
    const { pending_id, uid } = req.body;
    if (!pending_id || !uid) return res.status(400).json({ error: 'pending_id and uid required' });

    const [pending] = await pool.query("SELECT * FROM pending_sales WHERE id = ? AND confirmed = 0", [pending_id]);
    if (!pending.length) return res.status(404).json({ error: 'Pending sale not found or already confirmed' });

    const sale = pending[0];

    // Get student
    const [users] = await pool.query("SELECT user_id, balance FROM users WHERE rfid_uid = ?", [uid]);
    if (!users.length) return res.status(404).json({ error: 'User not found' });
    const student = users[0];

    // Check balance
    if (parseFloat(student.balance) < parseFloat(sale.amount)) {
      await pool.query("UPDATE pending_sales SET confirmed = 2 WHERE id = ?", [pending_id]); // mark failed
      return res.json({ success: false, failed: true, message: 'Insufficient balance' });
    }

    const newBal = parseFloat(student.balance) - parseFloat(sale.amount);
    await pool.query("UPDATE users SET balance = ? WHERE user_id = ?", [newBal, student.user_id]);

    await pool.query(
      "INSERT INTO transactions (user_id, item_id, custom_item, amount, device_id) VALUES (?, ?, ?, ?, ?)",
      [student.user_id, sale.item_id || null, sale.item_name, sale.amount, "esp32-counter1"]
    );

    await pool.query("UPDATE pending_sales SET confirmed = 1 WHERE id = ?", [pending_id]);

    res.json({ success: true, balance: newBal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Poll status of a pending sale (vendor dashboard)
app.get('/pending-sale/status/:id', auth('vendor'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT item_id,   item_name, amount, confirmed
         FROM pending_sales WHERE id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const row = rows[0];
    res.json({
      confirmed: row.confirmed === 1,
      failed: row.confirmed === 2,
      item_name: row.item_name,
      amount: row.amount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// List menu items for vendor dropdown
app.get('/menu', auth(), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT item_id, item_name, price FROM menu WHERE active=1 ORDER BY item_name'

    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

