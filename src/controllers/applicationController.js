const ApplicationService = require('../services/applicationService');
const { validationResult } = require('express-validator');

class ApplicationController {
  static async getAllApplications(req, res) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const result = await ApplicationService.getAllApplications(parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: result.applications,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getApplicationById(req, res) {
    try {
      const app = await ApplicationService.getApplicationById(parseInt(req.params.id));
      res.json({ success: true, data: app });
    } catch (error) {
      res.status(error.message.includes('не найдена') ? 404 : 500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async getApplicationsByStatus(req, res) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const applications = await ApplicationService.getApplicationsByStatus(
        req.params.status,
        parseInt(limit),
        parseInt(offset)
      );
      res.json({ success: true, data: applications });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getApplicationsByMaster(req, res) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const applications = await ApplicationService.getApplicationsByMaster(
        parseInt(req.params.masterId),
        parseInt(limit),
        parseInt(offset)
      );
      res.json({ success: true, data: applications });
    } catch (error) {
      res.status(error.message.includes('не найден') ? 404 : 500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async createApplication(req, res) {
    try {
      if (!req.user || !['admin', 'master', 'director'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Недостаточно прав' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const app = await ApplicationService.createApplication(req.body);
      res.status(201).json({ success: true, message: 'Заявка создана', data: app });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateApplication(req, res) {
    try {
      if (!req.user || !['admin', 'master', 'director'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Недостаточно прав' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const app = await ApplicationService.updateApplication(parseInt(req.params.id), req.body);
      res.json({ success: true, message: 'Заявка обновлена', data: app });
    } catch (error) {
      res.status(error.message.includes('не найдена') ? 404 : 400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async updateApplicationStatus(req, res) {
    try {
      if (!req.user || !['admin', 'inspector', 'director'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Недостаточно прав' });
      }

      const { status } = req.body;
      const { rejectionReason } = req.body;

      const app = await ApplicationService.updateApplicationStatus(
        parseInt(req.params.id),
        status,
        rejectionReason
      );
      res.json({ success: true, message: 'Статус обновлен', data: app });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteApplication(req, res) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Недостаточно прав' });
      }

      const result = await ApplicationService.deleteApplication(parseInt(req.params.id));
      res.json({ success: true, message: result.message });
    } catch (error) {
      res.status(error.message.includes('не найдена') ? 404 : 400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async getApplicationStatistics(req, res) {
    try {
      const stats = await ApplicationService.getApplicationStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = ApplicationController;
