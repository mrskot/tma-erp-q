const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const config = require('./src/config/app');
const { fakeTelegramAuth } = require('./src/middleware/fakeTelegramAuth');
const apiRoutes = require('./src/routes');
const db = require('./src/config/database');

const app = express();
const PORT = config.port;

// Security middleware - НАСТРОИМ ДЛЯ РАЗРАБОТКИ
if (config.env === 'production') {
app.use(helmet());
} else {
  // В разработке используем более мягкие настройки
  app.use(helmet({
    contentSecurityPolicy: false, // Отключаем CSP для разработки
    crossOriginEmbedderPolicy: false,
}));
}

app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fake Telegram Auth middleware
app.use(fakeTelegramAuth);

// Serve static files - ПЕРВОЕ ДЕЛО!
app.use(express.static('public'));

// Главная страница
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'TMA-ERP-Q работает!',
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: '1.0.0',
  });
});

// Database health check
app.get('/api/v1/health/db', async (req, res) => {
  try {
    const db = require('./src/config/database');
    await db.raw('SELECT 1');
    res.json({
      status: 'healthy',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Basic API routes
app.get('/api/v1/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({
    user: req.user,
    isFakeAuth: req.isFakeAuth || false,
    environment: config.env,
  });
});

// API Routes
console.log('📚 Загружаем API маршруты...');

// Middleware для логирования API запросов
app.use('/api', (req, res, next) => {
  console.log(`📥 API запрос: ${req.method} ${req.originalUrl}`);
  next();
});

// Подключаем основные API маршруты
app.use('/api/v1', apiRoutes);

// 404 handler для API
app.use('/api', (req, res) => {
  console.log(`❌ API маршрут не найден: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not Found',
    message: `API route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: config.env === 'production' ? 'Something went wrong' : err.message,
    stack: config.env === 'development' ? err.stack : undefined,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Environment: ${config.env}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`👤 Fake Telegram Auth: ${config.telegram.useFakeAuth ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🛡️  Helmet CSP: ${config.env === 'production' ? 'ENABLED' : 'DISABLED (dev mode)'}`);
  
  if (config.env === 'development') {
    console.log(`\n📋 Development endpoints:`);
    console.log(`   GET  /api/v1/health          - Health check`);
    console.log(`   GET  /api/v1/health/db       - Database health`);
    console.log(`   GET  /api/v1/me              - Current user info`);
    console.log(`\n🌐 Frontend доступен по:`);
    console.log(`   Главная: http://localhost:${PORT}/`);
    console.log(`   Telegram Mini App: http://localhost:${PORT}/telegram/index.html`);
    console.log(`   Telegram симулятор: http://localhost:${PORT}/telegram-simulator.html`);
    console.log(`   Тестовая страница: http://localhost:${PORT}/test-telegram.html`);
    console.log(`   Простой тест: http://localhost:${PORT}/simple-test.html`);
    console.log(`   Админ панель: http://localhost:${PORT}/admin/index.html`);
  }
});

// Graceful Shutdown
const gracefulShutdown = () => {
  console.log('\n🔄 Получен сигнал SIGINT. Начинаем изящное завершение...');

  server.close((err) => {
    if (err) {
      console.error('❌ Ошибка при закрытии HTTP-сервера:', err);
    } else {
      console.log('✅ HTTP-сервер закрыт.');
    }
    
    db.destroy(() => {
      console.log('✅ Соединение с базой данных закрыто.');
      process.exit(err ? 1 : 0);
    });
  });

  // Если сервер не закрылся за 10 секунд, принудительно завершаем
  setTimeout(() => {
    console.error('❌ Не удалось закрыть соединения вовремя, принудительное завершение.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

