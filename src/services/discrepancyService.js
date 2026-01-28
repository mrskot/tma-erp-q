const Discrepancy = require('../models/Discrepancy');
const User = require('../models/User');
const Application = require('../models/Application');
const activityLogService = require('./activityLogService');

class DiscrepancyService {
  static async getAllDiscrepancies(filters = {}, limit = 100, offset = 0) {
    try {
      const discrepancies = await Discrepancy.findAll(filters, limit, offset);
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

  static async createDiscrepancy(discData, user) {
    try {
      let application = null;
      if (discData.application_id) {
        application = await Application.findById(discData.application_id);
        if (!application) throw new Error('Заявка не найдена');
      }

      if (!discData.responsible_id && application) {
        discData.responsible_id = application.master_id;
      }

      if (discData.responsible_id) {
        const responsible = await User.findById(discData.responsible_id);
        if (!responsible) throw new Error('Ответственное лицо не найдено');
      }

      if (!discData.inspector_id && user && user.role === 'inspector') {
        discData.inspector_id = user.id;
      }

      const timestamp = Date.now().toString().slice(-6);
      discData.discrepancy_number = `DISC-${timestamp}`;
      discData.detected_at = new Date();

      const discrepancy = await Discrepancy.create(discData);

      await activityLogService.log({
        userId: user.id,
        userRole: user.role,
        actionType: 'create',
        entityType: 'discrepancy',
        entityId: discrepancy.id,
        newData: discrepancy,
        description: `Создание несоответствия ${discrepancy.discrepancy_number}`
      });

      return discrepancy;
    } catch (error) {
      throw new Error(`Ошибка создания несоответствия: ${error.message}`);
    }
  }

  static async updateDiscrepancy(id, discData, user) {
    try {
      const oldDisc = await Discrepancy.findById(id);
      if (!oldDisc) throw new Error('Несоответствие не найдено');

      if (discData.responsible_id) {
        const responsible = await User.findById(discData.responsible_id);
        if (!responsible) throw new Error('Ответственное лицо не найдено');
      }

      const updated = await Discrepancy.update(id, discData);

      await activityLogService.log({
        userId: user.id,
        userRole: user.role,
        actionType: 'update',
        entityType: 'discrepancy',
        entityId: id,
        oldData: oldDisc,
        newData: updated,
        description: `Обновление несоответствия ${oldDisc.discrepancy_number}`
      });

      return updated;
    } catch (error) {
      throw new Error(`Ошибка обновления несоответствия: ${error.message}`);
    }
  }

  static async updateDiscrepancyStatus(id, status, closureScenario = null, user, additionalData = {}) {
    try {
      const oldDisc = await Discrepancy.findById(id);
      if (!oldDisc) throw new Error('Несоответствие не найдено');

      const validStatuses = ['new', 'assigned', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) throw new Error('Недопустимый статус');

      const updateData = { ...additionalData };

      // ЛОГИКА ДЛЯ МАСТЕРА (Устранение)
      if (status === 'resolved' && !updateData.is_disputed) {
        if (!updateData.fix_photo_url) {
          throw new Error('Для отметки об устранении необходимо приложить фото результата');
        }
      }

      // ЛОГИКА ДЛЯ АРБИТРАЖА (Спор)
      if (updateData.is_disputed && !updateData.special_opinion) {
        throw new Error('При оспаривании дефекта необходимо указать причину в особом мнении');
      }

      // ЛОГИКА ЗАКРЫТИЯ (Контролер/Директор)
      if (status === 'closed') {
        if (!closureScenario) {
          throw new Error('При закрытии несоответствия необходимо указать сценарий закрытия (Устранено/КР/Брак)');
        }
        updateData.closed_at = new Date();
      }

      const updated = await Discrepancy.updateStatus(id, status, closureScenario, updateData);

      await activityLogService.log({
        userId: user.id,
        userRole: user.role,
        actionType: 'status_change',
        entityType: 'discrepancy',
        entityId: id,
        oldData: { 
          status: oldDisc.status, 
          closure_scenario: oldDisc.closure_scenario,
          is_disputed: oldDisc.is_disputed 
        },
        newData: { 
          status: updated.status, 
          closure_scenario: updated.closure_scenario,
          is_disputed: updated.is_disputed 
        },
        description: `Смена статуса несоответствия ${oldDisc.discrepancy_number} на ${status}${updated.is_disputed ? ' (ОСПОРЕНО)' : ''}`
      });

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
