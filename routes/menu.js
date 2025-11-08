// routes/menu.js
// Modularized menu and menu-items endpoints (initial extraction)
const express = require('express');

module.exports = function buildMenuRouter({ pool, auth, asyncHandler, logger }) {
  const router = express.Router();

  // GET /menu - active items for all authenticated roles
  router.get('/menu', auth(), asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      'SELECT item_id, item_name, price FROM menu WHERE active=1 ORDER BY item_name'
    );
    res.json(rows);
  }));

  // GET /menu-items - full list (canteen_manager or admin)
  router.get('/menu-items', auth(), asyncHandler(async (req, res) => {
    if (req.user.role !== 'canteen_manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Canteen manager role required.' });
    }
    const [rows] = await pool.query(
      'SELECT item_id, item_name, price, active FROM menu ORDER BY item_name'
    );
    res.json(rows);
  }));

  // POST /menu-items - add new item
  router.post('/menu-items', auth(), asyncHandler(async (req, res) => {
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
    logger.info('Menu item added (modular route)', { item_id: result.insertId, item_name, price, user_id: req.user.user_id });
    res.json({ success: true, item_id: result.insertId, message: 'Menu item added successfully' });
  }));

  // PUT /menu-items/:id - update
  router.put('/menu-items/:id', auth(), asyncHandler(async (req, res) => {
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
    logger.info('Menu item updated (modular route)', { item_id: id, item_name, price, active: activeValue, user_id: req.user.user_id });
    res.json({ success: true, message: 'Menu item updated successfully' });
  }));

  // DELETE /menu-items/:id - delete
  router.delete('/menu-items/:id', auth(), asyncHandler(async (req, res) => {
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
    logger.info('Menu item deleted (modular route)', { item_id: id, user_id: req.user.user_id });
    res.json({ success: true, message: 'Menu item deleted successfully' });
  }));

  return router;
};