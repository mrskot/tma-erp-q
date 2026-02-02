// Файл: src/utils/errorHandler.js
class AppError extends Error {
/**
* @param {string} message - Сообщение об ошибке.
* @param {number} statusCode - HTTP статус код.
* @param {Array} [errors] - Массив дополнительных ошибок (например, от валидатора).
*/
constructor(message, statusCode, errors = []) {
super(message);
this.statusCode = statusCode;
this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
this.isOperational = true; // Отличаем операционные ошибки от программных
this.errors = errors;
Error.captureStackTrace(this, this.constructor);
}
}
module.exports = { AppError };