const DiscrepancyService = require('../services/discrepancyService');
const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../utils/errorHandler');

class DiscrepancyController {
  static getAllDiscrepancies = asyncHandler(async (req, res) => {
    const { limit = 100, offset = 0, status, responsible_id, severity, application_id } = req.query;
    const filters = { 
      status, 
      responsible_id, 
      severity, 
      application_id: application_id ? parseInt(application_id, 10) : undefined 
    };
    const result = await DiscrepancyService.getAllDiscrepancies(filters, parseInt(limit), parseInt(offset));
    res.json({ success: true, data: result.discrepancies, pagination: result.pagination });
  });

  static getDiscrepancyById = asyncHandler(async (req, res) => {
    const disc = await DiscrepancyService.getDiscrepancyById(parseInt(req.params.id));
    res.json({ success: true, data: disc });
  });

  static getDiscrepanciesByStatus = asyncHandler(async (req, res) => {
    const { limit = 100, offset = 0 } = req.query;
    const discrepancies = await DiscrepancyService.getDiscrepanciesByStatus(req.params.status, parseInt(limit), parseInt(offset));
    res.json({ success: true, data: discrepancies });
  });

  static getDiscrepanciesByResponsible = asyncHandler(async (req, res) => {
    const { limit = 100, offset = 0 } = req.query;
    const discrepancies = await DiscrepancyService.getDiscrepanciesByResponsible(parseInt(req.params.responsibleId), parseInt(limit), parseInt(offset));
    res.json({ success: true, data: discrepancies });
  });

  static getDiscrepanciesByApplication = asyncHandler(async (req, res) => {
    const discrepancies = await DiscrepancyService.getDiscrepanciesByApplication(parseInt(req.params.applicationId));
    res.json({ success: true, data: discrepancies });
  });

  static createDiscrepancy = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError('Ошибка валидации', 400, errors.array());
    const disc = await DiscrepancyService.createDiscrepancy(req.body, req.user);
    res.status(201).json({ success: true, message: 'Несоответствие создано', data: disc });
  });

  static updateDiscrepancy = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError('Ошибка валидации', 400, errors.array());
    const disc = await DiscrepancyService.updateDiscrepancy(parseInt(req.params.id), req.body, req.user);
    res.json({ success: true, message: 'Несоответствие обновлено', data: disc });
  });

  static updateDiscrepancyStatus = asyncHandler(async (req, res) => {
    const { status, closure_scenario, ...additionalData } = req.body;
    const disc = await DiscrepancyService.updateDiscrepancyStatus(parseInt(req.params.id), status, closure_scenario, req.user, additionalData);
    res.json({ success: true, message: 'Статус обновлен', data: disc });
  });

  static deleteDiscrepancy = asyncHandler(async (req, res) => {
    const result = await DiscrepancyService.deleteDiscrepancy(parseInt(req.params.id));
    res.json({ success: true, message: result.message });
  });

  static getDiscrepanciesBySeverity = asyncHandler(async (req, res) => {
    const { limit = 100, offset = 0 } = req.query;
    const discrepancies = await DiscrepancyService.getDiscrepanciesBySeverity(req.params.severity, parseInt(limit), parseInt(offset));
    res.json({ success: true, data: discrepancies });
  });

  static getDiscrepancyStatistics = asyncHandler(async (req, res) => {
    const stats = await DiscrepancyService.getDiscrepancyStatistics();
    res.json({ success: true, data: stats });
  });
}

module.exports = DiscrepancyController;