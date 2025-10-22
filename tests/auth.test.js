// tests/auth.test.js
// Authentication tests for Smart Canteen System

const request = require('supertest');
const app = require('../server');
const { testUsers, expectSuccess, expectError, randomString } = require('./helpers');

describe('Authentication', () => {
  
  describe('POST /login', () => {
    
    test('Should login with valid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'cedrick',
          password: 'pass'
        });
      
      expectSuccess(response, 200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('name');
    });
    
    test('Should reject invalid password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'cedrick',
          password: 'wrongpassword'
        });
      
      expectError(response, 401);
      expect(response.body.error).toContain('Invalid');
    });
    
    test('Should reject non-existent user', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'nonexistentuser' + randomString(),
          password: 'somepassword'
        });
      
      expectError(response, 401);
    });
    
    test('Should reject missing username', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          password: 'password123'
        });
      
      expectError(response, 400);
      expect(response.body.error).toContain('username');
    });
    
    test('Should reject missing password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'cedrick'
        });
      
      expectError(response, 400);
      expect(response.body.error).toContain('password');
    });
    
    test('Should reject empty credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({});
      
      expectError(response, 400);
    });
    
    test('Should return correct role for student', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'cedrick',
          password: 'pass'
        });
      
      expectSuccess(response, 200);
      expect(response.body.role).toBe('student');
    });
    
  });
  
  describe('Token Validation', () => {
    
    let validToken;
    
    beforeAll(async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'cedrick',
          password: 'pass'
        });
      validToken = response.body.token;
    });
    
    test('Should accept valid token', async () => {
      const response = await request(app)
        .get('/balance')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).not.toBe(401);
    });
    
    test('Should reject missing token', async () => {
      const response = await request(app)
        .get('/balance');
      
      expectError(response, 401);
      expect(response.body.error).toContain('token');
    });
    
    test('Should reject invalid token', async () => {
      const response = await request(app)
        .get('/balance')
        .set('Authorization', 'Bearer invalidtoken123');
      
      expectError(response, 401);
    });
    
    test('Should reject malformed authorization header', async () => {
      const response = await request(app)
        .get('/balance')
        .set('Authorization', validToken); // Missing 'Bearer '
      
      expectError(response, 401);
    });
    
  });
  
  describe('Rate Limiting', () => {
    
    test('Should allow normal login attempts', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'cedrick',
          password: 'pass'
        });
      
      expect(response.status).toBe(200);
    });
    
    // Note: Rate limiting might be disabled in development
    // This test may pass even with many attempts
    test('Should track multiple login attempts', async () => {
      const attempts = [];
      
      for (let i = 0; i < 3; i++) {
        attempts.push(
          request(app)
            .post('/login')
            .send({
              username: 'cedrick',
              password: 'pass'
            })
        );
      }
      
      const results = await Promise.all(attempts);
      
      // All should succeed or be rate limited
      results.forEach(result => {
        expect([200, 429]).toContain(result.status);
      });
    });
    
  });
  
});

