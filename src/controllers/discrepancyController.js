const DiscrepancyService = require('../services/discrepancyService');
const { validationResult } = require('express-validator');

class DiscrepancyController {
  static async getAllDiscrepancies(req, res) {
    try {
      const { limit = 100, offset = 0, status, responsible_id, severity, application_id } = req.query;
      const filters = { 
        status, 
        responsible_id, 
        severity,
        application_id: application_id ? parseInt(application_id, 10) : undefined 
      };
      const result = await DiscrepancyService.getAllDiscrepancies(filters, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: result.discrepancies,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getDiscrepancyById(req, res) {
    try {
      const disc = await DiscrepancyService.getDiscrepancyById(parseInt(req.params.id));
      res.json({ success: true, data: disc });
    } catch (error) {
      res.status(error.message.includes('не найдено') ? 404 : 500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async getDiscrepanciesByStatus(req, res) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const discrepancies = await DiscrepancyService.getDiscrepanciesByStatus(
        req.params.status,
        parseInt(limit),
        parseInt(offset)
      );
      res.json({ success: true, data: discrepancies });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getDiscrepanciesByResponsible(req, res) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const discrepancies = await DiscrepancyService.getDiscrepanciesByResponsible(
        parseInt(req.params.responsibleId),
        parseInt(limit),
        parseInt(offset)
      );
      res.json({ success: true, data: discrepancies });
    } catch (error) {
      res.status(error.message.includes('не найдено') ? 404 : 500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async getDiscrepanciesByApplication(req, res) {
    try {
      const discrepancies = await DiscrepancyService.getDiscrepanciesByApplication(
        parseInt(req.params.applicationId)
      );
      res.json({ success: true, data: discrepancies });
    } catch (error) {
      res.status(error.message.includes('не найдена') ? 404 : 500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async createDiscrepancy(req, res) {
    try {
      if (!req.user || !['admin', 'inspector', 'director'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Недостаточно прав' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            errors: errors.array(),
            message: 'Ошибка валидации: ' + errors.array().map(e => e.msg).join(', ')
        });
      }

      const disc = await DiscrepancyService.createDiscrepancy(req.body, req.user);
      res.status(201).json({ success: true, message: 'Несоответствие создано', data: disc });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateDiscrepancy(req, res) {
    try {
      if (!req.user || !['admin', 'inspector', 'director', 'master'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Недостаточно прав' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const disc = await DiscrepancyService.updateDiscrepancy(parseInt(req.params.id), req.body, req.user);
      res.json({ success: true, message: 'Несоответствие обновлено', data: disc });
    } catch (error) {
      res.status(error.message.includes('не найдено') ? 404 : 400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async updateDiscrepancyStatus(req, res) {
    try {
      if (!req.user || !['admin', 'inspector', 'director', 'master'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Недостаточно прав' });
      }

      const { status, closure_scenario, ...additionalData } = req.body;
      const disc = await DiscrepancyService.updateDiscrepancyStatus(
        parseInt(req.params.id),
        status,
        closure_scenario,
        req.user,
        additionalData
      );
      res.json({ success: true, message: 'Статус обновлен', data: disc });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteDiscrepancy(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Недостаточно прав' });
      }

      const result = await DiscrepancyService.deleteDiscrepancy(parseInt(req.params.id));
      res.json({ success: true, message: result.message });
    } catch (error) {
      res.status(error.message.includes('не найдено') ? 404 : 400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async getDiscrepanciesBySeverity(req, res) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const discrepancies = await DiscrepancyService.getDiscrepanciesBySeverity(
        req.params.severity,
        parseInt(limit),
        parseInt(offset)
      );
      res.json({ success: true, data: discrepancies });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getDiscrepancyStatistics(req, res) {
    try {
      const stats = await DiscrepancyService.getDiscrepancyStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = DiscrepancyController;
