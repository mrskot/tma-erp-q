// src/middleware/rbacMiddleware.js
const { AppError } = require('../utils/errorHandler');

/**
 * Middleware для проверки ролей на основе req.user, созданного в auth middleware.
 * @param {Array<string>} allowedRoles - Массив разрешенных ролей.
 */
const rbacMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // Предполагаем, что authMiddleware уже отработал и добавил req.user
    if (!req.user) {
      // Эта ошибка не должна происходить, если authMiddleware всегда используется перед rbac
      return next(new AppError('Пользователь не аутентифицирован.', 401));
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      // Если роль пользователя не входит в список разрешенных
      return next(new AppError('Доступ запрещен: у вас нет необходимых прав.', 403));
    }

    // Если все проверки пройдены, передаем управление следующему middleware
    next();
  };
};

module.exports = rbacMiddleware;