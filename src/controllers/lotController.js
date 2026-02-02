const LotService = require('../services/lotService');
const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../utils/errorHandler');

class LotController {
  // Получить все участки
  static getAllLots = asyncHandler(async (req, res) => {
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
  });

  // Получить участок по ID
  static getLotById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { with_masters = 'true' } = req.query;
    const withMasters = with_masters === 'true';

    const lot = await LotService.getLotById(parseInt(id), withMasters);

    res.json({
      success: true,
      data: lot
    });
  });

  // Получить участки по мастеру
  static getLotsByMaster = asyncHandler(async (req, res) => {
    const { masterId } = req.params;

    const lots = await LotService.getLotsByMaster(parseInt(masterId));

    res.json({
      success: true,
      data: lots
    });
  });

  // Создать новый участок
  static createLot = asyncHandler(async (req, res) => {
    // Проверка прав доступа
    if (!req.user || !['admin', 'director'].includes(req.user.role)) {
      throw new AppError('Недостаточно прав для создания участка', 403);
    }

    // Валидация
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Ошибка валидации', 400, errors.array());
    }

    const lotData = req.body;
    const lot = await LotService.createLot(lotData);

    res.status(201).json({
      success: true,
      message: 'Участок создан успешно',
      data: lot
    });
  });

  // Обновить участок
  static updateLot = asyncHandler(async (req, res) => {
    // Проверка прав доступа
    if (!req.user || !['admin', 'director'].includes(req.user.role)) {
      throw new AppError('Недостаточно прав для обновления участка', 403);
    }

    // Валидация
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Ошибка валидации', 400, errors.array());
    }

    const { id } = req.params;
    const lotData = req.body;

    const lot = await LotService.updateLot(parseInt(id), lotData);

    res.json({
      success: true,
      message: 'Участок обновлен успешно',
      data: lot
    });
  });

  // Удалить участок
  static deleteLot = asyncHandler(async (req, res) => {
    // Проверка прав доступа
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError('Недостаточно прав для удаления участка', 403);
    }

    const { id } = req.params;
    const result = await LotService.deleteLot(parseInt(id));

    res.json({
      success: true,
      message: result.message
    });
  });

  // Восстановить участок
  static reactivateLot = asyncHandler(async (req, res) => {
    // Проверка прав доступа
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError('Недостаточно прав для восстановления участка', 403);
    }

    const { id } = req.params;
    const result = await LotService.reactivateLot(parseInt(id));

    res.json({
      success: true,
      message: result.message
    });
  });

  // Назначить временного мастера
  static assignTempMaster = asyncHandler(async (req, res) => {
    // Проверка прав доступа
    if (!req.user || !['admin', 'director'].includes(req.user.role)) {
      throw new AppError('Недостаточно прав для назначения временного мастера', 403);
    }

    const { id } = req.params;
    const { temp_master_id } = req.body;

    if (!temp_master_id) {
      throw new AppError('Не указан ID временного мастера', 400);
    }

    const lot = await LotService.assignTempMaster(parseInt(id), parseInt(temp_master_id));

    res.json({
      success: true,
      message: 'Временный мастер назначен успешно',
      data: lot
    });
  });

  // Удалить временного мастера
  static removeTempMaster = asyncHandler(async (req, res) => {
    // Проверка прав доступа
    if (!req.user || !['admin', 'director'].includes(req.user.role)) {
      throw new AppError('Недостаточно прав для удаления временного мастера', 403);
    }

    const { id } = req.params;
    const lot = await LotService.removeTempMaster(parseInt(id));

    res.json({
      success: true,
      message: 'Временный мастер удалён успешно',
      data: lot
    });
  });

  // Получить участок по коду
  static getLotByCode = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const lot = await LotService.getLotByCode(code);

    res.json({
      success: true,
      data: lot
    });
  });

  static getLotsWithMasters = asyncHandler(async (req, res) => {
    const { status } = req.query;
    // Используем существующий LotService, который умеет обогащать данные
    const result = await LotService.getAllLots(1000, 0, true, status);
    res.json({
        success: true,
        data: result.lots
    });
  });  
}

module.exports = LotController;
