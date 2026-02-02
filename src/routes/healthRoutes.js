const express = require('express');
const router = express.Router();
const db = require('../config/database');
const config = require('../config/app');
const { authenticateJWT, requireAuth } = require('../middleware/auth');

router.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'TMA-ERP-Q работает!', environment: config.env });
});

router.get('/health/db', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({ status: 'healthy', message: 'Database connection successful' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', message: 'Database connection failed' });
  }
});

router.get('/me', authenticateJWT, requireAuth, (req, res) => {
  res.json({ user: req.user, environment: config.env });
});

// Этот роут остается для ручной проверки в браузере
router.get('/me/fake', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated via Fake Auth' });
  }
  res.json({ user: req.user, isFakeAuth: req.isFakeAuth, environment: config.env });
});

module.exports = router;
