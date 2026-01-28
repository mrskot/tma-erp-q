const Application = require('../models/Application');
const User = require('../models/User');
const Product = require('../models/Product');
const Lot = require('../models/Lot');
const Discrepancy = require('../models/Discrepancy');
const activityLogService = require('./activityLogService');
const { AppError } = require('../utils/errorHandler');

class ApplicationService {
  /**
   * Получает список заявок с учетом роли пользователя и фильтров.
   * @param {object} filters - Объект с фильтрами (например, { status: 'new' }).
   * @param {object} user - Объект пользователя, выполняющего запрос.
   * @param {number} limit - Лимит записей.
   * @param {number} offset - Смещение.
   * @returns {Promise<object>} - Объект с заявками и пагинацией.
   */
  static async getAllApplications(filters, user, limit = 100, offset = 0) {
    try {
      const applications = await Application.findAll({ filters, user, limit, offset });
      // TODO: Доработать Application.count() для учета фильтров и роли
      const total = await Application.count(); 

      return {
        success: true,
        data: applications,
        pagination: { total, limit, offset, hasMore: offset + applications.length < total }
      };
    } catch (error) {
      throw new AppError(`Ошибка получения заявок: ${error.message}`, 500);
    }
  }

  /**
   * Получает одну заявку по ID.
   * @param {number} id - ID заявки.
   * @returns {Promise<object>} - Найденная заявка.
   */
  static async getApplicationById(id) {
    try {
      const app = await Application.findById(id);
      if (!app) throw new AppError('Заявка не найдена', 404);
      return { success: true, data: app };
    } catch (error) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }

  /**
   * Пакетно создает заявки на основе переданных данных.
   * @param {object} batchData - Данные для создания пакета заявок.
   * @returns {Promise<object>} - Созданные заявки.
   */
  static async createBatchApplications(batchData) {
    try {
      const {
        product_id,
        lot_id,
        master_id,
        drawing_number,
        desired_inspection_time,
        quantity = 1,
        serial_numbers = [],
        has_serial_numbers = false,
        notes
      } = batchData;

      if (!product_id || !lot_id || !master_id || !desired_inspection_time) {
        throw new AppError('Не все обязательные поля были предоставлены.', 400);
      }
      
      // 1. Поиск изделия для получения контролёра по умолчанию
      const product = await Product.findById(product_id);
      if (!product) throw new AppError('Изделие не найдено', 404);

      const [lot, master] = await Promise.all([
        Lot.findById(lot_id),
        User.findById(master_id)
      ]);
      if (!lot) throw new AppError('Участок не найден', 404);
      if (!master || master.role !== 'master') throw new AppError('Мастер не найден или пользователь не является мастером', 400);

      // 2. Определение контролёра (по умолчанию из изделия)
      const defaultInspectorId = product.default_inspector_id;

      if (has_serial_numbers && serial_numbers.length !== quantity) {
        throw new AppError('Количество серийных номеров не соответствует заявленному количеству.', 400);
      }

      const applicationsToCreate = [];
      const baseNumber = `APP-${Date.now().toString().slice(-8)}`;

      for (let i = 0; i < quantity; i++) {
        const serial_number = has_serial_numbers ? serial_numbers[i].trim() : null;
        if (has_serial_numbers && !serial_number) {
            throw new AppError(`Серийный номер для экземпляра ${i+1} не может быть пустым.`, 400);
        }

        applicationsToCreate.push({
          application_number: `${baseNumber}-${i + 1}`,
          product_id,
          lot_id,
          master_id,
          drawing_number,
          desired_inspection_time,
          quantity: 1,
          serial_number,
          status: defaultInspectorId ? 'assigned' : 'new',
          inspector_id: defaultInspectorId || null,
          assigned_at: defaultInspectorId ? new Date() : null,
          rejection_reason: notes || null
        });
      }

      const createdApplications = await Application.createBatch(applicationsToCreate);
      return { success: true, data: createdApplications };
    } catch (error) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }

  /**
   * Обновляет заявку.
   * @param {number} id - ID заявки.
   * @param {object} appData - Данные для обновления.
   * @param {object} user - Пользователь, выполняющий операцию.
   * @returns {Promise<object>} - Обновленная заявка.
   */
  static async updateApplication(id, appData, user) {
    try {
      const oldApp = await Application.findById(id);
      if (!oldApp) throw new AppError('Заявка не найдена', 404);

      if (user.role === 'master' && oldApp.master_id !== user.id && oldApp.status !== 'new') {
        throw new AppError('Мастер может редактировать только свои новые заявки', 403);
      }
      
      if (appData.inspector_id) {
        const inspector = await User.findById(appData.inspector_id);
        if (!inspector || inspector.role !== 'inspector') throw new AppError('Контролёр не найден или не является контролёром', 400);
      }

      const updated = await Application.update(id, appData);

      // Логирование действия
      await activityLogService.log({
        userId: user.id,
        userRole: user.role,
        actionType: 'update',
        entityType: 'application',
        entityId: id,
        oldData: oldApp,
        newData: updated,
        description: `Обновление заявки ${oldApp.application_number}`
      });

      return { success: true, data: updated };
    } catch (error) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }

  /**
   * Обновляет статус заявки.
   * @param {number} id - ID заявки.
   * @param {string} status - Новый статус.
   * @param {string} rejectionReason - Причина отклонения (если есть).
   * @param {object} user - Пользователь, выполняющий операцию.
   * @returns {Promise<object>} - Обновленная заявка.
   */
  static async updateApplicationStatus(id, status, rejectionReason = null, user) {
    try {
      const oldApp = await Application.findById(id);
      if (!oldApp) throw new AppError('Заявка не найдена', 404);

      const validStatuses = ['new', 'assigned', 'in_progress', 'accepted', 'rejected'];
      if (!validStatuses.includes(status)) throw new AppError('Недопустимый статус', 400);

      // ЖЕСТКАЯ БИЗНЕС-ЛОГИКА: Запрет принятия с открытыми дефектами
      if (status === 'accepted') {
        const discrepancies = await Discrepancy.findByApplicationId(id);
        const openDiscrepancies = discrepancies.filter(d => d.status !== 'closed');
        
        if (openDiscrepancies.length > 0) {
          throw new AppError('Нельзя принять изделие с незакрытыми несоответствиями', 400);
        }
      }

      const updated = await Application.updateStatus(id, status, rejectionReason);

      // Логирование смены статуса
      await activityLogService.log({
        userId: user.id,
        userRole: user.role,
        actionType: 'status_change',
        entityType: 'application',
        entityId: id,
        oldData: { status: oldApp.status, rejection_reason: oldApp.rejection_reason },
        newData: { status: updated.status, rejection_reason: updated.rejection_reason },
        description: `Смена статуса заявки ${oldApp.application_number} на ${status}`
      });

      return { success: true, data: updated };
    } catch (error) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }

  /**
   * Деактивирует (мягкое удаление) заявку.
   * @param {number} id - ID заявки.
   * @returns {Promise<object>} - Сообщение об успехе.
   */
  static async deleteApplication(id) {
    try {
      const app = await Application.findById(id);
      if (!app) throw new AppError('Заявка не найдена', 404);

      await Application.delete(id);
      return { success: true, message: 'Заявка деактивирована' };
    } catch (error) {
      throw new AppError(`Ошибка удаления заявки: ${error.message}`, 500);
    }
  }

  /**
   * Получает статистику по статусам заявок.
   * @returns {Promise<object>} - Объект со статистикой.
   */
  static async getApplicationStatistics() {
    try {
      const stats = {};
      const statuses = ['new', 'assigned', 'in_progress', 'accepted', 'rejected'];
      
      for (const status of statuses) {
        stats[status] = await Application.countByStatus(status);
      }

      return { success: true, data: stats };
    } catch (error) {
      throw new AppError(`Ошибка получения статистики: ${error.message}`, 500);
    }
  }
}

module.exports = ApplicationService;
