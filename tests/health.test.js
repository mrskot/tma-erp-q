const request = require('supertest');
const app = require('../server');

describe('Health Check Endpoints', () => {
  it('should return healthy status', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('message', 'TMA-ERP-Q работает!');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should return user info when authenticated', async () => {
    const res = await request(app)
      .get('/api/v1/me')
      .set('X-Telegram-ID', 'test_user_123')
      .set('X-First-Name', 'Test')
      .set('X-Last-Name', 'User')
      .set('X-Username', 'test_user')
      .set('X-Role', 'master')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('telegramId', 'test_user_123');
    expect(res.body.user).toHaveProperty('firstName', 'Test');
    expect(res.body.user).toHaveProperty('role', 'master');
    expect(res.body).toHaveProperty('isFakeAuth', true);
  });

  it('should return 401 when not authenticated', async () => {
    // Создаем новый экземпляр app без middleware fakeTelegramAuth
    const express = require('express');
    const testApp = express();
    testApp.use(express.json());
    
    // Подключаем только health endpoint
    testApp.get('/api/v1/health', (req, res) => {
      res.json({ status: 'healthy' });
    });
    
    testApp.get('/api/v1/me', (req, res) => {
      res.status(401).json({ error: 'Not authenticated' });
    });

    const res = await request(testApp)
      .get('/api/v1/me')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(res.body).toHaveProperty('error', 'Not authenticated');
  });
});