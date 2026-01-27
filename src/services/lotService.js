const Lot = require('../models/Lot');
const User = require('../models/User');

class LotService {
  // Получить все участки
  static async getAllLots(limit = 100, offset = 0, withMasters = true, status = 'active') {
    try {
      const lots = withMasters 
        ? await Lot.findAllWithMasters(limit, offset, status)
        : await Lot.findAll(limit, offset, status);
      
      const total = await Lot.count(status);

      return {
        lots,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + lots.length < total
        }
      };
    } catch (error) {
      throw new Error(`Ошибка получения участков: ${error.message}`);
    }
  }

  // Получить участок по ID
  static async getLotById(id, withMasters = true) {
    try {
      const lot = withMasters 
        ? await Lot.findByIdWithMasters(id)
        : await Lot.findById(id);
      
      if (!lot) {
        throw new Error('Участок не найден');
      }

      return lot;
    } catch (error) {
      throw new Error(`Ошибка получения участка: ${error.message}`);
    }
  }

  // Получить участки по мастеру
  static async getLotsByMaster(masterId) {
    try {
      // Проверяем существование мастера
      const master = await User.findById(masterId);
      if (!master) {
        throw new Error('Мастер не найден');
      }

      if (master.role !== 'master') {
        throw new Error('Указанный пользователь не является мастером');
      }

      const lots = await Lot.findByMaster(masterId);
      return lots;
    } catch (error) {
      throw new Error(`Ошибка получения участков мастера: ${error.message}`);
    }
  }

  // Создать новый участок
  static async createLot(lotData) {
    try {
      // Проверка уникальности кода
      const existingLot = await Lot.findByCode(lotData.code);
      if (existingLot) {
        throw new Error('Участок с таким кодом уже существует');
      }

      // Проверка существования основного мастера
      if (lotData.main_master_id) {
        const mainMaster = await User.findById(lotData.main_master_id);
        if (!mainMaster) {
          throw new Error('Основной мастер не найден');
        }
        if (mainMaster.role !== 'master') {
          throw new Error('Основной мастер должен иметь роль "master"');
        }
      }

      // Проверка существования временного мастера
      if (lotData.temp_master_id) {
        const tempMaster = await User.findById(lotData.temp_master_id);
        if (!tempMaster) {
          throw new Error('Временный мастер не найден');
        }
        if (tempMaster.role !== 'master') {
          throw new Error('Временный мастер должен иметь роль "master"');
        }
      }

      const lot = await Lot.create(lotData);
      return lot;
    } catch (error) {
      throw new Error(`Ошибка создания участка: ${error.message}`);
    }
  }

  // Обновить участок
  static async updateLot(id, lotData) {
    try {
      // Проверка существования участка
      const existingLot = await Lot.findById(id);
      if (!existingLot) {
        throw new Error('Участок не найден');
      }

      // Проверка уникальности кода при изменении
      if (lotData.code && lotData.code !== existingLot.code) {
        const lotWithCode = await Lot.findByCode(lotData.code);
        if (lotWithCode) {
          throw new Error('Участок с таким кодом уже существует');
        }
      }

      // Проверка основного мастера
      if (lotData.main_master_id) {
        const mainMaster = await User.findById(lotData.main_master_id);
        if (!mainMaster) {
          throw new Error('Основной мастер не найден');
        }
        if (mainMaster.role !== 'master') {
          throw new Error('Основной мастер должен иметь роль "master"');
        }
      }

      // Проверка временного мастера
      if (lotData.temp_master_id) {
        const tempMaster = await User.findById(lotData.temp_master_id);
        if (!tempMaster) {
          throw new Error('Временный мастер не найден');
        }
        if (tempMaster.role !== 'master') {
          throw new Error('Временный мастер должен иметь роль "master"');
        }
      }

      const lot = await Lot.update(id, lotData);
      return lot;
    } catch (error) {
      throw new Error(`Ошибка обновления участка: ${error.message}`);
    }
  }

  // Удалить участок (soft delete)
  static async deleteLot(id) {
    try {
      const lot = await Lot.findById(id);
      if (!lot) {
        throw new Error('Участок не найден');
      }

      await Lot.delete(id);
      return { success: true, message: 'Участок деактивирован' };
    } catch (error) {
      throw new Error(`Ошибка удаления участка: ${error.message}`);
    }
  }

  // Восстановить участок
  static async reactivateLot(id) {
    try {
      const result = await Lot.reactivate(id);
      if (result === 0) {
        throw new Error('Участок не найден или уже активен');
      }
      return { success: true, message: 'Участок восстановлен' };
    } catch (error) {
      throw new Error(`Ошибка восстановления участка: ${error.message}`);
    }
  }

  // Назначить временного мастера
  static async assignTempMaster(lotId, tempMasterId) {
    try {
      // Проверка участка
      const lot = await Lot.findById(lotId);
      if (!lot) {
        throw new Error('Участок не найден');
      }

      // Проверка временного мастера
      const tempMaster = await User.findById(tempMasterId);
      if (!tempMaster) {
        throw new Error('Временный мастер не найден');
      }
      if (tempMaster.role !== 'master') {
        throw new Error('Временный мастер должен иметь роль "master"');
      }

      const updatedLot = await Lot.assignTempMaster(lotId, tempMasterId);
      return updatedLot;
    } catch (error) {
      throw new Error(`Ошибка назначения временного мастера: ${error.message}`);
    }
  }

  // Удалить временного мастера
  static async removeTempMaster(lotId) {
    try {
      const lot = await Lot.findById(lotId);
      if (!lot) {
        throw new Error('Участок не найден');
      }

      const updatedLot = await Lot.removeTempMaster(lotId);
      return updatedLot;
    } catch (error) {
      throw new Error(`Ошибка удаления временного мастера: ${error.message}`);
    }
  }

  // Получить участок по коду
  static async getLotByCode(code) {
    try {
      const lot = await Lot.findByCode(code);
      if (!lot) {
        throw new Error('Участок не найден');
      }
      return lot;
    } catch (error) {
      throw new Error(`Ошибка получения участка по коду: ${error.message}`);
    }
  }

  // --- НОВЫЙ МЕТОД ---
  // Получить ВСЕ участки с мастерами для модального окна
  static async getAllLotsWithMasters(status = 'active') {
    try {
      // Лимит 1000 чтобы гарантированно получить все участки
      const lots = await Lot.findAllWithMasters(1000, 0, status);
      return { success: true, data: lots };
    } catch (error) {
       throw new Error(`Ошибка получения участков с мастерами: ${error.message}`);
    }
  }
}

module.exports = LotService;
