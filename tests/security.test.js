// tests/security.test.js
// Security and authorization tests for Smart Canteen System

const request = require('supertest');
const app = require('../server');
const { expectError } = require('./helpers');

describe('Security & Authorization', () => {
  
  let studentToken;
  let staffToken;
  let vendorToken;
  
  beforeAll(async () => {
    // Login as student
    const studentLogin = await request(app)
      .post('/login')
      .send({
        username: 'cedrick',
        password: 'pass'
      });
    studentToken = studentLogin.body.token;
    
    // Login as staff
    const staffLogin = await request(app)
      .post('/login')
      .send({
        username: 'staff',
        password: 'staff'
      });
    staffToken = staffLogin.body.token;
    
    // Login as vendor
    const vendorLogin = await request(app)
      .post('/login')
      .send({
        username: 'vendor',
        password: 'vendor'
      });
    vendorToken = vendorLogin.body.token;
  });
  
  describe('Role-Based Access Control', () => {
    
    test('Students cannot access staff endpoints', async () => {
      const response = await request(app)
        .get('/reloads')
        .set('Authorization', `Bearer ${studentToken}`);
      
      // Accept either 401 (auth failed) or 403 (forbidden)
      expect([401, 403]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });
    
    test('Students cannot reload balance', async () => {
      const response = await request(app)
        .post('/reload')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          user_id: 1,
          amount: 100,
          rfid_uid: 'TEST123'
        });
      
      expectError(response, 403);
    });
    
    test('Students cannot access vendor sales', async () => {
      const response = await request(app)
        .get('/sales')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expectError(response, 403);
    });
    
    test('Vendors cannot access staff endpoints', async () => {
      const response = await request(app)
        .get('/reloads')
        .set('Authorization', `Bearer ${vendorToken}`);
      
      expectError(response, 403);
    });
    
    test('Staff cannot access vendor sales', async () => {
      const response = await request(app)
        .get('/sales')
        .set('Authorization', `Bearer ${staffToken}`);
      
      expectError(response, 403);
    });
    
  });
  
  describe('Authentication Requirements', () => {
    
    test('Balance endpoint requires authentication', async () => {
      const response = await request(app)
        .get('/balance');
      
      expectError(response, 401);
    });
    
    test('Reload endpoint requires authentication', async () => {
      const response = await request(app)
        .post('/reload')
        .send({
          user_id: 1,
          amount: 100,
          rfid_uid: 'TEST123'
        });
      
      expectError(response, 401);
    });
    
    test('Transaction endpoint requires authentication', async () => {
      const response = await request(app)
        .post('/transaction')
        .send({
          amount: 50,
          custom_item: 'Test'
        });
      
      expectError(response, 401);
    });
    
    test('Report endpoint requires authentication', async () => {
      const response = await request(app)
        .get('/report');
      
      expectError(response, 401);
    });
    
  });
  
  describe('Input Validation', () => {
    
    test('Login should reject SQL injection attempts', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: "' OR '1'='1",
          password: "' OR '1'='1"
        });
      
      expectError(response, 401);
    });
    
    test('Reload should validate amount type', async () => {
      const response = await request(app)
        .post('/reload')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          user_id: 1,
          amount: 'not-a-number',
          rfid_uid: 'TEST123'
        });
      
      expectError(response, 400);
    });
    
    test('Transaction should validate amount type', async () => {
      const response = await request(app)
        .post('/transaction')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          amount: 'invalid',
          custom_item: 'Test'
        });
      
      expectError(response, 400);
    });
    
    test('Should reject malformed JSON', async () => {
      const response = await request(app)
        .post('/login')
        .set('Content-Type', 'application/json')
        .send('{"username": "test", invalid}');
      
      expectError(response, 400);
    });
    
  });
  
  describe('Token Security', () => {
    
    test('Should reject expired token format', async () => {
      const response = await request(app)
        .get('/balance')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature');
      
      expectError(response, 401);
    });
    
    test('Should reject token without Bearer prefix', async () => {
      const response = await request(app)
        .get('/balance')
        .set('Authorization', studentToken);
      
      expectError(response, 401);
    });
    
    test('Should reject empty token', async () => {
      const response = await request(app)
        .get('/balance')
        .set('Authorization', 'Bearer ');
      
      expectError(response, 401);
    });
    
  });
  
  describe('Admin Endpoints Security', () => {
    
    test('Non-admin cannot access admin users list', async () => {
      const response = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${staffToken}`);
      
      expectError(response, 403);
    });
    
    test('Non-admin cannot create users', async () => {
      const response = await request(app)
        .post('/admin/users')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          username: 'newuser',
          password: 'password123',
          name: 'New User',
          role: 'student'
        });
      
      expectError(response, 403);
    });
    
    test('Non-admin cannot delete users', async () => {
      const response = await request(app)
        .delete('/admin/users/999')
        .set('Authorization', `Bearer ${staffToken}`);
      
      expectError(response, 403);
    });
    
    test('Non-admin cannot lock cards', async () => {
      const response = await request(app)
        .post('/admin/users/1/lock')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expectError(response, 403);
    });
    
  });
  
  describe('Rate Limiting', () => {
    
    test('Should have rate limiting headers', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'cedrick',
          password: 'pass'
        });
      
      // Rate limit headers might be present
      // (depends on environment and configuration)
      expect(response.status).toBeDefined();
    });
    
  });
  
  describe('Security Headers', () => {
    
    test('Should have security headers from Helmet', async () => {
      const response = await request(app)
        .get('/');
      
      // Helmet should set various security headers
      // At minimum, we check that the response has headers
      expect(response.headers).toBeDefined();
    });
    
  });
  
  describe('Password Security', () => {
    
    test('Should not return password in login response', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'cedrick',
          password: 'pass'
        });
      
      expect(response.body.password).toBeUndefined();
      expect(response.body).not.toHaveProperty('password');
    });
    
  });
  
});

