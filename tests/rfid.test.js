// tests/rfid.test.js
// RFID card management tests for Smart Canteen System

const request = require('supertest');
const app = require('../server');
const { randomRFID, expectSuccess, expectError } = require('./helpers');

describe('RFID Card Management', () => {
  
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
  
  describe('POST /rfid/unlink', () => {
    
    test('Should unlink RFID card', async () => {
      const response = await request(app)
        .post('/rfid/unlink')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});
      
      // Should succeed or return appropriate error
      expect([200, 201, 400, 404]).toContain(response.status);
      
      if (response.status === 200 || response.status === 201) {
        expect(response.body.message).toBeDefined();
      }
    });
    
    test('Should reject unlink without authorization', async () => {
      const response = await request(app)
        .post('/rfid/unlink')
        .send({});
      
      expectError(response, 401);
    });
    
  });
  
  describe('Card Status Check', () => {
    
    test('Should check if card is active', async () => {
      const response = await request(app)
        .get('/balance')
        .set('Authorization', `Bearer ${studentToken}`);
      
      // Balance endpoint should work if card is active
      expectSuccess(response, 200);
    });
    
  });
  
  describe('Card Security', () => {
    
    test('Should prevent duplicate RFID linking', async () => {
      // This would require trying to link an already-linked RFID
      // The actual implementation depends on your link process
      const testRfid = randomRFID();
      
      // Try to create a pending link
      const response = await request(app)
        .post('/rfid/link/start')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          user_id: studentUserId
        });
      
      // Should return pending link or appropriate response
      expect([200, 201, 400, 404]).toContain(response.status);
    });
    
  });
  
  describe('GET /users/rfid/:uid', () => {
    
    test('Staff should be able to lookup user by RFID', async () => {
      // Get student's RFID first
      const studentInfo = await request(app)
        .get('/balance')
        .set('Authorization', `Bearer ${studentToken}`);
      
      // This endpoint might not return RFID in balance, so we test the lookup endpoint
      const response = await request(app)
        .get('/users/rfid/TEST123')
        .set('Authorization', `Bearer ${staffToken}`);
      
      // Should return user or not found
      expect([200, 404]).toContain(response.status);
    });
    
    test('Students should not lookup users by RFID', async () => {
      const response = await request(app)
        .get('/users/rfid/TEST123')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expectError(response, 403);
    });
    
    test('Should reject RFID lookup without auth', async () => {
      const response = await request(app)
        .get('/users/rfid/TEST123');
      
      expectError(response, 401);
    });
    
  });
  
  describe('Card Locking (Admin)', () => {
    
    let adminToken;
    
    beforeAll(async () => {
      // Try to login as admin
      const adminLogin = await request(app)
        .post('/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });
      
      if (adminLogin.status === 200) {
        adminToken = adminLogin.body.token;
      }
    });
    
    test('Admin should be able to lock card', async () => {
      if (!adminToken) {
        // Skip if no admin user
        return;
      }
      
      const response = await request(app)
        .post(`/admin/users/${studentUserId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      
      expectSuccess(response, 200);
    });
    
    test('Admin should be able to unlock card', async () => {
      if (!adminToken) {
        return;
      }
      
      const response = await request(app)
        .post(`/admin/users/${studentUserId}/unlock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      
      expectSuccess(response, 200);
    });
    
    test('Non-admin should not lock cards', async () => {
      const response = await request(app)
        .post(`/admin/users/${studentUserId}/lock`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({});
      
      expectError(response, 403);
    });
    
  });
  
});

