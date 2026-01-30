const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const UserController = require('../controllers/userController');
const { authenticateJWT } = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbacMiddleware'); 

// Валидация для аутентификации
const authenticateValidation = [
  body('telegram_id')
    .notEmpty().withMessage('Telegram ID обязателен')
    .isString().withMessage('Telegram ID должен быть строкой'),
  body('pin_code')
    .notEmpty().withMessage('PIN-код обязателен')
    .isString().withMessage('PIN-код должен быть строкой')
    .isLength({ min: 4, max: 4 }).withMessage('PIN-код должен содержать 4 цифры')
    .matches(/^\d{4}$/).withMessage('PIN-код должен содержать только цифры'),
];

// Валидация для создания пользователя
const createUserValidation = [
  body('telegram_id')
    .notEmpty().withMessage('Telegram ID обязателен')
    .isString().withMessage('Telegram ID должен быть строкой'),
  body('first_name')
    .notEmpty().withMessage('Имя обязательно')
    .isString().withMessage('Имя должно быть строкой')
    .isLength({ min: 2, max: 50 }).withMessage('Имя должно быть от 2 до 50 символов'),
  body('last_name')
    .optional()
    .isString().withMessage('Фамилия должна быть строкой')
    .isLength({ max: 50 }).withMessage('Фамилия не должна превышать 50 символов'),
  body('username')
    .optional()
    .isString().withMessage('Username должен быть строкой')
    .isLength({ max: 50 }).withMessage('Username не должен превышать 50 символов'),
  body('phone_number')
    .optional()
    .isString().withMessage('Номер телефона должен быть строкой'),
  body('role')
    .notEmpty().withMessage('Роль обязательна')
    .isIn(['worker', 'master', 'inspector', 'director', 'admin']).withMessage('Недопустимая роль'),
  body('pin_code')
    .optional()
    .isString().withMessage('PIN-код должен быть строкой')
    .isLength({ min: 4, max: 4 }).withMessage('PIN-код должен содержать 4 цифры')
    .matches(/^\d{4}$/).withMessage('PIN-код должен содержать только цифры'),
];

// Валидация для обновления пользователя
const updateUserValidation = [
  param('id')
    .isInt().withMessage('ID должен быть числом'),
  body('first_name')
    .optional()
    .isString().withMessage('Имя должно быть строкой')
    .isLength({ min: 2, max: 50 }).withMessage('Имя должно быть от 2 до 50 символов'),
  body('last_name')
    .optional()
    .isString().withMessage('Фамилия должна быть строкой')
    .isLength({ max: 50 }).withMessage('Фамилия не должна превышать 50 символов'),
  body('username')
    .optional()
    .isString().withMessage('Username должен быть строкой')
    .isLength({ max: 50 }).withMessage('Username не должен превышать 50 символов'),
  body('phone_number')
    .optional()
    .isString().withMessage('Номер телефона должен быть строкой'),
  body('role')
    .optional()
    .isIn(['worker', 'master', 'inspector', 'director', 'admin']).withMessage('Недопустимая роль'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active должен быть булевым значением'),
];

// Валидация для параметров запроса
const queryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Limit должен быть числом от 1 до 1000'),
  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Offset должен быть неотрицательным числом'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'all']).withMessage('Недопустимый статус'),
];

// Маршруты

// Аутентификация пользователя
router.post('/auth/login', authenticateValidation, UserController.authenticate);

// Обновление токена
router.post('/auth/refresh', authenticateJWT, UserController.refreshToken);

// Получение профиля текущего пользователя
router.get('/profile', authenticateJWT, UserController.getProfile);

// Получение всех пользователей
router.get('/', authenticateJWT, rbacMiddleware(['admin', 'director', 'inspector', 'master']), queryValidation, UserController.getAllUsers);

// Создание пользователя (только для админов)
router.post('/', authenticateJWT, rbacMiddleware(['admin']), createUserValidation, UserController.createUser);

// Обновление пользователя (только для админов)
router.put('/:id', authenticateJWT, rbacMiddleware(['admin']), updateUserValidation, UserController.updateUser);

// Удаление пользователя (деактивация) (только для админов)
router.delete('/:id', authenticateJWT,
  rbacMiddleware(['admin']),
  param('id').isInt().withMessage('ID должен быть числом'),
  UserController.deleteUser
);

// Восстановление пользователя (только для админов)
router.post('/:id/restore', authenticateJWT,
  rbacMiddleware(['admin']),
  param('id').isInt().withMessage('ID должен быть числом'),
  UserController.reactivateUser
);

// Получение пользователей по роли
router.get('/role/:role', authenticateJWT,
  rbacMiddleware(['admin', 'director', 'inspector', 'master']),
  param('role').isIn(['worker', 'master', 'inspector', 'director', 'admin']).withMessage('Недопустимая роль'),
  UserController.getUsersByRole
);

// Сброс PIN-кода (только для админов)
router.post('/reset-pin', authenticateJWT,
  rbacMiddleware(['admin']),
  body('telegram_id').notEmpty().withMessage('Telegram ID обязателен'),
  UserController.resetPinCode
);

module.exports = router;