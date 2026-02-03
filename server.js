const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const config = require('./src/config/app');
const { fakeTelegramAuth } = require('./src/middleware/fakeTelegramAuth');
const apiRoutes = require('./src/routes');
const db = require('./src/config/database');
const { AppError } = require('./src/utils/errorHandler');

const app = express();
const PORT = config.port || 3000;

// Security middleware
if (config.env === 'production') {
  app.use(helmet());
} else {
  app.use(helmet({
    contentSecurityPolicy: false,
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
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Слишком много запросов, пожалуйста, попробуйте позже.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fake Telegram Auth middleware (только для разработки)
if (config.env === 'development') {
  app.use(fakeTelegramAuth);
}

// Serve static files
app.use(express.static('public'));

// Главная страница
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// Health check endpoint (добавляем сюда, чтобы он работал даже если роуты отвалятся)
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'TMA-ERP-Q работает!',
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: '1.0.0',
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
app.use('/api', (req, res, next) => {
  next(new AppError(`API маршрут не найден: ${req.method} ${req.originalUrl}`, 404));
});

// Error handler
app.use((err, req, res, next) => {
  if (config.env === 'development' || !(err.isOperational && err.statusCode < 500)) {
    console.error('SERVER ERROR:', err);
  }
  
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  
  res.status(statusCode).json({
    success: false,
    status,
    message: err.message,
    errors: err.errors && err.errors.length > 0 ? err.errors : undefined,
    stack: config.env === 'development' ? err.stack : undefined,
  });
});

// Функция запуска сервера
const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Environment: ${config.env}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
    if (config.env === 'development') {
      console.log(`👤 Fake Telegram Auth: ${config.telegram.useFakeAuth ? 'ENABLED' : 'DISABLED'}`);
    }
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`❌ Порт ${PORT} занят!`);
      console.error(`💡 Попробуйте остановить процесс, использующий этот порт, или измените PORT в .env`);
      process.exit(1);
    } else {
      console.error('❌ Ошибка сервера:', e);
    }
  });

  return server;
};

// Graceful Shutdown
const setupGracefulShutdown = (server) => {
  const gracefulShutdown = () => {
    console.log('\n🔄 Получен сигнал завершения. Начинаем изящное завершение...');
    
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

    setTimeout(() => {
      console.error('❌ Не удалось закрыть соединения вовремя, принудительное завершение.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
};

// Запуск только если файл запущен напрямую (не импортирован)
if (require.main === module) {
  const server = startServer();
  setupGracefulShutdown(server);
}

module.exports = app;