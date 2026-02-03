const db = require('../config/database');
const BaseModel = require('./BaseModel');

class Lot extends BaseModel {
  constructor() {
    super('lots');
  }

  static instance = new Lot();

  /**
   * Специфичный метод: поиск по коду
   */
  async findByCode(code) {
    return this.db(this.tableName)
      .where({ code, is_active: true })
      .first();
  }

  /**
   * Специфичный метод: поиск по мастеру
   */
  async findByMaster(masterId) {
    return this.db(this.tableName)
      .where({ is_active: true })
      .andWhere(function() {
        this.where('main_master_id', masterId)
          .orWhere('temp_master_id', masterId);
      })
      .orderBy('priority', 'asc');
  }

  /**
   * Специфичный метод: участок с информацией о мастерах
   */
  async findByIdWithMasters(id) {
    const lot = await this.db(`${this.tableName} as l`)
      .select(
        'l.*',
        'm.first_name as main_master_first_name', 'm.last_name as main_master_last_name',
        't.first_name as temp_master_first_name', 't.last_name as temp_master_last_name'
      )
      .leftJoin('users as m', 'l.main_master_id', 'm.id')
      .leftJoin('users as t', 'l.temp_master_id', 't.id')
      .where({ 'l.id': id, 'l.is_active': true })
      .first();

    if (!lot) return null;
    return this._formatLotWithMasters(lot);
  }

  /**
   * Специфичный метод: все участки с информацией о мастерах
   */
  async findAllWithMasters(limit = 100, offset = 0, status = 'active') {
    const query = this.db(`${this.tableName} as l`)
      .select(
        'l.*',
        'm.first_name as main_master_first_name', 'm.last_name as main_master_last_name',
        't.first_name as temp_master_first_name', 't.last_name as temp_master_last_name'
      )
      .leftJoin('users as m', 'l.main_master_id', 'm.id')
      .leftJoin('users as t', 'l.temp_master_id', 't.id');

    if (status === 'active') query.where('l.is_active', true);
    else if (status === 'inactive') query.where('l.is_active', false);

    const rows = await query.orderBy('l.priority', 'asc').limit(limit).offset(offset);
    return rows.map(r => this._formatLotWithMasters(r));
  }

  _formatLotWithMasters(row) {
    if (!row) return null;
    return {
      ...row,
      main_master_name: row.main_master_id ? `${row.main_master_first_name} ${row.main_master_last_name}` : null,
      temp_master_name: row.temp_master_id ? `${row.temp_master_first_name} ${row.temp_master_last_name}` : null
    };
  }
  // Статические методы для совместимости
  static async findById(id) { return Lot.instance.findById(id); }
  static async findByCode(code) { return Lot.instance.findByCode(code); }
  static async findByMaster(masterId) { return Lot.instance.findByMaster(masterId); }
  static async create(data) { return Lot.instance.create(data); }
  static async update(id, data) { return Lot.instance.update(id, data); }
  static async delete(id) { return Lot.instance.delete(id); }
  static async restore(id) { return Lot.instance.restore(id); }
  static async reactivate(id) { return Lot.instance.restore(id); }
  static async findByIdWithMasters(id) { return Lot.instance.findByIdWithMasters(id); }
  static async findAllWithMasters(limit, offset, status) { return Lot.instance.findAllWithMasters(limit, offset, status); }
  
  static async count(status = 'active') {
    const includeInactive = status === 'all';
    const filters = status === 'inactive' ? { is_active: false } : {};
    return Lot.instance.count(filters, includeInactive);
  }

  static async assignTempMaster(lotId, tempMasterId) {
    return Lot.instance.update(lotId, { temp_master_id: tempMasterId });
  }

  static async removeTempMaster(lotId) {
    return Lot.instance.update(lotId, { temp_master_id: null });
  }

  static async findAll(limit = 100, offset = 0, status = 'active') {
    const includeInactive = status === 'all';
    const filters = status === 'inactive' ? { is_active: false } : {};
    return Lot.instance.findAll({ limit, offset, filters, includeInactive, orderBy: { column: 'priority', direction: 'asc' } });
  }
}

module.exports = Lot;

