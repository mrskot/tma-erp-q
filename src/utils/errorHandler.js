// src/utils/errorHandler.js

/**
 * Кастомный класс для обработки операционных ошибок
 */
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Отличаем операционные ошибки от программных
    this.details = details; // Дополнительные детали, например, ошибки валидации

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Глобальный middleware для обработки ошибок
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  console.error('💥 ГЛОБАЛЬНАЯ ОШИБКА:', err);

  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    ...(err.details && { details: err.details }), // Включаем детали, если они есть
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Включаем стек в режиме разработки
  });
};


module.exports = {
  AppError,
  globalErrorHandler,
};