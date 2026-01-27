const LotService = require('../services/lotService');
const { validationResult } = require('express-validator');

class LotController {
  // Получить все участки
  static async getAllLots(req, res) {
    try {
      const { limit = 100, offset = 0, with_masters = 'true', status = 'active' } = req.query;
      const withMasters = with_masters === 'true';

      const result = await LotService.getAllLots(
        parseInt(limit),
        parseInt(offset),
        withMasters,
        status
      );

      res.json({
        success: true,
        data: result.lots,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Получить участок по ID
  static async getLotById(req, res) {
    try {
      const { id } = req.params;
      const { with_masters = 'true' } = req.query;
      const withMasters = with_masters === 'true';

      const lot = await LotService.getLotById(parseInt(id), withMasters);

      res.json({
        success: true,
        data: lot
      });
    } catch (error) {
      const statusCode = error.message.includes('не найден') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Получить участки по мастеру
  static async getLotsByMaster(req, res) {
    try {
      const { masterId } = req.params;

      const lots = await LotService.getLotsByMaster(parseInt(masterId));

      res.json({
        success: true,
        data: lots
      });
    } catch (error) {
      const statusCode = error.message.includes('не найден') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Создать новый участок
  static async createLot(req, res) {
    try {
      // Проверка прав доступа
      if (!req.user || !['admin', 'director'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Недостаточно прав для создания участка'
        });
      }

      // Валидация
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors for creating lot:', errors.array());
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: 'Ошибка валидации: ' + errors.array().map(e => e.msg).join(', ')
        });
      }

      const lotData = req.body;
      const lot = await LotService.createLot(lotData);

      res.status(201).json({
        success: true,
        message: 'Участок создан успешно',
        data: lot
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Обновить участок
  static async updateLot(req, res) {
    try {
      // Проверка прав доступа
      if (!req.user || !['admin', 'director'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Недостаточно прав для обновления участка'
        });
      }

      // Валидация
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const lotData = req.body;

      const lot = await LotService.updateLot(parseInt(id), lotData);

      res.json({
        success: true,
        message: 'Участок обновлен успешно',
        data: lot
      });
    } catch (error) {
      const statusCode = error.message.includes('не найден') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Удалить участок
  static async deleteLot(req, res) {
    try {
      // Проверка прав доступа
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Недостаточно прав для удаления участка'
        });
      }

      const { id } = req.params;
      const result = await LotService.deleteLot(parseInt(id));

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('не найден') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Восстановить участок
  static async reactivateLot(req, res) {
    try {
      // Проверка прав доступа
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Недостаточно прав для восстановления участка'
        });
      }

      const { id } = req.params;
      const result = await LotService.reactivateLot(parseInt(id));

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('не найден') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Назначить временного мастера
  static async assignTempMaster(req, res) {
    try {
      // Проверка прав доступа
      if (!req.user || !['admin', 'director'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Недостаточно прав для назначения временного мастера'
        });
      }

      const { id } = req.params;
      const { temp_master_id } = req.body;

      if (!temp_master_id) {
        return res.status(400).json({
          success: false,
          message: 'Не указан ID временного мастера'
        });
      }

      const lot = await LotService.assignTempMaster(parseInt(id), parseInt(temp_master_id));

      res.json({
        success: true,
        message: 'Временный мастер назначен успешно',
        data: lot
      });
    } catch (error) {
      const statusCode = error.message.includes('не найден') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Удалить временного мастера
  static async removeTempMaster(req, res) {
    try {
      // Проверка прав доступа
      if (!req.user || !['admin', 'director'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Недостаточно прав для удаления временного мастера'
        });
      }

      const { id } = req.params;
      const lot = await LotService.removeTempMaster(parseInt(id));

      res.json({
        success: true,
        message: 'Временный мастер удалён успешно',
        data: lot
      });
    } catch (error) {
      const statusCode = error.message.includes('не найден') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Получить участок по коду
  static async getLotByCode(req, res) {
    try {
      const { code } = req.params;
      const lot = await LotService.getLotByCode(code);

      res.json({
        success: true,
        data: lot
      });
    } catch (error) {
      const statusCode = error.message.includes('не найден') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getLotsWithMasters(req, res) {
    try {
        const { status } = req.query;
        // Используем существующий LotService, который умеет обогащать данные
        const result = await LotService.getAllLots(1000, 0, true, status);
        res.json({
            success: true,
            data: result.lots
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
  }  
}

module.exports = LotController;