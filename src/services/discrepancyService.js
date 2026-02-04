const Discrepancy = require('../models/Discrepancy');
const User = require('../models/User');
const Application = require('../models/Application');
const Product = require('../models/Product');
const activityLogService = require('./activityLogService');
const { AppError } = require('../utils/errorHandler');

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
      throw new AppError(`Ошибка получения несоответствий: ${error.message}`, 500);
    }
  }

  static async getDiscrepancyById(id) {
    const disc = await Discrepancy.findById(id);
    if (!disc) throw new AppError('Несоответствие не найдено', 404);
    return disc;
  }

  static async getDiscrepanciesByStatus(status, limit = 100, offset = 0) {
    const statuses = ['new', 'assigned', 'in_progress', 'resolved', 'closed'];
    if (!statuses.includes(status)) throw new AppError('Недопустимый статус', 400);
    return await Discrepancy.findByStatus(status, limit, offset);
  }

  static async getDiscrepanciesByResponsible(responsibleId, limit = 100, offset = 0) {
    const user = await User.findById(responsibleId);
    if (!user) throw new AppError('Ответственное лицо не найдено', 404);
    return await Discrepancy.findByResponsibleId(responsibleId, limit, offset);
  }

  static async getDiscrepanciesByApplication(applicationId) {
    const app = await Application.findById(applicationId);
    if (!app) throw new AppError('Заявка не найдена', 404);
    return await Discrepancy.findByApplicationId(applicationId);
  }

  static async createDiscrepancy(discData, user) {
    if (discData.application_id) {
      const application = await Application.findById(discData.application_id);
      if (!application) throw new AppError('Заявка не найдена', 404);
      // Авто-назначение ответственного (мастер заявки)
      if (!discData.responsible_id) discData.responsible_id = application.master_id;
    }

    if (!discData.responsible_id) discData.responsible_id = user.id;

    // Если создал инспектор - фиксируем его
    if (!discData.inspector_id && ['inspector', 'admin'].includes(user.role)) {
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
  }

  static async updateDiscrepancy(id, discData, user) {
    const oldDisc = await Discrepancy.findById(id);
    if (!oldDisc) throw new AppError('Несоответствие не найдено', 404);

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
  }

  static async updateDiscrepancyStatus(id, status, closureScenario = null, user, additionalData = {}) {
    const oldDisc = await Discrepancy.findById(id);
    if (!oldDisc) throw new AppError('Несоответствие не найдено', 404);

    let finalStatus = status;
    let finalClosureScenario = closureScenario;
    const updateData = { ...additionalData };
    
    // ЛОГИКА LITE/HARD РЕЖИМА
    // Если Мастер пометил как "Устранено" (resolved) и это НЕ спор
    if (status === 'resolved' && !updateData.is_disputed) {
      const application = await Application.findById(oldDisc.application_id);
      if (application) {
        const product = await Product.findById(application.product_id);
        // Если режим LITE -> Автоматическое закрытие
        if (product && product.inspection_mode === 'lite') {
          finalStatus = 'closed';
          finalClosureScenario = 'fixed';
          updateData.closed_at = new Date();
          
          const currentDesc = updateData.description || oldDisc.description || '';
          updateData.description = currentDesc + ' [AUTO-CLOSED: LITE MODE]';
        }
      }
    }

    // Логика закрытия (если статус стал closed вручную или через LITE)
    if (finalStatus === 'closed') {
      updateData.closed_at = updateData.closed_at || new Date();
    }

    const updated = await Discrepancy.updateStatus(id, finalStatus, finalClosureScenario, updateData);

    await activityLogService.log({
      userId: user.id,
      userRole: user.role,
      actionType: 'status_change',
      entityType: 'discrepancy',
      entityId: id,
      oldData: { status: oldDisc.status },
      newData: { status: updated.status },
      description: `Смена статуса несоответствия ${oldDisc.discrepancy_number} на ${finalStatus}`
    });

    return updated;
  }

  static async deleteDiscrepancy(id) {
    const disc = await Discrepancy.findById(id);
    if (!disc) throw new AppError('Несоответствие не найдено', 404);
    await Discrepancy.delete(id);
    return { success: true, message: 'Несоответствие деактивировано' };
  }

  static async getDiscrepanciesBySeverity(severity, limit = 100, offset = 0) {
    return await Discrepancy.getBySeverity(severity, limit, offset);
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
      throw new AppError(`Ошибка получения статистики: ${error.message}`, 500);
    }
  }
}

module.exports = DiscrepancyService;