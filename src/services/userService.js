const User = require('../models/User');
const config = require('../config/app');
const bcrypt = require('bcryptjs');

class UserService {
  static async authenticate(telegramId, pinCode) {
    try {
      const user = await User.verifyPinCode(telegramId, pinCode);
      
      if (!user) {
        throw new Error('Неверный PIN-код или пользователь не найден');
      }

      return {
        id: user.id,
        telegram_id: user.telegram_id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        role: user.role,
        phone_number: user.phone_number,
        last_login_at: user.last_login_at
      };
    } catch (error) {
      throw new Error(`Ошибка аутентификации: ${error.message}`);
    }
  }

  static async getProfile(telegramId) {
    try {
      const user = await User.findByTelegramId(telegramId);
      
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      return {
        id: user.id,
        telegram_id: user.telegram_id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        role: user.role,
        phone_number: user.phone_number,
        is_active: user.is_active,
        last_login_at: user.last_login_at,
        created_at: user.created_at
      };
    } catch (error) {
      throw new Error(`Ошибка получения профиля: ${error.message}`);
    }
  }

  static async getAllUsers(limit = 100, offset = 0, status = 'active') {
    try {
      const users = await User.findAll(limit, offset, status);
      const total = await User.count(status);

      return {
        users: users.map(user => ({
          id: user.id,
          telegram_id: user.telegram_id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          bitrix_id: user.bitrix_id, // <-- ДОБАВЛЕНО
          pin_code: user.pin_code,   // <-- ДОБАВЛЕНО
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + users.length < total
        }
      };
    } catch (error) {
      throw new Error(`Ошибка получения пользователей: ${error.message}`);
    }
  }

  static async createUser(userData) {
    try {
      // Генерация PIN-кода если не предоставлен
      if (!userData.pin_code) {
        userData.pin_code = Math.floor(1000 + Math.random() * 9000).toString();
      }

      // Проверка уникальности telegram_id
      const existingUser = await User.findByTelegramId(userData.telegram_id);
      if (existingUser) {
        throw new Error('Пользователь с таким Telegram ID уже существует');
      }

      const user = await User.create(userData);
      
      return {
        id: user.id,
        telegram_id: user.telegram_id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        role: user.role,
        pin_code: user.pin_code, // Возвращаем PIN только при создании
        created_at: user.created_at
      };
    } catch (error) {
      throw new Error(`Ошибка создания пользователя: ${error.message}`);
    }
  }

  static async updateUser(id, userData) {
    try {
      const user = await User.update(id, userData);
      
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      return {
        id: user.id,
        telegram_id: user.telegram_id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        role: user.role,
        updated_at: user.updated_at
      };
    } catch (error) {
      throw new Error(`Ошибка обновления пользователя: ${error.message}`);
    }
  }

  static async deleteUser(id) {
    try {
      const result = await User.delete(id);
      
      if (result === 0) {
        throw new Error('Пользователь не найден');
      }

      return { success: true, message: 'Пользователь деактивирован' };
    } catch (error) {
      throw new Error(`Ошибка удаления пользователя: ${error.message}`);
    }
  }

  static async reactivateUser(id) {
    try {
      const result = await User.reactivate(id);
      
      if (result === 0) {
        throw new Error('Пользователь не найден или уже активен');
      }

      return { success: true, message: 'Пользователь восстановлен' };
    } catch (error) {
      throw new Error(`Ошибка восстановления пользователя: ${error.message}`);
    }
  }

  static async getUsersByRole(role) {
    try {
      const users = await User.findByRole(role);
      
      return users.map(user => ({
        id: user.id,
        telegram_id: user.telegram_id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        phone_number: user.phone_number
      }));
    } catch (error) {
      throw new Error(`Ошибка получения пользователей по роли: ${error.message}`);
    }
  }

  static async resetPinCode(telegramId) {
    try {
      const user = await User.findByTelegramId(telegramId);
      
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      const newPin = Math.floor(1000 + Math.random() * 9000).toString();
      const updatedUser = await User.update(user.id, { pin_code: newPin });
      
      return {
        telegram_id: updatedUser.telegram_id,
        new_pin: newPin,
        updated_at: updatedUser.updated_at
      };
    } catch (error) {
      throw new Error(`Ошибка сброса PIN-кода: ${error.message}`);
    }
  }
}

module.exports = UserService;