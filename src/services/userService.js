const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');
const activityLogService = require('./activityLogService');

class UserService {
  static async authenticate(telegramId, pinCode) {
    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      throw new AppError('Пользователь не найден в системе', 404);
    }

    if (user.pin_code !== pinCode) {
      throw new AppError('Неверный PIN-код', 401);
    }

    await User.updateLoginStats(user.id);
    return user;
  }

  static async getProfile(telegramId) {
    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      throw new AppError('Профиль не найден', 404);
    }
    return user;
  }

  static async getAllUsers(limit = 100, offset = 0, status = 'active') {
    try {
      const users = await User.findAll({ limit, offset, filters: { status } });
      const total = await User.count({ status });

      return {
        users,
        pagination: { total, limit, offset, hasMore: offset + users.length < total }
      };
    } catch (error) {
      throw new AppError(`Ошибка получения списка пользователей: ${error.message}`, 500);
    }
  }

  static async createUser(userData, performer) {
    const existingUser = await User.findByTelegramId(userData.telegram_id);
    if (existingUser) {
      throw new AppError('Пользователь с таким Telegram ID уже зарегистрирован', 400);
    }

    if (!userData.pin_code) {
      userData.pin_code = Math.floor(1000 + Math.random() * 9000).toString();
    }

    const user = await User.create(userData);

    await activityLogService.log({
      userId: performer.id,
      userRole: performer.role,
      actionType: 'create',
      entityType: 'user',
      entityId: user.id,
      newData: user,
      description: `Создание пользователя ${user.username}`
    });

    return user;
  }

  static async updateUser(id, userData, performer) {
    const oldData = await User.findById(id);
    if (!oldData) {
      throw new AppError('Пользователь не найден', 404);
    }

    if (userData.telegram_id && userData.telegram_id !== oldData.telegram_id) {
      const existing = await User.findByTelegramId(userData.telegram_id);
      if (existing) throw new AppError('Этот Telegram ID уже занят другим пользователем', 400);
    }

    const updated = await User.update(id, userData);

    await activityLogService.log({
      userId: performer.id,
      userRole: performer.role,
      actionType: 'update',
      entityType: 'user',
      entityId: id,
      oldData,
      newData: updated,
      description: `Обновление данных пользователя ${updated.username}`
    });

    return updated;
  }

  static async deleteUser(id, performer) {
    const user = await User.findById(id);
    if (!user) throw new AppError('Пользователь не найден', 404);
    
    await User.delete(id);

    await activityLogService.log({
      userId: performer.id,
      userRole: performer.role,
      actionType: 'delete',
      entityType: 'user',
      entityId: id,
      oldData: user,
      description: `Деактивирован пользователь ${user.username}`
    });

    return { success: true, message: 'Пользователь успешно деактивирован' };
  }

  static async reactivateUser(id, performer) {
    // ВТОРОЙ аргумент true говорит BaseModel искать в том числе и неактивных
    const user = await User.findById(id, true);
    if (!user) throw new AppError('Пользователь не найден', 404);
    
    await User.reactivate(id);

    await activityLogService.log({
      userId: performer.id,
      userRole: performer.role,
      actionType: 'restore',
      entityType: 'user',
      entityId: id,
      newData: user,
      description: `Восстановление пользователя ${user.username}`
    });

    return { success: true, message: 'Пользователь восстановлен' };
  }

  static async getUsersByRole(role) {
    return await User.findAll({ filters: { role, status: 'active' } });
  }

  static async resetPinCode(telegramId) {
    const user = await User.findByTelegramId(telegramId);
    if (!user) throw new AppError('Пользователь не найден', 404);

    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    await User.update(user.id, { pin_code: newPin });
    
    return { telegram_id: telegramId, new_pin: newPin };
  }
}

module.exports = UserService;