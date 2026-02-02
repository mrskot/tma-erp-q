const jwt = require('jsonwebtoken');
const config = require('../config/app');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');

const authenticateJWT = async (req, res, next) => {
  // Ищем токен только в заголовке Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Если токена нет, просто передаем управление дальше.
    // Защиту роута обеспечивает `requireAuth`.
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id);
    if (user && user.is_active) {
      req.user = user; // Сохраняем полную модель пользователя
    }
  } catch (error) {
    // Не бросаем ошибку, если токен просто невалиден,
    // просто не добавляем req.user. Защита сработает в requireAuth.
    console.error('JWT verification failed:', error.message);
  }
  return next();
};

// Этот middleware должен идти ПОСЛЕ authenticateJWT
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Требуется авторизация', 401));
  }
  next();
};

const generateToken = (user) => {
  const payload = { id: user.id, role: user.role };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });
};

// ИСПРАВЛЕНИЕ: Используем `module.exports` для правильной работы require()
module.exports = {
  authenticateJWT,
  requireAuth,
  generateToken,
};