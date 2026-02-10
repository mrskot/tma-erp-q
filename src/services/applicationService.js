const Application = require('../models/Application');
const User = require('../models/User');
const UserAvailability = require('../models/UserAvailability');
const Product = require('../models/Product');
const Lot = require('../models/Lot');
const Discrepancy = require('../models/Discrepancy');
const activityLogService = require('./activityLogService');
const { AppError } = require('../utils/errorHandler');

class ApplicationService {

  static async getAllApplications(filters, user, limit = 100, offset = 0) {
    try {
      const applications = await Application.findAll({ filters, user, limit, offset });
      const total = await Application.count(); 

      // FIX: Service should return raw data, controller will wrap it.
      return {
        applications,
        pagination: { total, limit, offset, hasMore: offset + applications.length < total }
      };
    } catch (error) {
      throw new AppError(`Ошибка получения заявок: ${error.message}`, 500);
    }
  }

  static async getApplicationById(id) {
    const app = await Application.findById(id);
    if (!app) throw new AppError('Заявка не найдена', 404);
    return app;
  }

  static async createBatchApplications(batchData, user) {
    try {
      const {
        product_id, lot_id, master_id, drawing_number, production_order_number,
        desired_inspection_time, quantity = 1, has_serial_numbers = false,
        notes, serial_data = []
      } = batchData;

      if (!product_id || !lot_id || !master_id || !desired_inspection_time) {
        throw new AppError('Не все обязательные поля предоставлены.', 400);
      }
      
      const product = await Product.findById(product_id);
      if (!product) throw new AppError('Изделие не найдено', 404);

      // ... (rest of the logic remains the same)
      const applicationsToCreate = [];
      const baseNumber = `APP-${Date.now().toString().slice(-8)}`;

      for (let i = 0; i < quantity; i++) {
        let serial_number = null;
        let mki_photo_url = notes || null;

        if (has_serial_numbers && serial_data[i]) {
            serial_number = serial_data[i].serial_number;
            mki_photo_url = serial_data[i].mki_photo_url || mki_photo_url;
        }

        applicationsToCreate.push({
          application_number: `${baseNumber}-${i + 1}`,
          product_id, lot_id, master_id, drawing_number, production_order_number,
          desired_inspection_time, quantity: 1, serial_number, status: 'new',
          mki_photo_url
        });
      }
      const createdApplications = await Application.createBatch(applicationsToCreate);

      // Auto-assign inspector only if a valid, active, and available default inspector is set
      const inspectorId = product.default_inspector_id;
      if (inspectorId && Number.isInteger(inspectorId) && inspectorId > 0) {
          // Проверяем, активен ли контролёр и доступен ли он
          const inspector = await User.findById(inspectorId);
          const availability = await UserAvailability.findByUserId(inspectorId);

          if (inspector && inspector.is_active && availability && availability.is_available) {
              // Контролёр найден, активен и доступен -> назначаем заявку
              const idsToUpdate = createdApplications.map(app => app.id);
              await Application.instance.db('applications')
                  .whereIn('id', idsToUpdate)
                  .update({
                      status: 'assigned',
                      inspector_id: inspectorId,
                      assigned_at: new Date()
                  });
              
              await activityLogService.log({
                  userId: user.id, userRole: user.role, actionType: 'auto_assign',
                  entityType: 'application', entityId: null, newData: { count: idsToUpdate.length, inspectorId },
                  description: `Авто-назначение ${idsToUpdate.length} заявок на инспектора #${inspectorId}`
              });
          }
          // Если inspector не найден, не активен или не доступен, ничего не делаем. 
          // Заявка останется со статусом 'new' и попадет в общую очередь.
      }

      // Log activity
      await activityLogService.log({
          userId: user.id, userRole: user.role, actionType: 'create_batch',
          entityType: 'application', entityId: null, newData: { count: createdApplications.length },
          description: `Создана партия заявок (${createdApplications.length} шт.)`
      });

      return createdApplications;
    } catch (error) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }

  static async updateApplication(id, appData, user) {
    const oldApp = await Application.findById(id);
    if (!oldApp) throw new AppError('Заявка не найдена', 404);

    if (user.role === 'master' && oldApp.master_id !== user.id && oldApp.status !== 'new') {
      throw new AppError('Мастер может редактировать только свои новые заявки', 403);
    }
    
    const updated = await Application.update(id, appData);
    await activityLogService.log({
      userId: user.id, userRole: user.role, actionType: 'update',
      entityType: 'application', entityId: id, oldData: oldApp, newData: updated,
      description: `Обновление заявки ${oldApp.application_number}`
    });
    return updated;
  }

  static async updateApplicationStatus(id, status, rejectionReason = null, user) {
    const oldApp = await Application.findById(id);
    if (!oldApp) throw new AppError('Заявка не найдена', 404);
    
    // ... (rest of the logic remains the same)
    let updatePayload = { status, rejection_reason: rejectionReason };

    if (status === 'in_progress' && !oldApp.inspector_id && (user.role === 'inspector' || user.role === 'admin')) {
      updatePayload.inspector_id = user.id;
      updatePayload.assigned_at = new Date();
    }
    
    const updated = await Application.update(id, updatePayload);
    await activityLogService.log({
      userId: user.id, userRole: user.role, actionType: 'status_change',
      entityType: 'application', entityId: id, oldData: { status: oldApp.status },
      newData: { status: updated.status },
      description: `Смена статуса заявки ${oldApp.application_number} на ${status}`
    });
    return updated;
  }

  static async deleteApplication(id, user) {
    const app = await Application.findById(id);
    if (!app) throw new AppError('Заявка не найдена', 404);

    if (user.role === 'master' && (app.master_id !== user.id || app.status !== 'new')) {
      throw new AppError('Вы можете удалять только свои новые заявки', 403);
    }

    await Application.delete(id);
    return { success: true, message: 'Заявка успешно удалена' };
  }

  static async getApplicationStatistics() {
    const stats = {};
    const statuses = ['new', 'assigned', 'in_progress', 'accepted', 'rejected'];
    for (const status of statuses) {
      stats[status] = await Application.countByStatus(status);
    }
    return stats;
  }
}

module.exports = ApplicationService;