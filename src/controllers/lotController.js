const LotService = require('../services/lotService');
const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../utils/errorHandler');

class LotController {
  static getAllLots = asyncHandler(async (req, res) => {
    const { limit = 100, offset = 0, with_masters = 'true', status = 'active' } = req.query;
    const result = await LotService.getAllLots({
      limit: parseInt(limit), offset: parseInt(offset),
      withMasters: with_masters === 'true', status
    });
    res.json({ success: true, data: result });
  });

  static getLotById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { with_masters = 'true' } = req.query;
    const lot = await LotService.getLotById(parseInt(id), with_masters === 'true');
    res.json({ success: true, data: lot });
  });

  static getLotsByMaster = asyncHandler(async (req, res) => {
    const { masterId } = req.params;
    const lots = await LotService.getLotsByMaster(parseInt(masterId));
    res.json({ success: true, data: lots });
  });

  static createLot = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError('Ошибка валидации', 400, errors.array());
    const lot = await LotService.createLot(req.body);
    res.status(201).json({ success: true, message: 'Участок создан успешно', data: lot });
  });

  static updateLot = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError('Ошибка валидации', 400, errors.array());
    const { id } = req.params;
    const lot = await LotService.updateLot(parseInt(id), req.body);
    res.json({ success: true, message: 'Участок обновлен успешно', data: lot });
  });

  static deleteLot = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await LotService.deleteLot(parseInt(id));
    res.json({ success: true, message: result.message });
  });

  static reactivateLot = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await LotService.reactivateLot(parseInt(id));
    res.json({ success: true, message: result.message });
  });

  static assignTempMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { temp_master_id } = req.body;
    if (!temp_master_id) throw new AppError('Не указан ID временного мастера', 400);
    const lot = await LotService.assignTempMaster(parseInt(id), parseInt(temp_master_id));
    res.json({ success: true, message: 'Временный мастер назначен успешно', data: lot });
  });

  static removeTempMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const lot = await LotService.removeTempMaster(parseInt(id));
    res.json({ success: true, message: 'Временный мастер удалён успешно', data: lot });
  });
  
  static getLotsWithMasters = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const result = await LotService.getAllLots({ limit: 1000, offset: 0, withMasters: true, status });
    res.json({ success: true, data: { lots: result.lots, pagination: result.pagination } });
  });  
}

module.exports = LotController;