const db = require('../config/database');
const BaseModel = require('./BaseModel');

class Lot extends BaseModel {
  constructor() {
    super('lots');
  }

  static instance = new Lot();

  /**
   * Расширенная выборка с мастерами
   */
  async findAll({ limit = 100, offset = 0, filters = {}, withMasters = false } = {}) {
    const query = this.db(`${this.tableName} as l`).select('l.*');

    // Модульный стандарт фильтрации статуса
    const status = filters.status || 'active';
    if (status === 'inactive') {
      query.where('l.is_active', false);
    } else if (status === 'all') {
      // Без фильтра
    } else {
      query.where('l.is_active', true);
    }

    // Другие фильтры
    if (filters.code) {
      query.where('l.code', filters.code);
    }
    if (withMasters) {
      query.select(
        this.db.raw("m.first_name || ' ' || m.last_name as main_master_name"),
        this.db.raw("t.first_name || ' ' || t.last_name as temp_master_name")
      )
      .leftJoin('users as m', 'l.main_master_id', 'm.id')
      .leftJoin('users as t', 'l.temp_master_id', 't.id');
    }

    return query.orderBy('l.priority', 'asc').limit(limit).offset(offset);
  }

  /**
   * Поиск по ID с мастерами и поддержкой includeInactive
   */
  async findById(id, includeInactive = false) {
    const query = this.db(`${this.tableName} as l`).select('l.*').where('l.id', id);

    if (!includeInactive) {
      query.where('l.is_active', true);
    }
      query.select(
        this.db.raw("m.first_name || ' ' || m.last_name as main_master_name"),
        this.db.raw("t.first_name || ' ' || t.last_name as temp_master_name")
      )
      .leftJoin('users as m', 'l.main_master_id', 'm.id')
      .leftJoin('users as t', 'l.temp_master_id', 't.id');
    return query.first();
  }

  /**
   * Поиск по коду
   */
  async findByCode(code) {
    return this.db(this.tableName)
      .where({ code, is_active: true })
      .first();
  }

  /**
   * Назначение временного мастера
   */
  async assignTempMaster(id, tempMasterId) {
    return this.update(id, { temp_master_id: tempMasterId });
  }

  /**
   * Удаление временного мастера
   */
  async removeTempMaster(id) {
    return this.update(id, { temp_master_id: null });
  }

  // --- Статические обертки ---

  static async findById(id, withMasters = false) {
    return Lot.instance.findById(id, withMasters);
  }

  static async findAll(params) {
    return Lot.instance.findAll(params);
  }

  static async findByCode(code) {
    return Lot.instance.findByCode(code);
  }

  static async create(data) {
    return Lot.instance.create(data);
  }

  static async update(id, data) {
    return Lot.instance.update(id, data);
  }

  static async delete(id) {
    return Lot.instance.delete(id);
  }

  static async reactivate(id) {
    return Lot.instance.restore(id);
  }

  static async assignTempMaster(id, tempMasterId) {
    return Lot.instance.assignTempMaster(id, tempMasterId);
  }

  static async removeTempMaster(id) {
    return Lot.instance.removeTempMaster(id);
  }

  static async count(filters = {}, includeInactive = false) {
    return Lot.instance.count(filters, includeInactive);
  }
}

module.exports = Lot;