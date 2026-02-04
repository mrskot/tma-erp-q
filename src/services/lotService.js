const Lot = require('../models/Lot');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');

class LotService {
  static async getAllLots({ limit = 100, offset = 0, withMasters = true, status = 'active' } = {}) {
    try {
      const filters = { status };
      const lots = await Lot.findAll({ limit, offset, filters, withMasters });
      const total = await Lot.count(filters);
      return { lots, pagination: { total, limit, offset, hasMore: offset + lots.length < total } };
    } catch (error) {
      throw new AppError(`Ошибка получения участков: ${error.message}`, 500);
    }
  }

  static async getLotById(id, withMasters = true) {
    const lot = withMasters ? await Lot.findByIdWithMasters(id) : await Lot.findById(id);
    if (!lot) throw new AppError('Участок не найден', 404);
    return lot;
  }

  static async getLotsByMaster(masterId) {
    const master = await User.findById(masterId);
    if (!master) throw new AppError('Мастер не найден', 404);
    if (master.role !== 'master') throw new AppError('Указанный пользователь не является мастером', 400);
    return await Lot.findByMaster(masterId);
  }

  static async createLot(lotData) {
    const existingLots = await Lot.findAll({ filters: { code: lotData.code, status: 'all' } });
    if (existingLots.length > 0) throw new AppError('Участок с таким кодом уже существует', 400);

    if (lotData.main_master_id) {
      const mainMaster = await User.findById(lotData.main_master_id);
      if (!mainMaster || mainMaster.role !== 'master') throw new AppError('Основной мастер не найден или не является мастером', 400);
    }
    return await Lot.create(lotData);
  }

  static async updateLot(id, lotData) {
    const existingLot = await Lot.findById(id);
    if (!existingLot) throw new AppError('Участок не найден', 404);

    if (lotData.code && lotData.code !== existingLot.code) {
      const existingLots = await Lot.findAll({ filters: { code: lotData.code, status: 'all' } });
      if (existingLots.length > 0) throw new AppError('Участок с таким кодом уже существует', 400);
    }
    return await Lot.update(id, lotData);
  }

  static async deleteLot(id) {
    const lot = await Lot.findById(id);
    if (!lot) throw new AppError('Участок не найден', 404);
    await Lot.delete(id);
    return { success: true, message: 'Участок деактивировано' };
  }

  static async reactivateLot(id) {
    // FIX: Add 'true' to findById to include inactive lots in the search.
    const lot = await Lot.findById(id, true);
    if (!lot) throw new AppError('Участок не найден', 404);
    const result = await Lot.reactivate(id);
    if (!result) throw new AppError('Не удалось восстановить участок', 500);
    return { success: true, message: 'Участок восстановлен' };
  }

  static async assignTempMaster(lotId, tempMasterId) {
    const lot = await Lot.findById(lotId);
    if (!lot) throw new AppError('Участок не найден', 404);

    const tempMaster = await User.findById(tempMasterId);
    if (!tempMaster || tempMaster.role !== 'master') throw new AppError('Временный мастер не найден или не является мастером', 400);

    return await Lot.assignTempMaster(lotId, tempMasterId);
  }

  static async removeTempMaster(lotId) {
    const lot = await Lot.findById(lotId);
    if (!lot) throw new AppError('Участок не найден', 404);
    return await Lot.removeTempMaster(lotId);
  }

  static async getLotByCode(code) {
    const lot = await Lot.findByCode(code);
    if (!lot) throw new AppError('Участок не найден', 404);
    return lot;
  }

  static async getAllLotsWithMasters(status = 'active') {
    try {
      const filters = { status };
      const lots = await Lot.findAll({ limit: 1000, offset: 0, filters, withMasters: true });
      return { success: true, data: lots };
    } catch (error) {
       throw new AppError(`Ошибка получения участков с мастерами: ${error.message}`, 500);
    }
  }
}

module.exports = LotService;