const express = require('express');
const { body } = require('express-validator');
const UserController = require('../controllers/userController');
const { authenticateJWT } = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbacMiddleware');

const router = express.Router();

// Публичный маршрут для входа
router.post(
  '/auth/login',
  [
    body('telegram_id').notEmpty().withMessage('Telegram ID обязателен'),
    body('pin_code').isLength({ min: 4, max: 4 }).withMessage('PIN должен быть 4 цифры')
  ],
  UserController.authenticate
);

// Защищенные маршруты
router.use(authenticateJWT);

router.get('/profile', UserController.getProfile);

// Админские маршруты
router.get('/', rbacMiddleware(['admin', 'director']), UserController.getAllUsers);
router.post('/', rbacMiddleware(['admin']), UserController.createUser);
router.put('/:id', rbacMiddleware(['admin']), UserController.updateUser);
router.delete('/:id', rbacMiddleware(['admin']), UserController.deleteUser);
router.post('/:id/restore', rbacMiddleware(['admin']), UserController.reactivateUser);
router.get('/role/:role', UserController.getUsersByRole);
router.post('/reset-pin', rbacMiddleware(['admin']), UserController.resetPinCode);

module.exports = router;
