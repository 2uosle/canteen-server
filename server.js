// server.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { Parser } = require('json2csv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

/* =====================
   SECURITY MIDDLEWARE
   ===================== */
// Helmet: Sets secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for our frontend
  crossOriginEmbedderPolicy: false // Allow cross-origin resources
}));

// General rate limiter: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for auth endpoints: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: true // Don't count successful requests
});

// Apply general rate limiter to all routes
app.use(generalLimiter);

app.use(cors());
app.use(express.json());

// NOTE: move to .env for production
const JWT_SECRET = process.env.JWT_SECRET || 'canteen_secret_key';

// Pairing timeout (how long a pending RFID link is valid)
const RFID_LINK_TTL_SEC = parseInt(process.env.RFID_LINK_TTL_SEC || '120', 10);

/* =====================
   DB POOL & HEALTH
   ===================== */
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'canteen_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

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

// Create user (staff-managed account creation)
app.post('/addUser', auth('staff'), async (req, res) => {
  try {
    const { name, username = null, rfid_uid = null, role = 'student', balance = 0, password = null } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    if (username) {
      const [dupe] = await pool.query('SELECT 1 FROM users WHERE username=? LIMIT 1', [username]);
      if (dupe.length) return res.status(400).json({ error: 'username already taken' });
    }

    let hashedPassword = null;
    if (password) hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, username, rfid_uid, role, balance, password) VALUES (?, ?, ?, ?, ?, ?)',
      [name, username, rfid_uid, role, parseFloat(balance), hashedPassword]
    );
    res.json({ success: true, userId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

/* ---------- STAFF TOP-UPS (BLOCKED IF CARD LOCKED) ---------- */
app.post('/reload', auth('staff'), async (req, res) => {
  try {
    const { rfid_uid, amount } = req.body;
    const cashier_id = req.user.user_id;

    if (!rfid_uid || amount === undefined) {
      return res.status(400).json({ error: 'rfid_uid and amount required' });
    }
    const price = parseFloat(amount);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'invalid amount' });
    }

    const [users] = await pool.query(
      'SELECT user_id, balance, is_card_locked FROM users WHERE rfid_uid = ?',
      [rfid_uid]
    );
    if (!users.length) return res.status(404).json({ error: 'User not found' });
    const student = users[0];

    if (Number(student.is_card_locked) === 1) {
      return res.status(403).json({ error: 'Card is locked — top-ups are blocked' });
    }

    const newBal = parseFloat(student.balance) + price;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('UPDATE users SET balance = ? WHERE user_id = ?', [newBal, student.user_id]);
      await conn.query(
        'INSERT INTO reloads (user_id, amount, cashier_id) VALUES (?, ?, ?)',
        [student.user_id, price, cashier_id]
      );
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    res.json({ success: true, user_id: student.user_id, new_balance: newBal, cashier_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- BALANCE (INCLUDES LOCK FLAG FOR DEVICES/UI) ---------- */
app.get('/balance/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    const [rows] = await pool.query(
      'SELECT user_id, name, role, balance, is_card_locked AS card_locked FROM users WHERE rfid_uid = ?',
      [uid]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- DEVICE SALE (BLOCKED IF CARD LOCKED) ---------- */
app.post('/transaction', async (req, res) => {
  try {
    const { uid, item_id, amount, device_id } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });

    const [users] = await pool.query(
      'SELECT user_id, balance, is_card_locked AS card_locked FROM users WHERE rfid_uid = ?',
      [uid]
    );
    if (!users.length) return res.status(404).json({ error: 'User not found' });
    const user = users[0];

    if (Number(user.card_locked) === 1) {
      return res.status(403).json({ error: 'Card is locked' });
    }

    let price = null;
    if (item_id != null) {
      const [items] = await pool.query('SELECT price FROM menu WHERE item_id = ?', [item_id]);
      if (!items.length) return res.status(404).json({ error: 'Menu item not found' });
      price = parseFloat(items[0].price);
    } else if (amount != null) {
      price = parseFloat(amount);
    } else {
      return res.status(400).json({ error: 'item_id or amount required' });
    }
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'invalid amount' });
    }

    if (parseFloat(user.balance) < price) {
      return res.status(400).json({ success: false, message: 'Insufficient balance', balance: user.balance });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('UPDATE users SET balance = balance - ? WHERE user_id = ?', [price, user.user_id]);
      await conn.query(
        'INSERT INTO transactions (user_id, item_id, amount, device_id) VALUES (?, ?, ?, ?)',
        [user.user_id, item_id || null, price, device_id || null]
      );
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    res.json({ success: true, balance: Number(user.balance) - price });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- REPORTS & EXPORTS ---------- */
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

app.get('/staff', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT user_id, name FROM users WHERE role='staff'");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

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

/* ---------- AUTH ---------- */
app.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, username, role = 'student', password } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'name, username, password required' });
    }
    const [dupe] = await pool.query('SELECT 1 FROM users WHERE username=? LIMIT 1', [username]);
    if (dupe.length) return res.status(400).json({ error: 'username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, username, role, password) VALUES (?,?,?,?)",
      [name, username, role, hashedPassword]
    );
    res.json({ user_id: result.insertId, name, username, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login (username preferred; fallback to name)
app.post('/login', authLimiter, async (req, res) => {
  try {
    const username = (req.body.username ?? '').toString().trim();
    const name     = (req.body.name ?? '').toString().trim();
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

app.post('/logout', (req, res) => {
  res.json({ success: true, message: "Logged out" });
});

app.get('/whoami', auth(), (req, res) => {
  res.json({ user_id: req.user.user_id, role: req.user.role });
});

/* ---------- STUDENT DASHBOARD ---------- */
app.get('/student/me', auth('student'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT user_id, name, username, rfid_uid, balance, is_card_locked AS card_locked FROM users WHERE user_id=?",
      [req.user.user_id]
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student dashboard: get my last 10 transactions  ✅ now shows custom items
app.get('/student/transactions', auth('student'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         t.tx_id,
         t.timestamp,
         COALESCE(m.item_name, t.custom_item) AS item_name,
         t.amount
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



// Student dashboard: get my last 5 reloads (robust cashier name)
app.get('/student/reloads', auth('student'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         r.reload_id,
         r.amount,
         r.timestamp,
         COALESCE(s.name, s.username) AS cashier
       FROM reloads r
       LEFT JOIN users s ON s.user_id = r.cashier_id
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


// Change my password
app.put('/student/password', auth('student'), async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'current_password and new_password required' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'new_password must be at least 8 characters' });
    }
    const [[user]] = await pool.query('SELECT user_id, password FROM users WHERE user_id=?', [req.user.user_id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(current_password, (user.password || '').toString());
    if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, user.user_id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lock/Unlock my card
app.post('/student/card/lock', auth('student'), async (req, res) => {
  try {
    await pool.query("UPDATE users SET is_card_locked=1 WHERE user_id=?", [req.user.user_id]);
    res.json({ ok: true, locked: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/student/card/unlock', auth('student'), async (req, res) => {
  try {
    await pool.query("UPDATE users SET is_card_locked=0 WHERE user_id=?", [req.user.user_id]);
    res.json({ ok: true, locked: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ==========================================================
   RFID LINKING (tap-to-pair) — STAFF CONTROLLED
   ----------------------------------------------------------
   Tables required:
     - users.rfid_uid  (VARCHAR(32), UNIQUE, NULL)
     - users.is_card_locked TINYINT(1) NOT NULL DEFAULT 0
     - pending_rfid_links:
         id INT PK AI
         user_id INT NOT NULL
         uid VARCHAR(32) NULL
         confirmed TINYINT NOT NULL DEFAULT 0 -- 0 pending, 1 success, 2 failed
         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
   ========================================================== */

// Staff starts a pending RFID link for a student
// Body: { user_id, override?: boolean }
app.post('/rfid/link/start', auth('staff'), async (req, res) => {
  try {
    let { user_id, override = false } = req.body || {};
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const [[target]] = await pool.query('SELECT user_id, rfid_uid FROM users WHERE user_id=?', [user_id]);
    if (!target) return res.status(404).json({ error: 'Target user not found' });

    if (target.rfid_uid && !override) {
      return res.status(400).json({ error: 'User already has an RFID. Pass override=true to replace.' });
    }

    if (target.rfid_uid && override) {
      await pool.query('UPDATE users SET rfid_uid = NULL WHERE user_id=?', [user_id]);
    }

    // Cancel older pending requests for this user
    await pool.query('UPDATE pending_rfid_links SET confirmed=2 WHERE user_id=? AND confirmed=0', [user_id]);

    const [r] = await pool.query(
      'INSERT INTO pending_rfid_links (user_id) VALUES (?)',
      [user_id]
    );

    res.json({ success: true, pending_id: r.insertId, ttl_seconds: RFID_LINK_TTL_SEC });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Device (ESP32) polls: latest pending link (fresh & unconfirmed)
app.get('/rfid/link/latest', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, user_id, created_at
         FROM pending_rfid_links
        WHERE confirmed=0
          AND created_at >= (NOW() - INTERVAL ? SECOND)
        ORDER BY created_at DESC
        LIMIT 1`,
      [RFID_LINK_TTL_SEC]
    );
    res.json(rows.length ? rows[0] : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Device confirms link after a tap
// Body: { pending_id, uid, device_id? }
app.post('/rfid/link/confirm', async (req, res) => {
  try {
    const { pending_id, uid, device_id } = req.body || {};
    if (!pending_id || !uid) return res.status(400).json({ error: 'pending_id and uid required' });

    const [[pending]] = await pool.query(
      `SELECT * FROM pending_rfid_links
        WHERE id=? AND confirmed=0
          AND created_at >= (NOW() - INTERVAL ? SECOND)`,
      [pending_id, RFID_LINK_TTL_SEC]
    );
    if (!pending) return res.status(404).json({ error: 'No active pending link (expired or not found)' });

    // RFID must be unique across users
    const [dupe] = await pool.query('SELECT user_id FROM users WHERE rfid_uid=? LIMIT 1', [uid]);
    if (dupe.length) {
      await pool.query('UPDATE pending_rfid_links SET confirmed=2, uid=? WHERE id=?', [uid, pending_id]);
      return res.status(409).json({ success: false, failed: true, message: 'RFID already in use' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('UPDATE users SET rfid_uid=? WHERE user_id=?', [uid, pending.user_id]);
      await conn.query('UPDATE pending_rfid_links SET confirmed=1, uid=? WHERE id=?', [uid, pending_id]);
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    res.json({ success: true, user_id: pending.user_id, uid, device_id: device_id || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Staff polls pairing status
app.get('/rfid/link/status/:id', auth('staff'), async (req, res) => {
  try {
    const [[row]] = await pool.query(
      'SELECT id, user_id, uid, confirmed, created_at FROM pending_rfid_links WHERE id=?',
      [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });

    const expired = new Date(row.created_at).getTime() < (Date.now() - RFID_LINK_TTL_SEC * 1000);
    res.json({
      confirmed: row.confirmed === 1,
      failed: row.confirmed === 2 || expired,
      uid: row.uid || null,
      expired
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unlink RFID — STAFF ONLY (lost card replacement)
app.post('/rfid/unlink', auth('staff'), async (req, res) => {
  try {
    const { user_id } = req.body || {};
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    const [r] = await pool.query('UPDATE users SET rfid_uid=NULL WHERE user_id=?', [user_id]);
    res.json({ success: true, affected: r.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------- PENDING SALE FLOW (BLOCKED IF CARD LOCKED) ---------- */
app.post('/pending-sale', auth('vendor'), async (req, res) => {
  try {
    let { item_id, item_name, amount } = req.body;
    if ((!item_id && !item_name) || amount == null) {
      return res.status(400).json({ error: 'item_id or item_name and amount required' });
    }
    const vendor_id = req.user.user_id;
    const price = parseFloat(amount);
    if (isNaN(price) || price <= 0) return res.status(400).json({ error: 'invalid amount' });

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

// Student taps to confirm sale
app.post('/pending-sale/confirm', async (req, res) => {
  try {
    const { pending_id, uid } = req.body;
    if (!pending_id || !uid) return res.status(400).json({ error: 'pending_id and uid required' });

    const [[sale]] = await pool.query(
      "SELECT * FROM pending_sales WHERE id = ? AND confirmed = 0",
      [pending_id]
    );
    if (!sale) return res.status(404).json({ error: 'Pending sale not found or already confirmed' });

    const [[student]] = await pool.query(
      "SELECT user_id, balance, is_card_locked FROM users WHERE rfid_uid = ?",
      [uid]
    );
    if (!student) return res.status(404).json({ error: 'User not found' });

    if (Number(student.is_card_locked) === 1) {
      await pool.query('UPDATE pending_sales SET confirmed = 2 WHERE id = ?', [pending_id]);
      return res.status(403).json({ success: false, failed: true, message: 'Card is locked' });
    }

    const price = parseFloat(sale.amount);
    if (parseFloat(student.balance) < price) {
      await pool.query('UPDATE pending_sales SET confirmed = 2 WHERE id = ?', [pending_id]);
      return res.json({ success: false, failed: true, message: 'Insufficient balance' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('UPDATE users SET balance = balance - ? WHERE user_id = ?', [price, student.user_id]);
      await conn.query(
        'INSERT INTO transactions (user_id, item_id, custom_item, amount, device_id) VALUES (?, ?, ?, ?, ?)',
        [student.user_id, sale.item_id || null, sale.item_name, price, 'esp32-counter1']
      );
      await conn.query('UPDATE pending_sales SET confirmed = 1 WHERE id = ?', [pending_id]);
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    const newBal = parseFloat(student.balance) - price;
    res.json({ success: true, balance: newBal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/pending-sale/status/:id', auth('vendor'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT item_id, item_name, amount, confirmed FROM pending_sales WHERE id = ?`,
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

/* ---------- PENDING RELOAD FLOW (BLOCKED IF CARD LOCKED) ---------- */
app.post('/pending-reload', auth('staff'), async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount == null) return res.status(400).json({ error: 'amount required' });
    const cashier_id = req.user.user_id;

    const price = parseFloat(amount);
    if (isNaN(price) || price <= 0) return res.status(400).json({ error: 'invalid amount' });

    const [r] = await pool.query(
      'INSERT INTO pending_reloads (amount, cashier_id) VALUES (?, ?)',
      [price, cashier_id]
    );
    res.json({ success: true, pending_id: r.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/pending-reload/latest', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM pending_reloads WHERE confirmed = 0 ORDER BY created_at DESC LIMIT 1'
    );
    res.json(rows.length ? rows[0] : {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ESP32 confirms reload after card tap
app.post('/pending-reload/confirm', async (req, res) => {
  try {
    const { pending_id, uid, device_id } = req.body;
    if (!pending_id || !uid) return res.status(400).json({ error: 'pending_id and uid required' });

    const [[reloadReq]] = await pool.query(
      'SELECT * FROM pending_reloads WHERE id = ? AND confirmed = 0',
      [pending_id]
    );
    if (!reloadReq) return res.status(404).json({ error: 'Pending reload not found or already handled' });

    const [[user]] = await pool.query(
      'SELECT user_id, balance, is_card_locked FROM users WHERE rfid_uid = ?',
      [uid]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (Number(user.is_card_locked) === 1) {
      await pool.query('UPDATE pending_reloads SET confirmed = 2 WHERE id = ?', [pending_id]);
      return res.status(403).json({ success: false, failed: true, message: 'Card is locked — top-ups blocked' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('UPDATE users SET balance = balance + ? WHERE user_id = ?', [reloadReq.amount, user.user_id]);
      await conn.query(
        'INSERT INTO reloads (user_id, amount, cashier_id) VALUES (?,?,?)',
        [user.user_id, reloadReq.amount, reloadReq.cashier_id]
      );
      await conn.query('UPDATE pending_reloads SET confirmed = 1 WHERE id = ?', [pending_id]);
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    const newBal = parseFloat(user.balance) + parseFloat(reloadReq.amount);
    res.json({ success: true, balance: newBal, device_id: device_id || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/pending-reload/status/:id', auth('staff'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, amount, confirmed FROM pending_reloads WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const row = rows[0];
    res.json({
      confirmed: row.confirmed === 1,
      failed: row.confirmed === 2,
      amount: row.amount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- MENU ---------- */
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

/* ---------- STATIC + START ---------- */
const port = process.env.PORT || 3000;
app.use(express.static('public'));
app.listen(port, async () => {
  console.log(`API running on http://localhost:${port}`);
  const ok = await checkDb();
  console.log('DB reachable:', ok);
});
