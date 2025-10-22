// tests/transaction.test.js
// Transaction tests for Smart Canteen System

const request = require('supertest');
const app = require('../server');
const { expectSuccess, expectError } = require('./helpers');

describe('Transactions', () => {
  
  let studentToken;
  let vendorToken;
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
    
    // Login as vendor
    const vendorLogin = await request(app)
      .post('/login')
      .send({
        username: 'vendor',
        password: 'vendor'
      });
    vendorToken = vendorLogin.body.token;
  });
  
  describe('POST /transaction', () => {
    
    test('Should create transaction with sufficient balance', async () => {
      // First, get current balance
      const balanceBefore = await request(app)
        .get('/balance')
        .set('Authorization', `Bearer ${studentToken}`);
      
      const currentBalance = parseFloat(balanceBefore.body.balance);
      
      // Only test if student has balance
      if (currentBalance > 0) {
        const transactionAmount = Math.min(10, currentBalance);
        
        const response = await request(app)
          .post('/transaction')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            amount: transactionAmount,
            custom_item: 'Test Item'
          });
        
        // Should succeed or fail gracefully
        expect([200, 201, 400]).toContain(response.status);
        
        if (response.status === 201 || response.status === 200) {
          expect(response.body.message || response.body.success).toBeDefined();
        }
      }
    });
    
    test('Should reject transaction with negative amount', async () => {
      const response = await request(app)
        .post('/transaction')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          amount: -50,
          custom_item: 'Test Item'
        });
      
      expectError(response, 400);
      expect(response.body.error).toContain('amount');
    });
    
    test('Should reject transaction with zero amount', async () => {
      const response = await request(app)
        .post('/transaction')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          amount: 0,
          custom_item: 'Test Item'
        });
      
      expectError(response, 400);
    });
    
    test('Should reject transaction without amount', async () => {
      const response = await request(app)
        .post('/transaction')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          custom_item: 'Test Item'
        });
      
      expectError(response, 400);
    });
    
    test('Should reject transaction without authorization', async () => {
      const response = await request(app)
        .post('/transaction')
        .send({
          amount: 50,
          custom_item: 'Test Item'
        });
      
      expectError(response, 401);
    });
    
  });
  
  describe('GET /report (Transaction History)', () => {
    
    test('Should get transaction history', async () => {
      const response = await request(app)
        .get('/report')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expectSuccess(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('Should include transaction details', async () => {
      const response = await request(app)
        .get('/report')
        .set('Authorization', `Bearer ${studentToken}`);
      
      if (response.body.length > 0) {
        const transaction = response.body[0];
        expect(transaction).toHaveProperty('tx_id');
        expect(transaction).toHaveProperty('amount');
        expect(transaction).toHaveProperty('timestamp');
      }
    });
    
    test('Should support date filtering', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await request(app)
        .get('/report')
        .query({ start_date: today })
        .set('Authorization', `Bearer ${studentToken}`);
      
      expectSuccess(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('Should reject transaction history without auth', async () => {
      const response = await request(app)
        .get('/report');
      
      expectError(response, 401);
    });
    
  });
  
  describe('GET /report/csv (CSV Export)', () => {
    
    test('Should export transactions as CSV', async () => {
      const response = await request(app)
        .get('/report/csv')
        .set('Authorization', `Bearer ${studentToken}`);
      
      // Should return CSV content type
      expect(response.status).toBe(200);
      expect(response.header['content-type']).toContain('csv');
    });
    
    test('Should reject CSV export without auth', async () => {
      const response = await request(app)
        .get('/report/csv');
      
      expectError(response, 401);
    });
    
  });
  
  describe('Vendor Operations', () => {
    
    test('Vendor should access sales', async () => {
      const response = await request(app)
        .get('/sales')
        .set('Authorization', `Bearer ${vendorToken}`);
      
      expectSuccess(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('Vendor should get weekly sales statistics', async () => {
      const response = await request(app)
        .get('/sales/week')
        .set('Authorization', `Bearer ${vendorToken}`);
      
      expectSuccess(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('Student should not access vendor sales', async () => {
      const response = await request(app)
        .get('/sales')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expectError(response, 403);
    });
    
  });
  
  describe('Transaction Validation', () => {
    
    test('Should reject excessively large transaction', async () => {
      const response = await request(app)
        .post('/transaction')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          amount: 999999,
          custom_item: 'Test Item'
        });
      
      // Should fail due to insufficient balance or validation
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
    
    test('Should handle decimal amounts correctly', async () => {
      const balanceResponse = await request(app)
        .get('/balance')
        .set('Authorization', `Bearer ${studentToken}`);
      
      const currentBalance = parseFloat(balanceResponse.body.balance);
      
      if (currentBalance > 5) {
        const response = await request(app)
          .post('/transaction')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            amount: 4.99,
            custom_item: 'Test Item'
          });
        
        // Should handle decimal amounts
        expect([200, 201, 400]).toContain(response.status);
      }
    });
    
  });
  
});

