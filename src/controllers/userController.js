const UserService = require('../services/userService');
const { validationResult } = require('express-validator');
const { generateToken } = require('../middleware/auth');

class UserController {
  static async authenticate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { telegram_id, pin_code } = req.body;
      const user = await UserService.authenticate(telegram_id, pin_code);
      
      // Генерация JWT токена
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
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getProfile(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Не авторизован'
        });
      }

      const profile = await UserService.getProfile(req.user.telegram_id);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getAllUsers(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Доступ запрещен. Требуется роль администратора'
        });
      }

      const { limit = 100, offset = 0, status = 'active' } = req.query;
      const result = await UserService.getAllUsers(parseInt(limit), parseInt(offset), status);
      
      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async createUser(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Доступ запрещен. Требуется роль администратора'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userData = req.body;
      const user = await UserService.createUser(userData);
      
      res.status(201).json({
        success: true,
        message: 'Пользователь создан успешно',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateUser(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Доступ запрещен. Требуется роль администратора'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userData = req.body;
      const user = await UserService.updateUser(parseInt(id), userData);
      
      res.json({
        success: true,
        message: 'Пользователь обновлен успешно',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteUser(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Доступ запрещен. Требуется роль администратора'
        });
      }

      const { id } = req.params;
      const result = await UserService.deleteUser(parseInt(id));
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async reactivateUser(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Доступ запрещен. Требуется роль администратора'
        });
      }

      const { id } = req.params;
      const result = await UserService.reactivateUser(parseInt(id));
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getUsersByRole(req, res) {
    try {
      if (!req.user || !['admin', 'director', 'inspector'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Доступ запрещен'
        });
      }

      const { role } = req.params;
      const users = await UserService.getUsersByRole(role);
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async resetPinCode(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Доступ запрещен. Требуется роль администратора'
        });
      }

      const { telegram_id } = req.body;
      const result = await UserService.resetPinCode(telegram_id);
      
      res.json({
        success: true,
        message: 'PIN-код успешно сброшен',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async refreshToken(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Не авторизован'
        });
      }

      // Генерация нового токена
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
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Ошибка обновления токена'
      });
    }
  }
}

module.exports = UserController;