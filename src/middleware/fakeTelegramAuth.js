const config = require('../config/app');
const db = require('../config/database');

/**
 * Middleware для эмуляции Telegram WebApp авторизации в режиме разработки
 * В production режиме используется реальная валидация Telegram InitData
 */
const fakeTelegramAuth = async (req, res, next) => {
  // Если выключена фейковая авторизация или production режим - пропускаем
  if (!config.telegram.useFakeAuth || config.env === 'production') {
    return next();
  }

  // Пропускаем статические файлы (CSS, JS, изображения, HTML)
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.html', '.htm'];
  const isStaticFile = staticExtensions.some(ext => req.path.endsWith(ext));
  
  if (isStaticFile) {
    return next();
  }

  // Пропускаем API маршруты, которые имеют свою аутентификацию
  if (req.path.startsWith('/api/v1/users/auth')) {
    return next();
  }

  // Пропускаем health checks
  if (req.path.startsWith('/api/v1/health')) {
    return next();
  }

  // Пропускаем корневой путь и страницы фронтенда
  if (req.path === '/' || req.path.startsWith('/telegram') || req.path.startsWith('/admin') || req.path.startsWith('/test-telegram')) {
    return next();
  }

  try {
    // Получаем данные пользователя из заголовков или query параметров
    const telegramId = req.headers['x-telegram-id'] || req.query.telegramId || 'dev_user_123';
    const firstName = req.headers['x-first-name'] || req.query.firstName || 'Разработчик';
    const lastName = req.headers['x-last-name'] || req.query.lastName || 'Тестовый';
    const username = req.headers['x-username'] || req.query.username || 'dev_user';
    const role = req.headers['x-role'] || req.query.role || 'master';

    // Ищем пользователя в базе данных
    let user = await db('users')
      .where({ telegram_id: telegramId, is_active: true })
      .first();

    // Если пользователь не найден, создаем тестового пользователя
    if (!user) {
      console.log(`[FakeTelegramAuth] Создаем нового пользователя: ${telegramId}`);
      
      // Вставляем пользователя
      const newUser = {
        telegram_id: telegramId,
        first_name: firstName,
        last_name: lastName,
        username: username,
        role: role,
        pin_code: '1234',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      await db('users').insert(newUser);
      
      // Получаем созданного пользователя
      user = await db('users')
        .where({ telegram_id: telegramId, is_active: true })
        .first();
    }

    // Добавляем пользователя в объект запроса
    req.user = {
      id: user.id,
      telegramId: user.telegram_id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      role: user.role,
      pinCode: user.pin_code,
    };

    // Добавляем флаг, что это фейковая авторизация
    req.isFakeAuth = true;

    // Логируем для отладки
    if (config.env === 'development') {
      console.log(`[FakeTelegramAuth] User authenticated: ${user.first_name} ${user.last_name} (${user.role})`);
    }

    next();
  } catch (error) {
    console.error('[FakeTelegramAuth] Error:', error);
    
    // В режиме разработки создаем fallback пользователя
    req.user = {
      id: 0,
      telegramId: 'fallback_user',
      firstName: 'Fallback',
      lastName: 'User',
      username: 'fallback',
      role: 'master',
      pinCode: '0000',
    };
    req.isFakeAuth = true;
    
    console.log('[FakeTelegramAuth] Using fallback user due to error');
    next();
  }
};

/**
 * Middleware для проверки ролей пользователя
 * @param {Array} allowedRoles - Массив разрешенных ролей
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not authenticated' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Role ${req.user.role} is not allowed. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

/**
 * Middleware для проверки PIN-кода
 * Требует наличия заголовка X-PIN-Code
 */
const requirePinCode = async (req, res, next) => {
  try {
    const pinCode = req.headers['x-pin-code'] || req.query.pinCode;
    
    if (!pinCode) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'PIN code is required' 
      });
    }

    // В режиме разработки пропускаем проверку PIN-кода
    if (config.telegram.useFakeAuth && config.env === 'development') {
      console.log(`[FakeTelegramAuth] PIN code check skipped for development: ${pinCode}`);
      return next();
    }

    // Проверяем PIN-код в базе данных
    const user = await db('users')
      .where({ 
        telegram_id: req.user.telegramId,
        pin_code: pinCode,
        is_active: true 
      })
      .first();

    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid PIN code' 
      });
    }

    // Обновляем время последнего входа
    await db('users')
      .where({ id: user.id })
      .update({ last_login_at: db.fn.now() });

    next();
  } catch (error) {
    console.error('[requirePinCode] Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to verify PIN code' 
    });
  }
};

module.exports = {
  fakeTelegramAuth,
  requireRole,
  requirePinCode,
};