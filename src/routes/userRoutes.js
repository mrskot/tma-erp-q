const express = require('express');
const { body, param } = require('express-validator');
const UserController = require('../controllers/userController');
const { authenticateJWT, requireAuth } = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const router = express.Router();

router.post('/auth/login', [
  body('telegram_id').notEmpty().withMessage('Telegram ID обязателен'),
  body('pin_code').isLength({ min: 4, max: 4 }).withMessage('PIN-код должен состоять из 4 цифр'),
], UserController.authenticate);

// Сначала authenticateJWT для расшифровки токена, потом requireAuth для проверки
router.post('/auth/refresh', authenticateJWT, requireAuth, UserController.refreshToken);
router.get('/profile', authenticateJWT, requireAuth, UserController.getProfile);

const adminOnly = [authenticateJWT, requireAuth, rbacMiddleware(['admin'])];
router.get('/', adminOnly, UserController.getAllUsers);
router.post('/', adminOnly, [
  body('first_name').notEmpty().withMessage('Имя обязательно для заполнения'),
  body('last_name').notEmpty().withMessage('Фамилия обязательна для заполнения'),
  body('telegram_id').notEmpty().withMessage('Telegram ID обязателен'),
  body('role').isIn(['admin', 'director', 'inspector', 'master', 'worker']).withMessage('Недопустимая роль'),
], UserController.createUser);

router.put('/:id', adminOnly, [param('id').isInt({ min: 1 }).withMessage('ID должен быть целым числом')], UserController.updateUser);
router.delete('/:id', adminOnly, [param('id').isInt({ min: 1 })], UserController.deleteUser);
router.post('/:id/restore', adminOnly, [param('id').isInt({ min: 1 })], UserController.reactivateUser);
router.post('/reset-pin', adminOnly, [body('telegram_id').notEmpty()], UserController.resetPinCode);

const managersOnly = [authenticateJWT, requireAuth, rbacMiddleware(['admin', 'director', 'inspector', 'master'])];
router.get('/role/:role', managersOnly, UserController.getUsersByRole);

module.exports = router;
