// tests/balance.test.js
// Balance operation tests for Smart Canteen System

const request = require('supertest');
const app = require('../server');
const { loginUser, randomRFID, expectSuccess, expectError } = require('./helpers');

describe('Balance Operations', () => {
  
  let studentToken;
  let staffToken;
  let studentUserId;
  
  beforeAll(async () => {
    // Login as student
    const studentLogin = await request(app)
      .post('/login')
      .send({
        username: 'cedrick',
        password: 'pass'
      });
    studentToken = studentLogin.body.token;
    studentUserId = studentLogin.body.userId;
    
    // Login as staff
    const staffLogin = await request(app)
      .post('/login')
      .send({
        username: 'staff',
        password: 'staff'
      });
    staffToken = staffLogin.body.token;
  });
  
  describe('GET /balance', () => {
    
    test('Should get student balance with valid token', async () => {
      const response = await request(app)
        .get('/balance')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('balance');
      expect(typeof response.body.balance).toBe('number');
    });
    
    test('Should reject balance request without token', async () => {
      const response = await request(app)
        .get('/balance');
      
      expectError(response, 401);
    });
    
    test('Should get balance for specific user (staff)', async () => {
      const response = await request(app)
        .get(`/balance/${studentUserId}`)
        .set('Authorization', `Bearer ${staffToken}`);
      
      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('balance');
    });
    
  });
  
  describe('POST /reload (Balance Reload)', () => {
    
    test('Staff should be able to reload student balance', async () => {
      const initialBalance = await request(app)
        .get('/balance')
        .set('Authorization', `Bearer ${studentToken}`);
      
      const reloadAmount = 100;
      const response = await request(app)
        .post('/reload')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          user_id: studentUserId,
          amount: reloadAmount,
          rfid_uid: randomRFID()
        });
      
      expectSuccess(response, 201);
      expect(response.body.message).toContain('Reload successful');
      
      // Verify balance increased
      const newBalance = await request(app)
        .get('/balance')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(parseFloat(newBalance.body.balance)).toBeGreaterThanOrEqual(
        parseFloat(initialBalance.body.balance) + reloadAmount
      );
    });
    
    test('Should reject reload with negative amount', async () => {
      const response = await request(app)
        .post('/reload')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          user_id: studentUserId,
          amount: -50,
          rfid_uid: randomRFID()
        });
      
      expectError(response, 400);
      expect(response.body.error).toContain('amount');
    });
    
    test('Should reject reload with zero amount', async () => {
      const response = await request(app)
        .post('/reload')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          user_id: studentUserId,
          amount: 0,
          rfid_uid: randomRFID()
        });
      
      expectError(response, 400);
    });
    
    test('Should reject reload without user_id', async () => {
      const response = await request(app)
        .post('/reload')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          amount: 100,
          rfid_uid: randomRFID()
        });
      
      expectError(response, 400);
    });
    
    test('Should reject reload with invalid user_id', async () => {
      const response = await request(app)
        .post('/reload')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          user_id: 99999,
          amount: 100,
          rfid_uid: randomRFID()
        });
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
    
    test('Students should not be able to reload balance', async () => {
      const response = await request(app)
        .post('/reload')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          user_id: studentUserId,
          amount: 100,
          rfid_uid: randomRFID()
        });
      
      expectError(response, 403);
    });
    
    test('Should reject reload without authorization', async () => {
      const response = await request(app)
        .post('/reload')
        .send({
          user_id: studentUserId,
          amount: 100,
          rfid_uid: randomRFID()
        });
      
      expectError(response, 401);
    });
    
  });
  
  describe('GET /reloads (Reload History)', () => {
    
    test('Staff should be able to view reload history', async () => {
      const response = await request(app)
        .get('/reloads')
        .set('Authorization', `Bearer ${staffToken}`);
      
      expectSuccess(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('Students should not access reload history', async () => {
      const response = await request(app)
        .get('/reloads')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expectError(response, 403);
    });
    
  });
  
  describe('GET /reloads/week (Weekly Statistics)', () => {
    
    test('Staff should get weekly reload statistics', async () => {
      const response = await request(app)
        .get('/reloads/week')
        .set('Authorization', `Bearer ${staffToken}`);
      
      expectSuccess(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Check structure of statistics
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('day');
        expect(response.body[0]).toHaveProperty('total');
      }
    });
    
    test('Students should not access weekly statistics', async () => {
      const response = await request(app)
        .get('/reloads/week')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expectError(response, 403);
    });
    
  });
  
});

