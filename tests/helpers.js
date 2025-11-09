// tests/helpers.js
// Test helper utilities for Smart Canteen tests

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Generate a valid JWT token for testing
 */
function generateToken(userId, role = 'student') {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Test environment missing JWT_SECRET. Set it in tests/setup.js or before running Jest.');
  }
  return jwt.sign(
    { userId, role },
    secret,
    { expiresIn: '24h' }
  );
}

/**
 * Create test user credentials
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Test user fixtures
 */
const testUsers = {
  student: {
    username: 'teststudent',
    password: 'student123',
    name: 'Test Student',
    role: 'student'
  },
  staff: {
    username: 'teststaff',
    password: 'staff123',
    name: 'Test Staff',
    role: 'staff'
  },
  vendor: {
    username: 'testvendor',
    password: 'vendor123',
    name: 'Test Vendor',
    role: 'vendor'
  },
  admin: {
    username: 'testadmin',
    password: 'admin123',
    name: 'Test Admin',
    role: 'admin'
  }
};

/**
 * Helper to login and get token
 */
async function loginUser(app, username, password) {
  const response = await request(app)
    .post('/login')
    .send({ username, password });
  
  return response.body.token;
}

/**
 * Helper to create authenticated request
 */
function authenticatedRequest(app, method, endpoint, token) {
  return request(app)
    [method](endpoint)
    .set('Authorization', `Bearer ${token}`);
}

/**
 * Wait helper for async operations
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Random string generator
 */
function randomString(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}

/**
 * Random RFID UID generator
 */
function randomRFID() {
  return randomString(8);
}

/**
 * Assert response success
 */
function expectSuccess(response, statusCode = 200) {
  expect(response.status).toBe(statusCode);
  expect(response.body).toBeDefined();
}

/**
 * Assert response error
 */
function expectError(response, statusCode = 400) {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('error');
}

/**
 * Test data cleanup helper
 */
const cleanup = {
  userIds: [],
  rfidUids: [],
  transactionIds: [],
  
  addUser(userId) {
    this.userIds.push(userId);
  },
  
  addRfid(rfidUid) {
    this.rfidUids.push(rfidUid);
  },
  
  addTransaction(txId) {
    this.transactionIds.push(txId);
  },
  
  reset() {
    this.userIds = [];
    this.rfidUids = [];
    this.transactionIds = [];
  }
};

module.exports = {
  generateToken,
  hashPassword,
  testUsers,
  loginUser,
  authenticatedRequest,
  wait,
  randomString,
  randomRFID,
  expectSuccess,
  expectError,
  cleanup
};

