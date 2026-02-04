const UserService = require('../services/userService');
const { validationResult } = require('express-validator');
const { generateToken } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../utils/errorHandler');

class UserController {
  static authenticate = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError('Ошибка валидации', 400, errors.array());

    const { telegram_id, pin_code } = req.body;
    const user = await UserService.authenticate(telegram_id, pin_code);
    const token = generateToken(user);

    res.json({ success: true, message: 'Аутентификация успешна', data: { user, token } });
  });

  static getProfile = asyncHandler(async (req, res) => {
    // The requireAuth middleware already ensures req.user exists.
    const profile = await UserService.getProfile(req.user.telegram_id);
    res.json({ success: true, data: profile });
  });

  static getAllUsers = asyncHandler(async (req, res) => {
    // RBAC is now handled by middleware, removing role check from controller.
    const { limit = 100, offset = 0, status = 'active' } = req.query;
    const result = await UserService.getAllUsers(parseInt(limit), parseInt(offset), status);
    res.json({ success: true, data: result });
  });

  static createUser = asyncHandler(async (req, res) => {
    // RBAC handled by middleware.
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError('Ошибка валидации', 400, errors.array());

    const user = await UserService.createUser(req.body, req.user);
    res.status(201).json({ success: true, message: 'Пользователь создан успешно', data: user });
  });

  static updateUser = asyncHandler(async (req, res) => {
    // RBAC handled by middleware.
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError('Ошибка валидации', 400, errors.array());

    const user = await UserService.updateUser(parseInt(req.params.id), req.body, req.user);
    res.json({ success: true, message: 'Пользователь обновлен успешно', data: user });
  });

  static deleteUser = asyncHandler(async (req, res) => {
    // RBAC handled by middleware.
    const result = await UserService.deleteUser(parseInt(req.params.id), req.user);
    res.json({ success: true, message: result.message });
  });

  static reactivateUser = asyncHandler(async (req, res) => {
    // RBAC handled by middleware.
    const result = await UserService.reactivateUser(parseInt(req.params.id), req.user);
    res.json({ success: true, message: result.message });
  });

  static getUsersByRole = asyncHandler(async (req, res) => {
    const { role } = req.params;
    const users = await UserService.getUsersByRole(role);
    // FIX: Standardize response structure.
    res.json({ success: true, data: { users, pagination: null } });
  });

  static resetPinCode = asyncHandler(async (req, res) => {
    // RBAC handled by middleware.
    const result = await UserService.resetPinCode(req.body.telegram_id);
    res.json({ success: true, message: 'PIN-код успешно сброшен', data: result });
  });
}

module.exports = UserController;