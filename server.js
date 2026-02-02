// Файл: server.js
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
const PORT = config.port;
// Security middleware
if (config.env === 'production') {
app.use(helmet());
} else {
// В разработке используем более мягкие настройки
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
// Error handler (ОБНОВЛЕННАЯ ВЕРСИЯ)
app.use((err, req, res, next) => {
// Логируем все ошибки, кроме операционных ошибок валидации (4xx) в dev режиме
if (config.env === 'development' || !(err.isOperational && err.statusCode < 500)) {
console.error('SERVER ERROR:', err);
}
const statusCode = err.statusCode || 500;
const status = err.status || 'error';
res.status(statusCode).json({
success: false,
status,
message: err.message,
// Добавляем массив ошибок валидации, если он есть
errors: err.errors && err.errors.length > 0 ? err.errors : undefined,
// Стек трейс показываем только в режиме разработки
stack: config.env === 'development' ? err.stack : undefined,
});
});
// Start server function
const startServer = () => {
const server = app.listen(PORT, () => {
console.log(`🚀 Сервер запущен на порту ${PORT}`);
console.log(`🌐 Environment: ${config.env}`);
console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
if (config.env === 'development') {
console.log(`👤 Fake Telegram Auth: ${config.telegram.useFakeAuth ? 'ENABLED' : 'DISABLED'}`);
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
// Главная логика: запуск сервера и настройка graceful shutdown.
// Экспортируем `app` для тестов, но запускаем сервер только если файл запущен напрямую.
let serverInstance;
if (require.main === module) {
serverInstance = startServer();
setupGracefulShutdown(serverInstance);
}
// Экспортируем app для использования в тестах
module.exports = app;