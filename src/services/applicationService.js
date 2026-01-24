const Application = require('../models/Application');
const User = require('../models/User');
const Product = require('../models/Product');
const Lot = require('../models/Lot');

class ApplicationService {
  static async getAllApplications(limit = 100, offset = 0) {
    try {
      const applications = await Application.findAll(limit, offset);
      const total = await Application.count();

      return {
        applications,
        pagination: { total, limit, offset, hasMore: offset + applications.length < total }
      };
    } catch (error) {
      throw new Error(`Ошибка получения заявок: ${error.message}`);
    }
  }

  static async getApplicationById(id) {
    try {
      const app = await Application.findById(id);
      if (!app) throw new Error('Заявка не найдена');
      return app;
    } catch (error) {
      throw new Error(`Ошибка получения заявки: ${error.message}`);
    }
  }

  static async getApplicationsByStatus(status, limit = 100, offset = 0) {
    try {
      const statuses = ['new', 'assigned', 'in_progress', 'accepted', 'rejected'];
      if (!statuses.includes(status)) throw new Error('Недопустимый статус');

      const applications = await Application.findByStatus(status, limit, offset);
      return applications;
    } catch (error) {
      throw new Error(`Ошибка получения заявок по статусу: ${error.message}`);
    }
  }

  static async getApplicationsByMaster(masterId, limit = 100, offset = 0) {
    try {
      const master = await User.findById(masterId);
      if (!master) throw new Error('Мастер не найден');

      const applications = await Application.findByMasterId(masterId, limit, offset);
      return applications;
    } catch (error) {
      throw new Error(`Ошибка получения заявок мастера: ${error.message}`);
    }
  }

  static async createApplication(appData) {
    try {
      // Проверка мастера
      const master = await User.findById(appData.master_id);
      if (!master) throw new Error('Мастер не найден');

      // Проверка участка
      const lot = await Lot.findById(appData.lot_id);
      if (!lot) throw new Error('Участок не найден');

      // Проверка изделия
      const product = await Product.findById(appData.product_id);
      if (!product) throw new Error('Изделие не найдено');

      // Генерируем номер заявки
      const timestamp = Date.now().toString().slice(-6);
      appData.application_number = `APP-${timestamp}`;

      const application = await Application.create(appData);
      return application;
    } catch (error) {
      throw new Error(`Ошибка создания заявки: ${error.message}`);
    }
  }

  static async updateApplication(id, appData) {
    try {
      const app = await Application.findById(id);
      if (!app) throw new Error('Заявка не найдена');

      if (appData.master_id) {
        const master = await User.findById(appData.master_id);
        if (!master) throw new Error('Мастер не найден');
      }

      const updated = await Application.update(id, appData);
      return updated;
    } catch (error) {
      throw new Error(`Ошибка обновления заявки: ${error.message}`);
    }
  }

  static async updateApplicationStatus(id, status, rejectionReason = null) {
    try {
      const app = await Application.findById(id);
      if (!app) throw new Error('Заявка не найдена');

      const validStatuses = ['new', 'assigned', 'in_progress', 'accepted', 'rejected'];
      if (!validStatuses.includes(status)) throw new Error('Недопустимый статус');

      const updated = await Application.updateStatus(id, status, rejectionReason);
      return updated;
    } catch (error) {
      throw new Error(`Ошибка обновления статуса: ${error.message}`);
    }
  }

  static async deleteApplication(id) {
    try {
      const app = await Application.findById(id);
      if (!app) throw new Error('Заявка не найдена');

      await Application.delete(id);
      return { success: true, message: 'Заявка деактивирована' };
    } catch (error) {
      throw new Error(`Ошибка удаления заявки: ${error.message}`);
    }
  }

  static async getApplicationStatistics() {
    try {
      const stats = {};
      const statuses = ['new', 'assigned', 'in_progress', 'accepted', 'rejected'];
      
      for (const status of statuses) {
        stats[status] = await Application.countByStatus(status);
      }

      return stats;
    } catch (error) {
      throw new Error(`Ошибка получения статистики: ${error.message}`);
    }
  }
}

module.exports = ApplicationService;
