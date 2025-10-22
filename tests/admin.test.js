// tests/admin.test.js
// Admin operation tests for Smart Canteen System

const request = require('supertest');
const app = require('../server');
const { randomString, expectSuccess, expectError } = require('./helpers');

describe('Admin Operations', () => {
  
  let adminToken;
  let staffToken;
  let isAdminAvailable = false;
  
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
      isAdminAvailable = true;
    }
    
    // Login as staff for negative tests
    const staffLogin = await request(app)
      .post('/login')
      .send({
        username: 'staff',
        password: 'staff'
      });
    staffToken = staffLogin.body.token;
  });
  
  describe('GET /admin/users', () => {
    
    test('Admin should list users', async () => {
      if (!isAdminAvailable) {
        console.log('Skipping admin tests - no admin user');
        return;
      }
      
      const response = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
    });
    
    test('Non-admin should not list users', async () => {
      const response = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${staffToken}`);
      
      expectError(response, 403);
    });
    
    test('Should support pagination', async () => {
      if (!isAdminAvailable) return;
      
      const response = await request(app)
        .get('/admin/users')
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expectSuccess(response, 200);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
    });
    
    test('Should support search', async () => {
      if (!isAdminAvailable) return;
      
      const response = await request(app)
        .get('/admin/users')
        .query({ search: 'cedrick' })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('users');
    });
    
    test('Should support role filtering', async () => {
      if (!isAdminAvailable) return;
      
      const response = await request(app)
        .get('/admin/users')
        .query({ role: 'student' })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('users');
    });
    
  });
  
  describe('GET /admin/users/:id', () => {
    
    test('Admin should get user details', async () => {
      if (!isAdminAvailable) return;
      
      const response = await request(app)
        .get('/admin/users/1')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('user_id');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('role');
      }
    });
    
    test('Non-admin should not get user details', async () => {
      const response = await request(app)
        .get('/admin/users/1')
        .set('Authorization', `Bearer ${staffToken}`);
      
      expectError(response, 403);
    });
    
  });
  
  describe('GET /admin/stats', () => {
    
    test('Admin should get system statistics', async () => {
      if (!isAdminAvailable) return;
      
      const response = await request(app)
        .get('/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('total_users');
      expect(response.body).toHaveProperty('students');
      expect(response.body).toHaveProperty('staff');
      expect(response.body).toHaveProperty('vendors');
    });
    
    test('Non-admin should not access stats', async () => {
      const response = await request(app)
        .get('/admin/stats')
        .set('Authorization', `Bearer ${staffToken}`);
      
      expectError(response, 403);
    });
    
  });
  
  describe('POST /admin/users/:id/lock', () => {
    
    test('Admin should lock user card', async () => {
      if (!isAdminAvailable) return;
      
      const response = await request(app)
        .post('/admin/users/1/lock')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
    });
    
    test('Non-admin should not lock cards', async () => {
      const response = await request(app)
        .post('/admin/users/1/lock')
        .set('Authorization', `Bearer ${staffToken}`);
      
      expectError(response, 403);
    });
    
  });
  
  describe('POST /admin/users/:id/unlock', () => {
    
    test('Admin should unlock user card', async () => {
      if (!isAdminAvailable) return;
      
      const response = await request(app)
        .post('/admin/users/1/unlock')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
    });
    
    test('Non-admin should not unlock cards', async () => {
      const response = await request(app)
        .post('/admin/users/1/unlock')
        .set('Authorization', `Bearer ${staffToken}`);
      
      expectError(response, 403);
    });
    
  });
  
  describe('POST /admin/users/:id/unpair-rfid', () => {
    
    test('Admin should unpair RFID', async () => {
      if (!isAdminAvailable) return;
      
      const response = await request(app)
        .post('/admin/users/1/unpair-rfid')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
    });
    
    test('Non-admin should not unpair RFID', async () => {
      const response = await request(app)
        .post('/admin/users/1/unpair-rfid')
        .set('Authorization', `Bearer ${staffToken}`);
      
      expectError(response, 403);
    });
    
  });
  
  describe('POST /admin/users/:id/reset-password', () => {
    
    test('Admin should reset user password', async () => {
      if (!isAdminAvailable) return;
      
      const response = await request(app)
        .post('/admin/users/1/reset-password')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('temp_password');
      }
    });
    
    test('Non-admin should not reset passwords', async () => {
      const response = await request(app)
        .post('/admin/users/1/reset-password')
        .set('Authorization', `Bearer ${staffToken}`);
      
      expectError(response, 403);
    });
    
  });
  
  describe('Input Validation', () => {
    
    test('Should validate user ID parameter', async () => {
      if (!isAdminAvailable) return;
      
      const response = await request(app)
        .get('/admin/users/invalid')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expectError(response, 400);
    });
    
    test('Should validate pagination parameters', async () => {
      if (!isAdminAvailable) return;
      
      const response = await request(app)
        .get('/admin/users')
        .query({ page: -1 })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expectError(response, 400);
    });
    
  });
  
});

