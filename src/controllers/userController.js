const UserService = require('../services/userService');
const { validationResult } = require('express-validator');
const { generateToken } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../utils/errorHandler');

class UserController {
  static authenticate = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Ошибка валидации', 400, errors.array());
    }

    const { telegram_id, pin_code } = req.body;
    const user = await UserService.authenticate(telegram_id, pin_code);
    
    const token = generateToken({
      id: user.id,
      telegram_id: user.telegram_id,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    });
    
    res.json({
      success: true,
      message: 'Аутентификация успешна',
      data: {
        user,
        token
      }
    });
  });

  static getProfile = asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new AppError('Не авторизован', 401);
    }

    const profile = await UserService.getProfile(req.user.telegram_id);
    
    res.json({
      success: true,
      data: profile
    });
  });

  static getAllUsers = asyncHandler(async (req, res) => {
    const allowedRoles = ['admin', 'director', 'inspector', 'master'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new AppError('Доступ запрещен. Требуется роль администратора или руководящая роль', 403);
    }

    const { limit = 100, offset = 0, status = 'active' } = req.query;
    const result = await UserService.getAllUsers(parseInt(limit), parseInt(offset), status);
    
    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  });

  static createUser = asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError('Доступ запрещен. Требуется роль администратора', 403);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Ошибка валидации', 400, errors.array());
    }

    const userData = req.body;
    const user = await UserService.createUser(userData);
    
    res.status(201).json({
      success: true,
      message: 'Пользователь создан успешно',
      data: user
    });
  });

  static updateUser = asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError('Доступ запрещен. Требуется роль администратора', 403);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Ошибка валидации', 400, errors.array());
    }

    const { id } = req.params;
    const userData = req.body;
    const user = await UserService.updateUser(parseInt(id), userData);
    
    res.json({
      success: true,
      message: 'Пользователь обновлен успешно',
      data: user
    });
  });

  static deleteUser = asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError('Доступ запрещен. Требуется роль администратора', 403);
    }

    const { id } = req.params;
    const result = await UserService.deleteUser(parseInt(id));
    
    res.json({
      success: true,
      message: result.message
    });
  });

  static reactivateUser = asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError('Доступ запрещен. Требуется роль администратора', 403);
    }

    const { id } = req.params;
    const result = await UserService.reactivateUser(parseInt(id));
    
    res.json({
      success: true,
      message: result.message
    });
  });

  static getUsersByRole = asyncHandler(async (req, res) => {
    if (!req.user || !['admin', 'director', 'inspector', 'master'].includes(req.user.role)) {
      throw new AppError('Доступ запрещен', 403);
    }

    const { role } = req.params;
    const users = await UserService.getUsersByRole(role);
    
    res.json({
      success: true,
      data: users
    });
  });

  static resetPinCode = asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError('Доступ запрещен. Требуется роль администратора', 403);
    }

    const { telegram_id } = req.body;
    const result = await UserService.resetPinCode(telegram_id);
    
    res.json({
      success: true,
      message: 'PIN-код успешно сброшен',
      data: result
    });
  });

  static refreshToken = asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new AppError('Не авторизован', 401);
    }

    const token = generateToken({
      id: req.user.id,
      telegram_id: req.user.telegram_id,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      role: req.user.role
    });
    
    res.json({
      success: true,
      message: 'Токен обновлен',
      data: { token }
    });
  });
}

module.exports = UserController;