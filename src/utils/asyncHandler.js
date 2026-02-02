// Файл: src/utils/asyncHandler.js
/**
* Обертка для асинхронных контроллеров Express для централизованной обработки ошибок.
* Перехватывает ошибки из промисов и передает их в next().
* @param {Function} fn - Асинхронная функция контроллера (req, res, next).
* @returns {Function} - Функция-middleware для Express.
*/
const asyncHandler = (fn) => (req, res, next) => {
Promise.resolve(fn(req, res, next)).catch(next);
};
module.exports = asyncHandler;
