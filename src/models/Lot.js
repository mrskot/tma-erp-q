const db = require('../config/database');
const BaseModel = require('./BaseModel');

class Lot extends BaseModel {
  constructor() {
    super('lots');
  }

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
      .where(function() {
        this.where('main_master_id', masterId)
          .orWhere('temp_master_id', masterId);
      })
      .orderBy('priority', 'asc');
  }

  /**
   * Специфичный метод: участок с информацией о мастерах
   */
  async findByIdWithMasters(id) {
    const lot = await this.db(this.tableName)
      .where({ 'lots.id': id, 'lots.is_active': true })
      .leftJoin('users as main_master', 'lots.main_master_id', 'main_master.id')
      .leftJoin('users as temp_master', 'lots.temp_master_id', 'temp_master.id')
      .select(
        'lots.*',
        'main_master.first_name as main_master_first_name',
        'main_master.last_name as main_master_last_name',
        'main_master.username as main_master_username',
        'temp_master.first_name as temp_master_first_name',
        'temp_master.last_name as temp_master_last_name',
        'temp_master.username as temp_master_username'
      )
      .first();

    if (!lot) return null;

    return {
      ...lot,
      main_master: lot.main_master_id ? {
        id: lot.main_master_id,
        first_name: lot.main_master_first_name,
        last_name: lot.main_master_last_name,
        username: lot.main_master_username
      } : null,
      temp_master: lot.temp_master_id ? {
        id: lot.temp_master_id,
        first_name: lot.temp_master_first_name,
        last_name: lot.temp_master_last_name,
        username: lot.temp_master_username
      } : null
    };
  }

  /**
   * Специфичный метод: все участки с информацией о мастерах
   */
  async findAllWithMasters(limit = 100, offset = 0, status = 'active') {
    const query = this.db(this.tableName);

    if (status === 'active') {
      query.where({ 'lots.is_active': true });
    } else if (status === 'inactive') {
      query.where({ 'lots.is_active': false });
    }
    
    const lots = await query
      .leftJoin('users as main_master', 'lots.main_master_id', 'main_master.id')
      .leftJoin('users as temp_master', 'lots.temp_master_id', 'temp_master.id')
      .select(
        'lots.*',
        'main_master.first_name as main_master_first_name',
        'main_master.last_name as main_master_last_name',
        'main_master.username as main_master_username',
        'temp_master.first_name as temp_master_first_name',
        'temp_master.last_name as temp_master_last_name',
        'temp_master.username as temp_master_username'
      )
      .orderBy('lots.priority', 'asc')
      .orderBy('lots.name', 'asc')
      .limit(limit)
      .offset(offset);

    return lots.map(lot => ({
      ...lot,
      main_master_name: lot.main_master_id ? `${lot.main_master_first_name} ${lot.main_master_last_name}` : null,
      temp_master_name: lot.temp_master_id ? `${lot.temp_master_first_name} ${lot.temp_master_last_name}` : null,
      main_master: lot.main_master_id ? {
        id: lot.main_master_id,
        first_name: lot.main_master_first_name,
        last_name: lot.main_master_last_name,
        username: lot.main_master_username
      } : null,
      temp_master: lot.temp_master_id ? {
        id: lot.temp_master_id,
        first_name: lot.temp_master_first_name,
        last_name: lot.temp_master_last_name,
        username: lot.temp_master_username
      } : null
    }));
  }

  // Статические обертки для совместимости
  static async findById(id) { return new Lot().findById(id); }
  static async findByCode(code) { return new Lot().findByCode(code); }
  static async findByMaster(masterId) { return new Lot().findByMaster(masterId); }
  static async create(data) { return new Lot().create(data); }
  static async update(id, data) { return new Lot().update(id, data); }
  static async delete(id) { return new Lot().delete(id); }
  static async reactivate(id) { return new Lot().restore(id); }
  static async findByIdWithMasters(id) { return new Lot().findByIdWithMasters(id); }
  static async findAllWithMasters(limit, offset, status) { return new Lot().findAllWithMasters(limit, offset, status); }
  
  static async count(status = 'active') {
    const includeInactive = status === 'all';
    const filters = {};
    if (status === 'inactive') filters.is_active = false;
    return new Lot().count(filters, includeInactive);
  }

  static async assignTempMaster(lotId, tempMasterId) {
    return new Lot().update(lotId, { temp_master_id: tempMasterId });
  }

  static async removeTempMaster(lotId) {
    return new Lot().update(lotId, { temp_master_id: null });
  }

  static async findAll(limit = 100, offset = 0, status = 'active') {
    const instance = new Lot();
    const query = instance.db(instance.tableName);

    if (status === 'active') {
      query.where({ is_active: true });
    } else if (status === 'inactive') {
      query.where({ is_active: false });
    }

    return query
      .orderBy('priority', 'asc')
      .orderBy('name', 'asc')
      .limit(limit)
      .offset(offset);
  }
}

module.exports = Lot;
