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
const logger = require('./logger');

// Import validation middleware and schemas
const {
  validate,
  registerSchema,
  loginSchema,
  addUserSchema,
  reloadSchema,
  transactionSchema,
  pendingSaleSchema,
  confirmPendingSchema,
  rfidLinkStartSchema,
  rfidLinkConfirmSchema,
  rfidUnlinkSchema,
  changePasswordSchema,
  reportQuerySchema,
  balanceParamSchema,
  statusParamSchema,
  createOrderSchema,
  addOrderItemSchema,
  updateOrderItemSchema,
  orderIdParamSchema
} = require('./middleware/validation');

const app = express();
// Async handler utility (initial modularization step)
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* =====================
   WEBSOCKET INTEGRATION
   ===================== */
// Import WebSocket server
const { broadcast, sendToUser, sendToRole, getStats: getWsStats } = require('./config/websocket');

/* =====================
   SECURITY MIDDLEWARE
   ===================== */
// Helmet: Sets secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for our frontend
  crossOriginEmbedderPolicy: false // Allow cross-origin resources
}));

// Load env early for proxy & JWT config
const { JWT_SECRET, JWT_EXPIRES_IN, TRUST_PROXY } = require('./config/env');
if (TRUST_PROXY) {
  const value = TRUST_PROXY === 'true' ? true : (TRUST_PROXY === 'false' ? false : TRUST_PROXY);
  app.set('trust proxy', value);
  logger.info(`Trust proxy configured: ${TRUST_PROXY}`);
}

// Proxy-aware client IP helper (uses first X-Forwarded-For entry if present)
function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff && typeof xff === 'string') {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

// General rate limiter: 100 requests per 15 minutes per unique client IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  skip: (req) => {
    const ip = getClientIp(req);
    const isDev = process.env.NODE_ENV !== 'production';
    const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    return isDev && isLocalhost;
  }
});

// Strict rate limiter for auth endpoints: 5 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 50,
  message: { error: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: true,
  keyGenerator: (req) => getClientIp(req),
  skip: (req) => {
    const ip = getClientIp(req);
    const isDev = process.env.NODE_ENV !== 'production';
    const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    return isDev && isLocalhost;
  }
});

// Apply general rate limiter to all routes (except in dev mode on localhost)
app.use(generalLimiter);

app.use(cors());
app.use(express.json());

// Centralized environment config & validation (enforces JWT_SECRET presence)
// Warn if secret appears to be the insecure legacy default
if (JWT_SECRET === 'canteen_secret_key') {
  logger.warn('Insecure legacy JWT secret detected. Generate a strong secret: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
}

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
    logger.error('Database health check failed', { error: err.message });
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
      if (requiredRole) {
        // Allow admin to access staff-guarded routes
        if (requiredRole === 'staff' && (decoded.role === 'staff' || decoded.role === 'admin')) {
          return next();
        }
        if (decoded.role !== requiredRole) {
          return res.status(403).json({ error: "Forbidden: wrong role" });
        }
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

// Admin-only middleware
const adminAuth = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: "No token provided" });

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

/* =====================
   ROUTES
   ===================== */

// Health check
app.get('/health', asyncHandler(async (req, res) => {
  const dbOk = await checkDb();
  res.json({ ok: true, db: dbOk });
}));

// WebSocket stats (staff only)
app.get('/ws/stats', auth('staff'), (req, res) => {
  const stats = getWsStats();
  res.json(stats);
});

/* =====================
   INITIAL ROUTE MODULARIZATION
   ===================== */
let menuRouterLoaded = false;
try {
  const buildMenuRouter = require('./routes/menu');
  app.use('/', buildMenuRouter({ pool, auth, asyncHandler, logger }));
  menuRouterLoaded = true;
} catch (e) {
  logger.warn('Menu router not loaded; using inline endpoints', { error: e.message });
}

// Create user (staff-managed account creation)
app.post('/addUser', auth('staff'), validate(addUserSchema), async (req, res) => {
  try {
    const { name, username = null, rfid_uid = null, role = 'student', balance = 0, password = null } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    // Only admin can create admin or canteen_manager accounts
    const privilegedRoles = ['admin', 'canteen_manager'];
    if (privilegedRoles.includes(role)) {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admin can create admin or canteen_manager accounts' });
      }
    }

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
app.post('/reload', auth('staff'), validate(reloadSchema), async (req, res) => {
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

    // Broadcast balance update via WebSocket
    sendToUser(student.user_id, 'balance_updated', {
      user_id: student.user_id,
      new_balance: newBal,
      amount: price,
      type: 'reload',
      cashier_id
    });

    // Notify all staff about the reload
    sendToRole('staff', 'reload_completed', {
      user_id: student.user_id,
      amount: price,
      new_balance: newBal,
      cashier_id
    });

    res.json({ success: true, user_id: student.user_id, new_balance: newBal, cashier_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- BALANCE (INCLUDES LOCK FLAG FOR DEVICES/UI) ---------- */
app.get('/balance/:uid', validate(balanceParamSchema, 'params'), async (req, res) => {
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
app.post('/transaction', validate(transactionSchema), async (req, res) => {
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

    const newBalance = Number(user.balance) - price;

    // Broadcast balance update via WebSocket
    sendToUser(user.user_id, 'balance_updated', {
      user_id: user.user_id,
      new_balance: newBalance,
      amount: -price,
      type: 'transaction',
      item_id,
      device_id
    });

    // Broadcast transaction to all vendors
    sendToRole('vendor', 'transaction_completed', {
      user_id: user.user_id,
      amount: price,
      item_id,
      device_id,
      new_balance: newBalance
    });

    res.json({ success: true, balance: newBalance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- REPORTS & EXPORTS ---------- */
app.get('/report', auth('staff'), validate(reportQuerySchema, 'query'), async (req, res) => {
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
    const { start_date, end_date } = req.query;
    
    let query = `SELECT r.reload_id, u.name AS student, s.name AS cashier, r.amount, r.timestamp
       FROM reloads r
       JOIN users u ON r.user_id = u.user_id
       LEFT JOIN users s ON r.cashier_id = s.user_id`;
    
    const params = [];
    
    // Add date range filtering if provided
    if (start_date && end_date) {
      query += ` WHERE DATE(r.timestamp) BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    }
    
    query += ` ORDER BY r.timestamp DESC`;
    
    // Only limit results if no date range is specified
    if (!start_date && !end_date) {
      query += ` LIMIT 100`;
    }
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/report/csv', auth('staff'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         t.tx_id, 
         u.name AS student, 
         COALESCE(m.item_name, t.custom_item) AS item_name, 
         FORMAT(t.amount, 2) AS amount,
         DATE_FORMAT(t.timestamp, '%m/%d/%Y %H:%i:%s') AS timestamp
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
      `SELECT 
         r.reload_id, 
         u.name AS student, 
         s.name AS cashier, 
         FORMAT(r.amount, 2) AS amount,
         DATE_FORMAT(r.timestamp, '%m/%d/%Y %H:%i:%s') AS timestamp
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
if (process.env.ALLOW_STUDENT_REGISTRATION === undefined || process.env.ALLOW_STUDENT_REGISTRATION === 'true') {
  app.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
    try {
      const { name, username, password } = req.body;
      if (!name || !username || !password) {
        return res.status(400).json({ error: 'name, username, password required' });
      }
      const [dupe] = await pool.query('SELECT 1 FROM users WHERE username=? LIMIT 1', [username]);
      if (dupe.length) return res.status(400).json({ error: `Username "${username}" is already taken. Please choose a different username.` });

      const hashedPassword = await bcrypt.hash(password, 10);
      const role = 'student'; // Always force student for public registration
      const [result] = await pool.query(
        "INSERT INTO users (name, username, role, password) VALUES (?,?,?,?)",
        [name, username, role, hashedPassword]
      );
      res.json({ user_id: result.insertId, name, username, role });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// Login (username preferred; fallback to name)
app.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
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

  const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '2h' });
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
app.put('/student/password', auth('student'), validate(changePasswordSchema), async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};
    // Validation is handled by changePasswordSchema middleware
    
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

// Staff/Admin starts a pending RFID link for a user
// Body: { user_id, override?: boolean }
const staffOrAdmin = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: "No token provided" });

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    if (!['staff','admin'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Forbidden: Staff or Admin access required' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
app.post('/rfid/link/start', staffOrAdmin, validate(rfidLinkStartSchema), async (req, res) => {
  try {
    let { user_id, override = false } = req.body || {};
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const [[target]] = await pool.query('SELECT user_id, rfid_uid FROM users WHERE user_id=?', [user_id]);
    if (!target) return res.status(404).json({ error: 'Target user not found' });

    if (target.rfid_uid && !override) {
      return res.status(400).json({ error: 'User already has an RFID. Pass override=true to replace.' });
    }

    // Note: We don't remove the old RFID here anymore.
    // It will be replaced during confirmation if the new RFID is valid.

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
    const result = rows.length ? rows[0] : {};
    if (rows.length) {
      console.log(`[Arduino Poll] RFID Link Found: id=${result.id}, user=${result.user_id}`);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Device confirms link after a tap
// Body: { pending_id, uid, device_id? }
app.post('/rfid/link/confirm', validate(rfidLinkConfirmSchema), async (req, res) => {
  try {
    const { pending_id, uid, device_id } = req.body || {};
    console.log(`[Link Confirm] Attempt: pending_id=${pending_id}, uid=${uid}, device=${device_id}`);
    
    if (!pending_id || !uid) return res.status(400).json({ error: 'pending_id and uid required' });

    const [[pending]] = await pool.query(
      `SELECT * FROM pending_rfid_links
        WHERE id=? AND confirmed=0
          AND created_at >= (NOW() - INTERVAL ? SECOND)`,
      [pending_id, RFID_LINK_TTL_SEC]
    );
    if (!pending) {
      console.log(`[Link Confirm] FAILED: Link not found or expired (id=${pending_id})`);
      return res.status(404).json({ error: 'No active pending link (expired or not found)' });
    }

    // RFID must be unique across users
    // Check if this RFID is already paired to someone else
    const [[existingUser]] = await pool.query(
      'SELECT user_id, name FROM users WHERE rfid_uid=? LIMIT 1', 
      [uid]
    );
    
    if (existingUser) {
      // RFID is already in use
      if (existingUser.user_id !== pending.user_id) {
        // RFID is paired to a DIFFERENT user - reject
        await pool.query('UPDATE pending_rfid_links SET confirmed=2, uid=? WHERE id=?', [uid, pending_id]);
        logger.warn('RFID pairing rejected - already in use', {
          rfid: uid,
          existing_user: existingUser.user_id,
          target_user: pending.user_id
        });
        return res.status(409).json({ 
          success: false, 
          failed: true, 
          error: `This RFID card is already paired to another user (${existingUser.name}). Each card can only be linked to one account.` 
        });
      }
      // If RFID is already paired to the SAME user, we'll just update (re-pair same card)
      logger.info('Re-pairing same RFID to same user', {
        rfid: uid,
        user_id: pending.user_id
      });
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

// Staff/Admin polls pairing status
app.get('/rfid/link/status/:id', staffOrAdmin, validate(statusParamSchema, 'params'), async (req, res) => {
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

// Unlink RFID — STAFF or ADMIN (lost card replacement)
app.post('/rfid/unlink', staffOrAdmin, validate(rfidUnlinkSchema), async (req, res) => {
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
app.post('/pending-sale', auth(), validate(pendingSaleSchema), async (req, res) => {
  try {
    // Only vendor, staff, and canteen_manager can create pending sales
    if (!['vendor', 'staff', 'canteen_manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only staff, vendors, and canteen managers can create sales' });
    }
    
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
app.post('/pending-sale/confirm', validate(confirmPendingSchema), async (req, res) => {
  try {
    const { pending_id, uid } = req.body;
    console.log(`[Sale Confirm] Attempt: pending_id=${pending_id}, uid=${uid}`);
    
    if (!pending_id || !uid) return res.status(400).json({ error: 'pending_id and uid required' });

    const [[sale]] = await pool.query(
      "SELECT * FROM pending_sales WHERE id = ? AND confirmed = 0",
      [pending_id]
    );
    if (!sale) {
      console.log(`[Sale Confirm] FAILED: Sale not found or already processed (id=${pending_id})`);
      return res.status(404).json({ error: 'Pending sale not found or already confirmed' });
    }

    const [[student]] = await pool.query(
      "SELECT user_id, name, balance, is_card_locked FROM users WHERE rfid_uid = ?",
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

      // Cart-aware path: if pending sale references an order, finalize it atomically via stored procedure
      if (sale.order_id) {
        // Call stored proc to insert per-item transactions and deduct balance
        await conn.query('CALL finalize_order_checkout(?, ?)', [sale.order_id, student.user_id]);
        await conn.query('UPDATE pending_sales SET confirmed = 1 WHERE id = ?', [pending_id]);
      } else {
        // Legacy single-item flow
        await conn.query('UPDATE users SET balance = balance - ? WHERE user_id = ?', [price, student.user_id]);
        await conn.query(
          'INSERT INTO transactions (user_id, item_id, custom_item, amount, vendor_id, device_id) VALUES (?, ?, ?, ?, ?, ?)',
          [student.user_id, sale.item_id || null, sale.item_name, price, sale.vendor_id, 'esp32-counter1']
        );
        await conn.query('UPDATE pending_sales SET confirmed = 1 WHERE id = ?', [pending_id]);
      }

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    const newBal = parseFloat(student.balance) - price;

    // Resolve item_name for notifications: if this was a cart order with exactly one line, show that item name (with qty)
    let resolvedItemName = sale.item_name;
    if (sale.order_id) {
      try {
        const [orderItems] = await pool.query(
          'SELECT item_id, custom_item, qty FROM order_items WHERE order_id = ? ORDER BY id ASC',
          [sale.order_id]
        );
        if (Array.isArray(orderItems) && orderItems.length === 1) {
          const it = orderItems[0];
          if (it.custom_item && it.custom_item.trim()) {
            resolvedItemName = it.custom_item.trim() + (it.qty > 1 ? ` x${it.qty}` : '');
          } else if (it.item_id) {
            const [[mn]] = await pool.query('SELECT item_name FROM menu WHERE item_id = ?', [it.item_id]);
            if (mn && mn.item_name) {
              resolvedItemName = mn.item_name + (it.qty > 1 ? ` x${it.qty}` : '');
            }
          }
        }
      } catch(_) { /* keep original */ }
    }

    // Broadcast balance update to student
    sendToUser(student.user_id, 'balance_updated', {
      user_id: student.user_id,
      new_balance: newBal,
      amount: -price,
      type: 'sale',
      item_name: resolvedItemName
    });

    // Broadcast sale completion to vendor
    sendToRole('vendor', 'sale_completed', {
      pending_id,
      user_id: student.user_id,
      student_name: student.name,
      item_name: resolvedItemName || (sale.order_id ? 'Order #' + sale.order_id : null),
      amount: price,
      new_balance: newBal,
      order_id: sale.order_id || null
    });

    res.json({ success: true, balance: newBal, student_name: student.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/pending-sale/status/:id', auth(), validate(statusParamSchema, 'params'), async (req, res) => {
  try {
    // Only vendor, staff, and canteen_manager can check sale status
    if (!['vendor', 'staff', 'canteen_manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only staff, vendors, and canteen managers can check sale status' });
    }
    
    const [[row]] = await pool.query(
      `SELECT ps.id, ps.item_id, ps.item_name, ps.amount, ps.confirmed, ps.created_at, ps.vendor_id, ps.order_id
       FROM pending_sales ps
       WHERE ps.id = ?`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });

    // Check if expired (5 minutes timeout)
    const TIMEOUT_MS = 5 * 60 * 1000;
    const expired = new Date(row.created_at).getTime() < (Date.now() - TIMEOUT_MS);
    
    // Auto-mark as failed if expired and not yet processed
    if (expired && row.confirmed === 0) {
      await pool.query('UPDATE pending_sales SET confirmed = 2 WHERE id = ?', [req.params.id]);
      return res.json({
        confirmed: false,
        failed: true,
        expired: true,
        item_name: row.item_name,
        amount: row.amount
      });
    }

    // If confirmed, get student info from the most relevant source
    let student_name = null;
    if (row.confirmed === 1) {
      // 1) Legacy single-item heuristic (exact match by custom_item and amount)
      try {
        const [[transactionInfo]] = await pool.query(
          `SELECT u.name as student_name
           FROM transactions t
           JOIN users u ON t.user_id = u.user_id
           WHERE t.custom_item = ? AND t.amount = ?
           ORDER BY t.timestamp DESC LIMIT 1`,
          [row.item_name, row.amount]
        );
        student_name = transactionInfo?.student_name || null;
      } catch(_) {}

      // 2) Cart flow fallback: pick the first transaction after this pending was created for this vendor
      if (!student_name && row.vendor_id) {
        try {
          const [[tx]] = await pool.query(
            `SELECT u.name as student_name
             FROM transactions t
             JOIN users u ON t.user_id = u.user_id
             WHERE t.vendor_id = ? AND t.timestamp >= ?
             ORDER BY t.timestamp ASC LIMIT 1`,
            [row.vendor_id, row.created_at]
          );
          student_name = tx?.student_name || null;
        } catch(_) {}
      }
    }

    // Derive a friendlier item_name for cart orders with exactly one line item
    let statusItemName = row.item_name;
    if (row.order_id) {
      try {
        const [orderItems] = await pool.query(
          'SELECT item_id, custom_item, qty FROM order_items WHERE order_id = ? ORDER BY id ASC',
          [row.order_id]
        );
        if (Array.isArray(orderItems) && orderItems.length === 1) {
          const it = orderItems[0];
          if (it.custom_item && it.custom_item.trim()) {
            statusItemName = it.custom_item.trim() + (it.qty > 1 ? ` x${it.qty}` : '');
          } else if (it.item_id) {
            const [[mn]] = await pool.query('SELECT item_name FROM menu WHERE item_id = ?', [it.item_id]);
            if (mn && mn.item_name) {
              statusItemName = mn.item_name + (it.qty > 1 ? ` x${it.qty}` : '');
            }
          }
        }
      } catch (_) { /* keep existing */ }
    }

    res.json({
      confirmed: row.confirmed === 1,
      failed: row.confirmed === 2,
      expired: expired && row.confirmed === 0,
      item_name: statusItemName,
      amount: row.amount,
      student_name: student_name
    });
  } catch (err) {
    console.error('pending-sale/status error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- VENDOR CANCEL TRANSACTION ---------- */
// POST /pending-sale/cancel - Cancel a pending sale transaction
app.post('/pending-sale/cancel', auth(), async (req, res) => {
  try {
    const { pending_id, reason } = req.body;
    
    // Debug: Log what we received
    console.log('Cancel request received:', {
      body: req.body,
      pending_id,
      reason,
      user_role: req.user.role
    });
    
    // Only vendor, staff, and canteen_manager can cancel sales
    if (!['vendor', 'staff', 'canteen_manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only staff, vendors, and canteen managers can cancel sales' });
    }
    
    if (!pending_id) {
      return res.status(400).json({ error: 'pending_id required' });
    }
    
    // Get pending sale details
    const [[pending]] = await pool.query(
      'SELECT * FROM pending_sales WHERE id = ?',
      [pending_id]
    );
    
    if (!pending) {
      return res.status(404).json({ error: 'Pending sale not found' });
    }
    
    // Check if already confirmed
    if (pending.confirmed === 1) {
      return res.status(400).json({ error: 'Sale already confirmed, cannot cancel' });
    }
    
    // Check if already cancelled
    if (pending.confirmed === 2) {
      return res.status(400).json({ error: 'Sale already cancelled' });
    }
    
    // Get vendor info
    const [[vendor]] = await pool.query(
      'SELECT name, username FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    
    // Normalize reason for consistency (store full human-readable text)
    const normalizedReason = reason || 'Cancelled by vendor';
    
    // Log cancellation to cancelled_transactions table (if it exists)
    try {
      await pool.query(
        `INSERT INTO cancelled_transactions (pending_id, item_name, amount, vendor_id, vendor_name, reason, cancelled_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          pending_id,
          pending.item_name,
          pending.amount,
          req.user.user_id,
          vendor?.name || vendor?.username || 'Unknown',
          normalizedReason
        ]
      );
      console.log(`[Vendor] Cancellation logged for sale #${pending_id}: ${normalizedReason}`);
    } catch (logError) {
      // Table might not exist yet - log to console instead
      console.error('[Vendor] Could not log cancellation to database:', logError.message);
      console.log(`[Vendor] Cancellation details - pending_id: ${pending_id}, item: ${pending.item_name}, reason: ${normalizedReason}`);
    }
    
    // Mark as cancelled (confirmed = 2 means cancelled/failed)
    await pool.query(
      'UPDATE pending_sales SET confirmed = 2 WHERE id = ?',
      [pending_id]
    );
    
    // Broadcast cancellation notification to students (if they tap after cancellation)
    broadcast('sale_cancelled', {
      pending_id,
      item_name: pending.item_name,
      amount: pending.amount,
      reason: reason || 'Cancelled by vendor',
      cancelled_by: vendor?.name || 'Vendor'
    });
    
    // Notify vendor
    sendToRole('vendor', 'sale_cancelled', {
      pending_id,
      item_name: pending.item_name,
      amount: pending.amount,
      reason: reason || 'No reason provided'
    });
    
    console.log(`[Vendor] Sale #${pending_id} cancelled by ${vendor?.name || 'vendor'}`);
    
    res.json({
      success: true,
      pending_id,
      message: 'Sale cancelled successfully',
      logged: true
    });
    
  } catch (err) {
    console.error('[Vendor] Cancel sale error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- CART ORDER (MULTI-ITEM) ENDPOINTS ---------- */
// Create a new order (header)
app.post('/orders', auth('vendor'), validate(createOrderSchema), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    const vendor_id = req.user.user_id;
    const cashier_id = req.user.user_id; // if you differentiate later, pass cashier_id from body
    const { device_id, notes } = req.body || {};
    
    // Validate vendor exists before inserting (prevent FK error)
    const [[vendorExists]] = await conn.query(
      'SELECT 1 FROM users WHERE user_id = ? LIMIT 1',
      [vendor_id]
    );
    if (!vendorExists) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Unknown vendor' });
    }
    
    // Insert order
    const [r] = await conn.query(
      `INSERT INTO orders (vendor_id, cashier_id, device_id, status, notes)
       VALUES (?, ?, ?, 'building', ?)`,
      [vendor_id, cashier_id || null, device_id || null, notes || null]
    );
    const order_id = r.insertId;
    
    await conn.commit();
    conn.release();
    res.json({ success: true, order_id, status: 'building' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    logger.error('Failed to create order', { error: err.message, vendor_id: req.user?.user_id });
    res.status(500).json({ error: err.message });
  }
});

// Add an item to order
app.post('/orders/:id/items', auth('vendor'), validate(orderIdParamSchema, 'params'), validate(addOrderItemSchema), async (req, res) => {
  try {
    const order_id = parseInt(req.params.id, 10);
    const { item_id, custom_item, price, qty } = req.body || {};
    
    // Verify order exists and belongs to vendor
    const [[order]] = await pool.query(
      'SELECT vendor_id, status FROM orders WHERE order_id = ?',
      [order_id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.vendor_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not your order' });
    }
    if (order.status !== 'building') {
      return res.status(400).json({ error: 'Order already submitted' });
    }
    
    const q = Math.max(1, parseInt(qty || 1, 10));

    let unitPrice = price != null ? parseFloat(price) : null;
    if (unitPrice == null && item_id) {
      const [[m]] = await pool.query('SELECT price FROM menu WHERE item_id=? AND active=1', [item_id]);
      if (!m) return res.status(404).json({ error: 'Menu item not found or inactive' });
      unitPrice = parseFloat(m.price);
    }
    if (!(unitPrice > 0)) return res.status(400).json({ error: 'valid price required' });

    await pool.query(
      `INSERT INTO order_items (order_id, item_id, custom_item, price, qty)
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, item_id || null, custom_item || null, unitPrice, q]
    );

    // Return updated order snapshot
    const [[o]] = await pool.query('SELECT order_id, subtotal, discount, total_amount, status FROM orders WHERE order_id=?', [order_id]);
    const [items] = await pool.query(
      `SELECT id, item_id, custom_item, price, qty, line_total
         FROM order_items WHERE order_id=? ORDER BY id ASC`, [order_id]
    );
    res.json({ success: true, order: o, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove an item line
app.delete('/orders/:id/items/:itemLineId', auth('vendor'), validate(orderIdParamSchema, 'params'), async (req, res) => {
  try {
    const order_id = parseInt(req.params.id, 10);
    const lineId = parseInt(req.params.itemLineId, 10);
    
    // Verify order belongs to vendor
    const [[order]] = await pool.query(
      'SELECT vendor_id, status FROM orders WHERE order_id = ?',
      [order_id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.vendor_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not your order' });
    }
    if (order.status !== 'building') {
      return res.status(400).json({ error: 'Cannot modify submitted order' });
    }
    
    await pool.query('DELETE FROM order_items WHERE id=? AND order_id=?', [lineId, order_id]);
    const [[o]] = await pool.query('SELECT order_id, subtotal, discount, total_amount, status FROM orders WHERE order_id=?', [order_id]);
    const [items] = await pool.query('SELECT id, item_id, custom_item, price, qty, line_total FROM order_items WHERE order_id=? ORDER BY id ASC', [order_id]);
    res.json({ success: true, order: o, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit order for RFID tap (creates pending sale)
app.post('/orders/:id/submit', auth('vendor'), validate(orderIdParamSchema, 'params'), async (req, res) => {
  try {
    const order_id = parseInt(req.params.id, 10);
    const [[o]] = await pool.query('SELECT order_id, vendor_id, total_amount, status FROM orders WHERE order_id=?', [order_id]);
    if (!o) return res.status(404).json({ error: 'Order not found' });
    if (o.vendor_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not your order' });
    }
    if (o.status !== 'building') {
      return res.status(400).json({ error: 'Order is not in building state' });
    }
    if (o.total_amount <= 0) {
      return res.status(400).json({ error: 'Order has no items or zero total' });
    }
    
    // Determine display name: if only 1 line item, show its name; else show 'Multi-item order'
    let displayName = 'Multi-item order';
    try {
      const [orderItems] = await pool.query(
        'SELECT item_id, custom_item, qty FROM order_items WHERE order_id = ? ORDER BY id ASC',
        [order_id]
      );
      if (Array.isArray(orderItems) && orderItems.length === 1) {
        const it = orderItems[0];
        if (it.custom_item && it.custom_item.trim()) {
          displayName = it.custom_item.trim() + (it.qty > 1 ? ` x${it.qty}` : '');
        } else if (it.item_id) {
          const [[mn]] = await pool.query('SELECT item_name FROM menu WHERE item_id = ?', [it.item_id]);
          if (mn && mn.item_name) {
            displayName = mn.item_name + (it.qty > 1 ? ` x${it.qty}` : '');
          }
        }
      }
    } catch (_) {
      // Fallback remains 'Multi-item order' on any lookup error
    }

    // Move to awaiting tap and create pending_sale
    await pool.query('UPDATE orders SET status="awaiting_tap" WHERE order_id=?', [order_id]);
    const [r] = await pool.query(
      'INSERT INTO pending_sales (order_id, item_name, amount, vendor_id) VALUES (?, ?, ?, ?)',
      [order_id, displayName, o.total_amount, o.vendor_id]
    );
    res.json({ success: true, pending_id: r.insertId, order_id, amount: o.total_amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get order snapshot
app.get('/orders/:id', auth('vendor'), validate(orderIdParamSchema, 'params'), async (req, res) => {
  try {
    const order_id = parseInt(req.params.id, 10);
    const [[o]] = await pool.query('SELECT * FROM orders WHERE order_id=?', [order_id]);
    if (!o) return res.status(404).json({ error: 'Not found' });
    const [items] = await pool.query('SELECT id, item_id, custom_item, price, qty, line_total FROM order_items WHERE order_id=? ORDER BY id ASC', [order_id]);
    res.json({ order: o, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /cancelled-transactions - Get all cancelled transactions (vendor only)
app.get('/cancelled-transactions', auth('vendor'), async (req, res) => {
  try {
    const [transactions] = await pool.query(
      `SELECT ct.*, ps.vendor_id 
       FROM cancelled_transactions ct
       JOIN pending_sales ps ON ct.pending_id = ps.id
       WHERE ps.vendor_id = ?
       ORDER BY ct.cancelled_at DESC
       LIMIT 100`,
      [req.user.user_id]
    );
    res.json(transactions);
  } catch (err) {
    console.error('[Vendor] Get cancelled transactions error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- VENDOR SALES ENDPOINTS ---------- */
// GET /sales - Get all sales transactions (vendor only, scoped to caller)
app.get('/sales', auth('vendor'), async (req, res) => {
  try {
    const vendor_id = req.user.user_id;
    const [transactions] = await pool.query(
      `SELECT t.tx_id, u.name AS student, 
              COALESCE(m.item_name, t.custom_item) AS item_name,
              t.amount, t.timestamp
       FROM transactions t
       JOIN users u ON t.user_id = u.user_id
       LEFT JOIN menu m ON t.item_id = m.item_id
       WHERE t.vendor_id = ?
       ORDER BY t.timestamp DESC
       LIMIT 100`,
      [vendor_id]
    );
    res.json(transactions);
  } catch (err) {
    logger.error('Vendor sales list error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /sales/week - Get 7-day sales statistics (vendor only, scoped to caller)
app.get('/sales/week', auth('vendor'), async (req, res) => {
  try {
    const vendor_id = req.user.user_id;
    const [stats] = await pool.query(
      `SELECT DATE(timestamp) as day, SUM(amount) as total, COUNT(*) as count
       FROM transactions
       WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         AND vendor_id = ?
       GROUP BY DATE(timestamp)
       ORDER BY day ASC`,
      [vendor_id]
    );
    res.json(stats);
  } catch (err) {
    logger.error('Vendor weekly sales error', { error: err.message });
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

app.get('/pending-reload/latest', auth('staff'), async (req, res) => {
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
app.post('/pending-reload/confirm', auth('staff'), validate(confirmPendingSchema), async (req, res) => {
  try {
    const { pending_id, uid, device_id } = req.body;
    console.log(`[Reload Confirm] Attempt: pending_id=${pending_id}, uid=${uid}, device=${device_id}`);
    
    if (!pending_id || !uid) return res.status(400).json({ error: 'pending_id and uid required' });

    const [[reloadReq]] = await pool.query(
      'SELECT * FROM pending_reloads WHERE id = ? AND confirmed = 0',
      [pending_id]
    );
    if (!reloadReq) {
      console.log(`[Reload Confirm] FAILED: Reload not found or already processed (id=${pending_id})`);
      return res.status(404).json({ error: 'Pending reload not found or already handled' });
    }

    const [[user]] = await pool.query(
      'SELECT user_id, name, balance, is_card_locked FROM users WHERE rfid_uid = ?',
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

    // Broadcast balance update to student
    sendToUser(user.user_id, 'balance_updated', {
      user_id: user.user_id,
      new_balance: newBal,
      amount: parseFloat(reloadReq.amount),
      type: 'reload',
      cashier_id: reloadReq.cashier_id
    });

    // Notify staff about completed reload
    sendToRole('staff', 'reload_completed', {
      pending_id,
      user_id: user.user_id,
      student_name: user.name,
      amount: reloadReq.amount,
      new_balance: newBal,
      cashier_id: reloadReq.cashier_id,
      device_id
    });

    res.json({ 
      success: true, 
      balance: newBal, 
      student_name: user.name,
      device_id: device_id || null 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/pending-reload/status/:id', auth('staff'), validate(statusParamSchema, 'params'), async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT pr.id, pr.amount, pr.confirmed, pr.created_at, pr.cashier_id
       FROM pending_reloads pr
       WHERE pr.id = ?`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });

    // Check if expired (5 minutes timeout)
    const TIMEOUT_MS = 5 * 60 * 1000;
    const expired = new Date(row.created_at).getTime() < (Date.now() - TIMEOUT_MS);
    
    // Auto-mark as failed if expired and not yet processed
    if (expired && row.confirmed === 0) {
      await pool.query('UPDATE pending_reloads SET confirmed = 2 WHERE id = ?', [req.params.id]);
      return res.json({
        confirmed: false,
        failed: true,
        expired: true,
        amount: row.amount
      });
    }

    // If confirmed, get student info from the most recent reload
    let student_name = null;
    if (row.confirmed === 1) {
      const [[reloadInfo]] = await pool.query(
        `SELECT u.name as student_name
         FROM reloads r
         JOIN users u ON r.user_id = u.user_id
         WHERE r.amount = ? AND r.cashier_id = ?
         ORDER BY r.timestamp DESC LIMIT 1`,
        [row.amount, row.cashier_id]
      );
      student_name = reloadInfo?.student_name || null;
    }

    res.json({
      confirmed: row.confirmed === 1,
      failed: row.confirmed === 2,
      expired: expired && row.confirmed === 0,
      amount: row.amount,
      student_name: student_name
    });
  } catch (err) {
    console.error('pending-reload/status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Cancel pending reload with reason
app.post('/pending-reload/cancel', auth('staff'), async (req, res) => {
  try {
    const { pending_id, reason } = req.body;

    if (!pending_id) {
      return res.status(400).json({ error: 'Pending ID is required' });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }

    // Get pending reload details before cancellation
    const [[pendingReload]] = await pool.query(
      `SELECT pr.*, u.name as cashier_name
       FROM pending_reloads pr
       LEFT JOIN users u ON pr.cashier_id = u.user_id
       WHERE pr.id = ?`,
      [pending_id]
    );

    if (!pendingReload) {
      return res.status(404).json({ error: 'Pending reload not found' });
    }

    if (pendingReload.confirmed !== 0) {
      return res.status(400).json({ error: 'Cannot cancel - transaction already processed' });
    }

    // Update the pending reload with cancellation info
    await pool.query(
      `UPDATE pending_reloads 
       SET confirmed = 2, 
           cancellation_reason = ?,
           cancelled_at = NOW()
       WHERE id = ?`,
      [reason.trim(), pending_id]
    );

    // Log the cancellation
    logger.warn('Top-up transaction cancelled', {
      action: 'TOPUP_CANCELLED',
      pending_id: pending_id,
      amount: pendingReload.amount,
      cashier_id: pendingReload.cashier_id,
      cashier_name: pendingReload.cashier_name || 'Unknown',
      reason: reason.trim(),
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'Top-up cancelled successfully',
      reason: reason.trim()
    });
  } catch (err) {
    logger.error('Error cancelling pending reload', {
      error: err.message,
      stack: err.stack,
      pending_id: req.body.pending_id
    });
    res.status(500).json({ error: 'Failed to cancel top-up' });
  }
});

/* ---------- MENU ---------- */
// Fallback inline implementation if router isn't loaded
if (!menuRouterLoaded) {
  app.get('/menu', auth(), asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      'SELECT item_id, item_name, price FROM menu WHERE active=1 ORDER BY item_name'
    );
    res.json(rows);
  }));
}

/* ---------- CANTEEN MANAGER MENU CRUD ---------- */
// Get all menu items (including inactive) - canteen_manager only
if (!menuRouterLoaded) {
  app.get('/menu-items', auth(), asyncHandler(async (req, res) => {
    if (req.user.role !== 'canteen_manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Canteen manager role required.' });
    }
    const [rows] = await pool.query(
      'SELECT item_id, item_name, price, active FROM menu ORDER BY item_name'
    );
    res.json(rows);
  }));
}

// Add new menu item - canteen_manager only (fallback)
if (!menuRouterLoaded) app.post('/menu-items', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'canteen_manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Canteen manager role required.' });
    }
    
    const { item_name, price, active } = req.body;
    
    if (!item_name || !price) {
      return res.status(400).json({ error: 'Item name and price are required' });
    }
    
    const activeValue = active === undefined ? 1 : (active ? 1 : 0);
    
    const [result] = await pool.query(
      'INSERT INTO menu (item_name, price, active) VALUES (?, ?, ?)',
      [item_name, parseFloat(price), activeValue]
    );
    
    logger.info('Menu item added', { 
      item_id: result.insertId, 
      item_name, 
      price,
      user_id: req.user.user_id 
    });
    
    res.json({ 
      success: true, 
      item_id: result.insertId,
      message: 'Menu item added successfully'
    });
  } catch (err) {
    logger.error('Error adding menu item:', { error: err.message, user_id: req.user.user_id });
    res.status(500).json({ error: err.message });
  }
});

// Update menu item - canteen_manager only (fallback)
if (!menuRouterLoaded) app.put('/menu-items/:id', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'canteen_manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Canteen manager role required.' });
    }
    
    const { id } = req.params;
    const { item_name, price, active } = req.body;
    
    if (!item_name || !price) {
      return res.status(400).json({ error: 'Item name and price are required' });
    }
    
    const activeValue = active === undefined ? 1 : (active ? 1 : 0);
    
    const [result] = await pool.query(
      'UPDATE menu SET item_name = ?, price = ?, active = ? WHERE item_id = ?',
      [item_name, parseFloat(price), activeValue, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    logger.info('Menu item updated', { 
      item_id: id, 
      item_name, 
      price, 
      active: activeValue,
      user_id: req.user.user_id 
    });
    
    res.json({ 
      success: true, 
      message: 'Menu item updated successfully'
    });
  } catch (err) {
    logger.error('Error updating menu item:', { error: err.message, user_id: req.user.user_id });
    res.status(500).json({ error: err.message });
  }
});

// Delete menu item - canteen_manager only (fallback)
if (!menuRouterLoaded) app.delete('/menu-items/:id', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'canteen_manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Canteen manager role required.' });
    }
    
    const { id } = req.params;
    
    const [result] = await pool.query(
      'DELETE FROM menu WHERE item_id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    logger.info('Menu item deleted', { 
      item_id: id,
      user_id: req.user.user_id 
    });
    
    res.json({ 
      success: true, 
      message: 'Menu item deleted successfully'
    });
  } catch (err) {
    logger.error('Error deleting menu item:', { error: err.message, user_id: req.user.user_id });
    res.status(500).json({ error: err.message });
  }
});

/* =====================
   ERROR HANDLER (centralized)
   ===================== */
// Place after route definitions
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Get menu analytics - canteen_manager only
app.get('/menu-analytics', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'canteen_manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Canteen manager role required.' });
    }
    
    // Get top selling items (last 30 days)
    const [topItems] = await pool.query(
      `SELECT 
        m.item_name,
        COUNT(*) as sales_count,
        SUM(t.amount) as total_revenue
      FROM transactions t
      JOIN menu m ON t.item_id = m.item_id
      WHERE t.timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY m.item_id, m.item_name
      ORDER BY sales_count DESC
      LIMIT 10`
    );
    
    // Get menu statistics
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active_items,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM menu`
    );
    
    res.json({
      topItems,
      stats: stats[0]
    });
  } catch (err) {
    logger.error('Error fetching menu analytics:', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

/* ---------- CLEANUP JOB ---------- */
// Clean up old pending records every 10 minutes
async function cleanupPendingRecords() {
  try {
    const CLEANUP_AGE_MINUTES = 10;
    
    // Clean up old pending sales (older than 10 minutes)
    const [salesResult] = await pool.query(
      `DELETE FROM pending_sales 
       WHERE created_at < (NOW() - INTERVAL ? MINUTE)`,
      [CLEANUP_AGE_MINUTES]
    );
    
    // Clean up old pending reloads (older than 10 minutes)
    const [reloadsResult] = await pool.query(
      `DELETE FROM pending_reloads 
       WHERE created_at < (NOW() - INTERVAL ? MINUTE)`,
      [CLEANUP_AGE_MINUTES]
    );
    
    // Clean up old pending RFID links (older than RFID_LINK_TTL_SEC + buffer)
    const [linksResult] = await pool.query(
      `DELETE FROM pending_rfid_links 
       WHERE created_at < (NOW() - INTERVAL ? SECOND)`,
      [RFID_LINK_TTL_SEC + 60]
    );
    
    const total = (salesResult.affectedRows || 0) + (reloadsResult.affectedRows || 0) + (linksResult.affectedRows || 0);
    if (total > 0) {
      logger.info('Cleanup: Removed old pending records', { 
        total, 
        sales: salesResult.affectedRows, 
        reloads: reloadsResult.affectedRows, 
        links: linksResult.affectedRows 
      });
    }
  } catch (err) {
    logger.error('Cleanup: Failed to clean up pending records', { error: err.message });
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupPendingRecords, 10 * 60 * 1000);
logger.info('Cleanup job scheduled to run every 10 minutes');

/* ==================== ADMIN USER MANAGEMENT (PRIVACY-FOCUSED) ==================== */

// TEMPORARY: First-time admin setup endpoint (REMOVE AFTER USE!)
app.post('/setup-admin', async (req, res) => {
  try {
    const { username, password, name } = req.body;
    
    // Check if any admin exists
    const [[existingAdmin]] = await pool.query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists. This endpoint is disabled.' });
    }

    // Create admin
    const hashedPassword = await bcrypt.hash(password || 'admin123', 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
      [username || 'admin', hashedPassword, name || 'System Administrator', 'admin']
    );

    res.json({ 
      success: true, 
      message: 'Admin account created successfully!',
      username: username || 'admin',
      password: password || 'admin123',
      note: 'Please login and change your password. Remove the /setup-admin endpoint from server.js after use!'
    });
  } catch (err) {
    console.error('Admin setup error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/users - List all users with pagination and filters (privacy-focused)
app.get('/admin/users', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      role = '', 
      card_status = '', 
      rfid_status = '',
      sort = 'name'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    let whereConditions = [];
    let params = [];

    // Search by name, username, or RFID
    if (search) {
      whereConditions.push('(u.name LIKE ? OR u.username LIKE ? OR u.rfid_uid LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Filter by role
    if (role) {
      whereConditions.push('u.role = ?');
      params.push(role);
    }

    // Filter by card lock status
    if (card_status === 'locked') {
      whereConditions.push('u.is_card_locked = 1');
    } else if (card_status === 'unlocked') {
      whereConditions.push('u.is_card_locked = 0');
    }

    // Filter by RFID status
    if (rfid_status === 'paired') {
      whereConditions.push('u.rfid_uid IS NOT NULL');
    } else if (rfid_status === 'unpaired') {
      whereConditions.push('u.rfid_uid IS NULL');
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Determine sort column
    let sortColumn = 'u.name';
    if (sort === 'username') sortColumn = 'u.username';
    else if (sort === 'created') sortColumn = 'u.created_at';
    else if (sort === 'role') sortColumn = 'u.role';

    // Get total count
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );

    // Get users (NO BALANCE - privacy!)
    const [users] = await pool.query(
      `SELECT 
        u.user_id,
        u.username,
        u.name,
        u.role,
        u.rfid_uid,
        u.is_card_locked,
        u.created_at,
        (SELECT COUNT(*) FROM transactions WHERE user_id = u.user_id) as transaction_count,
        (SELECT COUNT(*) FROM reloads WHERE user_id = u.user_id) as reload_count,
        (SELECT MAX(timestamp) FROM transactions WHERE user_id = u.user_id) as last_transaction
      FROM users u
      ${whereClause}
      ORDER BY ${sortColumn} ASC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      users,
      pagination: {
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    logger.error('Admin: Failed to load users list', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/users/:id - Get single user details (privacy-focused)
app.get('/admin/users/:id', adminAuth, async (req, res) => {
  try {
    const [[user]] = await pool.query(
      `SELECT 
        user_id,
        username,
        name,
        role,
        rfid_uid,
        is_card_locked,
        created_at
      FROM users 
      WHERE user_id = ?`,
      [req.params.id]
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get activity stats (counts only, no amounts!)
    const [[stats]] = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM transactions WHERE user_id = ?) as transaction_count,
        (SELECT COUNT(*) FROM reloads WHERE user_id = ?) as reload_count,
        (SELECT MAX(timestamp) FROM transactions WHERE user_id = ?) as last_transaction,
        (SELECT MAX(timestamp) FROM reloads WHERE user_id = ?) as last_reload
      FROM DUAL`,
      [user.user_id, user.user_id, user.user_id, user.user_id]
    );

    res.json({ ...user, stats });
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Username/password validation
const USERNAME_REGEX = /^[A-Za-z0-9._!\-]{3,32}$/; // allow letters, numbers, dot, underscore, hyphen, exclamation
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/; // 1 uppercase, 1 number, 1 special, min 8

// GET /admin/username-available?username=...
app.get('/admin/username-available', adminAuth, async (req, res) => {
  try {
    const { username } = req.query;
    if (!username || !USERNAME_REGEX.test(username)) {
      return res.json({ available: false, valid: false, message: 'Invalid username format' });
    }
    const [[existing]] = await pool.query('SELECT 1 FROM users WHERE username = ? LIMIT 1', [username]);
    res.json({ available: !existing, valid: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users - Create new user
app.post('/admin/users', adminAuth, async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: 'Username, password, name, and role are required' });
    }

    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-32 chars and may include letters, numbers, \'._!-\'' });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 chars with 1 uppercase, 1 number, and 1 special character' });
    }

    // Check if username exists
    const [[existing]] = await pool.query('SELECT 1 FROM users WHERE username = ?', [username]);
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
      [username, hashed, name, role]
    );

    res.json({ 
      success: true, 
      user_id: result.insertId,
      username,
      name,
      role
    });
  } catch (err) {
    console.error('Admin create user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/users/:id - Update user info
app.put('/admin/users/:id', adminAuth, async (req, res) => {
  try {
    const { name, role } = req.body;
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      params
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/users/:id - Delete user
app.delete('/admin/users/:id', adminAuth, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (parseInt(req.params.id) === req.user.user_id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await pool.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/reset-password - Reset user password
app.post('/admin/users/:id/reset-password', adminAuth, async (req, res) => {
  try {
    // Generate random temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashed = await bcrypt.hash(tempPassword, 10);

    await pool.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, req.params.id]);

    res.json({ 
      success: true, 
      temporary_password: tempPassword,
      temp_password: tempPassword  // Alias for backward compatibility
    });
  } catch (err) {
    console.error('Admin reset password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/lock - Lock user's card
app.post('/admin/users/:id/lock', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;

    await pool.query('UPDATE users SET is_card_locked = 1 WHERE user_id = ?', [req.params.id]);

    // TODO: Store lock reason in a separate table if needed
    
    res.json({ success: true });
  } catch (err) {
    console.error('Admin lock card error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/unlock - Unlock user's card
app.post('/admin/users/:id/unlock', adminAuth, async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_card_locked = 0 WHERE user_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Admin unlock card error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/unpair-rfid - Unpair RFID from user
app.post('/admin/users/:id/unpair-rfid', adminAuth, async (req, res) => {
  try {
    await pool.query('UPDATE users SET rfid_uid = NULL WHERE user_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Admin unpair RFID error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/stats - Overall system statistics
app.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'staff') as total_staff,
        (SELECT COUNT(*) FROM users WHERE role = 'vendor') as total_vendors,
        (SELECT COUNT(*) FROM users WHERE is_card_locked = 1) as locked_cards,
        (SELECT COUNT(*) FROM users WHERE rfid_uid IS NOT NULL) as paired_cards,
        (SELECT COUNT(*) FROM users WHERE rfid_uid IS NULL) as unpaired_users
      FROM DUAL
    `);

    // Add shorthand properties for backward compatibility
    res.json({
      ...stats,
      students: stats.total_students,
      staff: stats.total_staff,
      vendors: stats.total_vendors
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/vendors - Get list of all vendors
app.get('/admin/vendors', adminAuth, async (req, res) => {
  try {
    const [vendors] = await pool.query(`
      SELECT user_id, name, username, rfid_uid
      FROM users
      WHERE role = 'vendor'
      ORDER BY user_id ASC
    `);
    res.json(vendors);
  } catch (err) {
    console.error('Admin vendors error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/vendor/:vendorId/transactions - Get transactions for a specific vendor
app.get('/admin/vendor/:vendorId/transactions', adminAuth, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { start, end } = req.query;

    let query = `
      SELECT 
        t.tx_id as transaction_id,
        t.timestamp,
        t.amount,
        m.item_name,
        t.custom_item,
        u.name as student_name
      FROM transactions t
      LEFT JOIN menu m ON t.item_id = m.item_id
      LEFT JOIN users u ON t.user_id = u.user_id
      WHERE t.vendor_id = ?
    `;
    
    const params = [vendorId];

    if (start && end) {
      query += ` AND DATE(t.timestamp) BETWEEN ? AND ?`;
      params.push(start, end);
    }

    query += ` ORDER BY t.timestamp DESC LIMIT 100`;

    const [transactions] = await pool.query(query, params);
    res.json(transactions);
  } catch (err) {
    console.error('Admin vendor transactions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/vendor-stats - Get vendor sales statistics
app.get('/admin/vendor-stats', adminAuth, async (req, res) => {
  try {
    const { start, end } = req.query;

    let query = `
      SELECT 
        v.user_id,
        v.name,
        COALESCE(SUM(t.amount), 0) as totalSales,
        COUNT(DISTINCT t.tx_id) as totalTransactions
      FROM users v
      LEFT JOIN transactions t ON v.user_id = t.vendor_id
      WHERE v.role = 'vendor'
    `;
    
    const params = [];

    if (start && end) {
      query += ` AND DATE(t.timestamp) BETWEEN ? AND ?`;
      params.push(start, end);
    }

    query += `
      GROUP BY v.user_id, v.name
      ORDER BY totalSales DESC
    `;

    const [vendors] = await pool.query(query, params);

    // For each vendor, get their items sold
  const vendorStats = await Promise.all(vendors.map(async (vendor) => {
      let itemQuery = `
        SELECT 
          COALESCE(m.item_name, t.custom_item, 'Unknown') as name,
          COUNT(*) as qty
        FROM transactions t
        LEFT JOIN menu m ON t.item_id = m.item_id
        WHERE t.vendor_id = ?
      `;
      
      const itemParams = [vendor.user_id];
      
      if (start && end) {
        itemQuery += ` AND DATE(t.timestamp) BETWEEN ? AND ?`;
        itemParams.push(start, end);
      }
      
      itemQuery += ` GROUP BY name ORDER BY qty DESC LIMIT 10`;
      
      const [items] = await pool.query(itemQuery, itemParams);
      
      return {
        user_id: vendor.user_id,
        name: vendor.name,
        totalSales: parseFloat(vendor.totalSales || 0),
        totalTransactions: parseInt(vendor.totalTransactions || 0, 10),
        items: items
      };
    }));

    res.json(vendorStats);
  } catch (err) {
    console.error('Admin vendor stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/reload-stats - Get reload statistics
app.get('/admin/reload-stats', adminAuth, async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end dates are required' });
    }

    // Check if it's a single day (hourly data) or multiple days (daily data)
    const isSingleDay = start === end;

    let chartData;
    if (isSingleDay) {
      // Get hourly reload data for single day
      const [hourlyData] = await pool.query(`
        SELECT 
          HOUR(timestamp) as hour,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as amount
        FROM reloads
        WHERE DATE(timestamp) = ?
        GROUP BY HOUR(timestamp)
        ORDER BY hour ASC
      `, [start]);

      chartData = hourlyData.map(d => ({
        hour: parseInt(d.hour),
        count: parseInt(d.count),
        amount: parseFloat(d.amount)
      }));
    } else {
      // Get daily reload data for multiple days
      const [dailyData] = await pool.query(`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as amount
        FROM reloads
        WHERE DATE(timestamp) BETWEEN ? AND ?
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `, [start, end]);

      chartData = dailyData.map(d => ({
        date: d.date,
        count: parseInt(d.count),
        amount: parseFloat(d.amount)
      }));
    }

    // Get total statistics
    const [totals] = await pool.query(`
      SELECT 
        COUNT(*) as totalCount,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(AVG(amount), 0) as avgAmount,
        COALESCE(MAX(amount), 0) as topAmount
      FROM reloads
      WHERE DATE(timestamp) BETWEEN ? AND ?
    `, [start, end]);

    res.json({
      isSingleDay,
      chartData,
      totalCount: parseInt(totals[0].totalCount),
      totalAmount: parseFloat(totals[0].totalAmount),
      avgAmount: parseFloat(totals[0].avgAmount),
      topAmount: parseFloat(totals[0].topAmount)
    });
  } catch (err) {
    console.error('Admin reload stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/bulk-lock - Bulk lock cards
app.post('/admin/users/bulk-lock', adminAuth, async (req, res) => {
  try {
    const { user_ids, reason } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ error: 'user_ids array is required' });
    }

    const placeholders = user_ids.map(() => '?').join(',');
    await pool.query(
      `UPDATE users SET is_card_locked = 1 WHERE user_id IN (${placeholders})`,
      user_ids
    );

    res.json({ success: true, affected: user_ids.length });
  } catch (err) {
    console.error('Admin bulk lock error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/bulk-unlock - Bulk unlock cards
app.post('/admin/users/bulk-unlock', adminAuth, async (req, res) => {
  try {
    const { user_ids } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ error: 'user_ids array is required' });
    }

    const placeholders = user_ids.map(() => '?').join(',');
    await pool.query(
      `UPDATE users SET is_card_locked = 0 WHERE user_id IN (${placeholders})`,
      user_ids
    );

    res.json({ success: true, affected: user_ids.length });
  } catch (err) {
    console.error('Admin bulk unlock error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/bulk-role - Bulk change role
app.post('/admin/users/bulk-role', adminAuth, async (req, res) => {
  try {
    const { user_ids, new_role } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ error: 'user_ids array is required' });
    }
    if (!new_role) {
      return res.status(400).json({ error: 'new_role is required' });
    }

    const placeholders = user_ids.map(() => '?').join(',');
    await pool.query(
      `UPDATE users SET role = ? WHERE user_id IN (${placeholders})`,
      [new_role, ...user_ids]
    );

    res.json({ success: true, affected: user_ids.length });
  } catch (err) {
    console.error('Admin bulk role change error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- STATIC + START ---------- */
const port = process.env.PORT || 3000;
app.use(express.static('public'));

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
  app.listen(port, async () => {
    logger.info(`API server started on http://localhost:${port}`);
    const ok = await checkDb();
    if (ok) {
      logger.info('Database connection established successfully');
    } else {
      logger.error('Database connection failed');
    }
  });
}

// Export app for testing
module.exports = app;
