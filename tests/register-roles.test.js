// tests/register-roles.test.js
// Regression test: public registration cannot create privileged roles

const request = require('supertest');
const app = require('../server');
const { randomString } = require('./helpers');

describe('Registration Role Security', () => {
  test('Anonymous /register always yields student role', async () => {
    const username = 'test_' + randomString();
    const res = await request(app)
      .post('/register')
      .send({
        name: 'Test User',
        username,
        password: 'Password1!'
      });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('student');
  });

  test('Anonymous /register cannot escalate to admin', async () => {
    const username = 'test_' + randomString();
    const res = await request(app)
      .post('/register')
      .send({
        name: 'Test User',
        username,
        password: 'Password1!',
        role: 'admin'
      });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('student');
  });

  test('Anonymous /register cannot escalate to staff', async () => {
    const username = 'test_' + randomString();
    const res = await request(app)
      .post('/register')
      .send({
        name: 'Test User',
        username,
        password: 'Password1!',
        role: 'staff'
      });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('student');
  });
});
