const db = require('../config/database');
const BaseModel = require('./BaseModel');

class Product extends BaseModel {
  constructor() {
    super('products');
  }

  static instance = new Product();

  /**
   * Расширенная выборка с именем участка
   */
  async findAll({ limit = 100, offset = 0, filters = {} } = {}) {
    const query = this.db(`${this.tableName} as p`)
      .select('p.*', 'l.name as lot_name')
      .leftJoin('lots as l', 'p.lot_id', 'l.id');

    // Модульный стандарт фильтрации статуса
    const status = filters.status || 'active';
    if (status === 'inactive') {
      query.where('p.is_active', false);
    } else if (status === 'all') {
      // Без фильтра
    } else {
      query.where('p.is_active', true);
    }

    // Другие фильтры
    if (filters.name) query.where('p.name', 'like', `%${filters.name}%`);
    if (filters.lot_id) query.where('p.lot_id', filters.lot_id);

    return query.orderBy('p.name', 'asc').limit(limit).offset(offset);
  }

  /**
   * Поиск по ID с именем участка и поддержкой includeInactive
   */
  async findById(id, includeInactive = false) {
    const query = this.db(`${this.tableName} as p`)
      .select('p.*', 'l.name as lot_name')
      .leftJoin('lots as l', 'p.lot_id', 'l.id')
      .where('p.id', id);

    if (!includeInactive) {
      query.where('p.is_active', true);
    }

    return query.first();
  }

  /**
   * Поиск по ID участка
   */
  async findByLotId(lotId, limit = 100, offset = 0) {
    return this.db(`${this.tableName} as p`)
      .select('p.*', 'l.name as lot_name')
      .leftJoin('lots as l', 'p.lot_id', 'l.id')
      .where({ 'p.lot_id': lotId, 'p.is_active': true })
      .orderBy('p.name', 'asc')
      .limit(limit)
      .offset(offset);
  }

  /**
   * Поиск по типу изделия
   */
  async findByType(type, limit = 100, offset = 0) {
    return this.db(`${this.tableName} as p`)
      .select('p.*', 'l.name as lot_name')
      .leftJoin('lots as l', 'p.lot_id', 'l.id')
      .where({ 'p.product_type': type, 'p.is_active': true })
      .orderBy('p.name', 'asc')
      .limit(limit)
      .offset(offset);
  }

  // --- Статические обертки (Delegates to instance) ---

  static async findById(id, includeInactive = false) {
    return Product.instance.findById(id, includeInactive);
  }

  static async findAll(params) {
    return Product.instance.findAll(params);
  }

  static async findByLotId(lotId, limit, offset) {
    return Product.instance.findByLotId(lotId, limit, offset);
  }

  static async findByType(type, limit, offset) {
    return Product.instance.findByType(type, limit, offset);
  }

  static async create(data) {
    return Product.instance.create(data);
  }

  static async update(id, data) {
    return Product.instance.update(id, data);
  }

  static async delete(id) {
    return Product.instance.delete(id);
  }

  static async reactivate(id) {
    return Product.instance.restore(id);
  }

  static async count(filters = {}, includeInactive = false) {
    return Product.instance.count(filters, includeInactive);
  }
}

module.exports = Product;