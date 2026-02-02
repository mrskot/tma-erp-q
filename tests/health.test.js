// Файл: tests/health.test.js (ЗАМЕНИТЬ ПОЛНОСТЬЮ)
const request = require('supertest');
const app = require('../server');
const db = require('../src/config/database');

describe('Health Check Endpoints', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(() => {
      db.destroy(done);
    });
  });

  it('should return healthy status for /api/v1/health', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('status', 'healthy');
  });

  it('should return 401 for /api/v1/me when not authenticated', async () => {
    const res = await request(app)
      .get('/api/v1/me')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Требуется авторизация');
  });
});