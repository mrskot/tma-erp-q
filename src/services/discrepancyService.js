const Discrepancy = require('../models/Discrepancy');
const User = require('../models/User');
const Application = require('../models/Application');

class DiscrepancyService {
  static async getAllDiscrepancies(limit = 100, offset = 0) {
    try {
      const discrepancies = await Discrepancy.findAll(limit, offset);
      const total = await Discrepancy.count();

      return {
        discrepancies,
        pagination: { total, limit, offset, hasMore: offset + discrepancies.length < total }
      };
    } catch (error) {
      throw new Error(`Ошибка получения несоответствий: ${error.message}`);
    }
  }

  static async getDiscrepancyById(id) {
    try {
      const disc = await Discrepancy.findById(id);
      if (!disc) throw new Error('Несоответствие не найдено');
      return disc;
    } catch (error) {
      throw new Error(`Ошибка получения несоответствия: ${error.message}`);
    }
  }

  static async getDiscrepanciesByStatus(status, limit = 100, offset = 0) {
    try {
      const statuses = ['new', 'assigned', 'in_progress', 'resolved', 'closed'];
      if (!statuses.includes(status)) throw new Error('Недопустимый статус');

      const discrepancies = await Discrepancy.findByStatus(status, limit, offset);
      return discrepancies;
    } catch (error) {
      throw new Error(`Ошибка получения несоответствий по статусу: ${error.message}`);
    }
  }

  static async getDiscrepanciesByResponsible(responsibleId, limit = 100, offset = 0) {
    try {
      const user = await User.findById(responsibleId);
      if (!user) throw new Error('Ответственное лицо не найдено');

      const discrepancies = await Discrepancy.findByResponsibleId(responsibleId, limit, offset);
      return discrepancies;
    } catch (error) {
      throw new Error(`Ошибка получения несоответствий: ${error.message}`);
    }
  }

  static async getDiscrepanciesByApplication(applicationId) {
    try {
      const app = await Application.findById(applicationId);
      if (!app) throw new Error('Заявка не найдена');

      const discrepancies = await Discrepancy.findByApplicationId(applicationId);
      return discrepancies;
    } catch (error) {
      throw new Error(`Ошибка получения несоответствий заявки: ${error.message}`);
    }
  }

  static async createDiscrepancy(discData) {
    try {
      // Проверка заявки (опционально)
      if (discData.application_id) {
        const app = await Application.findById(discData.application_id);
        if (!app) throw new Error('Заявка не найдена');
      }

      // Проверка ответственного
      if (discData.responsible_id) {
        const user = await User.findById(discData.responsible_id);
        if (!user) throw new Error('Ответственное лицо не найдено');
      }

      // Проверка инспектора
      if (discData.inspector_id) {
        const inspector = await User.findById(discData.inspector_id);
        if (!inspector) throw new Error('Инспектор не найден');
      }

      // Генерируем номер несоответствия
      const timestamp = Date.now().toString().slice(-6);
      discData.discrepancy_number = `DISC-${timestamp}`;

      const discrepancy = await Discrepancy.create(discData);
      return discrepancy;
    } catch (error) {
      throw new Error(`Ошибка создания несоответствия: ${error.message}`);
    }
  }

  static async updateDiscrepancy(id, discData) {
    try {
      const disc = await Discrepancy.findById(id);
      if (!disc) throw new Error('Несоответствие не найдено');

      if (discData.responsible_id) {
        const user = await User.findById(discData.responsible_id);
        if (!user) throw new Error('Ответственное лицо не найдено');
      }

      const updated = await Discrepancy.update(id, discData);
      return updated;
    } catch (error) {
      throw new Error(`Ошибка обновления несоответствия: ${error.message}`);
    }
  }

  static async updateDiscrepancyStatus(id, status, closureScenario = null) {
    try {
      const disc = await Discrepancy.findById(id);
      if (!disc) throw new Error('Несоответствие не найдено');

      const validStatuses = ['new', 'assigned', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) throw new Error('Недопустимый статус');

      const updated = await Discrepancy.updateStatus(id, status, closureScenario);
      return updated;
    } catch (error) {
      throw new Error(`Ошибка обновления статуса: ${error.message}`);
    }
  }

  static async deleteDiscrepancy(id) {
    try {
      const disc = await Discrepancy.findById(id);
      if (!disc) throw new Error('Несоответствие не найдено');

      await Discrepancy.delete(id);
      return { success: true, message: 'Несоответствие деактивировано' };
    } catch (error) {
      throw new Error(`Ошибка удаления несоответствия: ${error.message}`);
    }
  }

  static async getDiscrepanciesBySeverity(severity, limit = 100, offset = 0) {
    try {
      const severities = ['low', 'medium', 'high', 'critical'];
      if (!severities.includes(severity)) throw new Error('Недопустимая серьезность');

      const discrepancies = await Discrepancy.getBySeverity(severity, limit, offset);
      return discrepancies;
    } catch (error) {
      throw new Error(`Ошибка получения несоответствий по серьезности: ${error.message}`);
    }
  }

  static async getDiscrepancyStatistics() {
    try {
      const stats = {};
      const statuses = ['new', 'assigned', 'in_progress', 'resolved', 'closed'];
      
      for (const status of statuses) {
        stats[status] = await Discrepancy.countByStatus(status);
      }

      return stats;
    } catch (error) {
      throw new Error(`Ошибка получения статистики: ${error.message}`);
    }
  }
}

module.exports = DiscrepancyService;
