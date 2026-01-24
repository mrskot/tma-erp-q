const jwt = require('jsonwebtoken');
const config = require('../config/app');
const User = require('../models/User');

/**
 * Middleware для проверки JWT токена
 */
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Неверный формат токена'
      });
    }

    // Верификация токена
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Поиск пользователя в базе данных
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден или деактивирован'
      });
    }

    // Добавляем пользователя в запрос
    req.user = {
      id: user.id,
      telegram_id: user.telegram_id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      role: user.role,
      phone_number: user.phone_number
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Недействительный токен'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Срок действия токена истек'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при проверке авторизации'
    });
  }
};

/**
 * Middleware для проверки ролей
 * @param {Array} allowedRoles - Разрешенные роли
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Доступ запрещен. Требуется одна из ролей: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Генерация JWT токена
 * @param {Object} user - Объект пользователя
 * @returns {String} JWT токен
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    telegramId: user.telegram_id,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '24h' // Токен действителен 24 часа
  });
};

/**
 * Middleware для проверки Telegram WebApp данных
 * (реализация для production)
 */
const validateTelegramData = async (req, res, next) => {
  try {
    // В режиме разработки используем фейковую аутентификацию
    if (config.env === 'development' && config.telegram.useFakeAuth) {
      return next();
    }

    const telegramData = req.headers['x-telegram-data'] || req.query.telegramData;
    
    if (!telegramData) {
      return res.status(401).json({
        success: false,
        message: 'Требуются данные Telegram WebApp'
      });
    }

    // Здесь должна быть реализация проверки подписи Telegram
    // Для демо пропускаем проверку
    
    // Парсим данные Telegram
    const params = new URLSearchParams(telegramData);
    const telegramId = params.get('id');
    const firstName = params.get('first_name');
    const lastName = params.get('last_name');
    const username = params.get('username');

    if (!telegramId) {
      return res.status(401).json({
        success: false,
        message: 'Неверные данные Telegram'
      });
    }

    // Ищем пользователя в базе данных
    let user = await User.findByTelegramId(telegramId);
    
    // Если пользователь не найден, создаем нового
    if (!user) {
      user = await User.create({
        telegram_id: telegramId,
        first_name: firstName || 'Пользователь',
        last_name: lastName || '',
        username: username || '',
        role: 'worker', // Роль по умолчанию
        pin_code: Math.floor(1000 + Math.random() * 9000).toString()
      });
    }

    // Добавляем пользователя в запрос
    req.user = {
      id: user.id,
      telegram_id: user.telegram_id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      role: user.role,
      phone_number: user.phone_number
    };

    // Генерируем токен
    req.telegramToken = generateToken(user);

    next();
  } catch (error) {
    console.error('Telegram validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при проверке данных Telegram'
    });
  }
};

module.exports = {
  authenticateJWT,
  requireRole,
  generateToken,
  validateTelegramData
};