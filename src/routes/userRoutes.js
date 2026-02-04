const express = require('express');
const { body } = require('express-validator');
// FIX: Requiring the class
const UserController = require('../controllers/userController');
const { authenticateJWT } = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbacMiddleware');

const router = express.Router();

// Public route for login
router.post(
  '/auth/login',
  [
    body('telegram_id').notEmpty().withMessage('Telegram ID обязателен'),
    body('pin_code').isLength({ min: 4, max: 4 }).withMessage('PIN должен быть 4 цифры')
  ],
  UserController.authenticate
);

// Protected routes
router.use(authenticateJWT);

router.get('/profile', UserController.getProfile);

// Admin & Manager routes
router.get('/', rbacMiddleware(['admin', 'director']), UserController.getAllUsers);
router.get('/role/:role', rbacMiddleware(['admin', 'director']), UserController.getUsersByRole);

// Admin-only routes
router.post('/', rbacMiddleware(['admin']), UserController.createUser);
router.put('/:id', rbacMiddleware(['admin']), UserController.updateUser);
router.delete('/:id', rbacMiddleware(['admin']), UserController.deleteUser);
router.post('/:id/restore', rbacMiddleware(['admin']), UserController.reactivateUser);
router.post('/reset-pin', rbacMiddleware(['admin']), UserController.resetPinCode);

module.exports = router;