const db = require('../config/database');
const BaseModel = require('./BaseModel');

class Product extends BaseModel {
  constructor() {
    super('products');
  }

  /**
   * Специфичный метод: поиск по Lot ID
   */
  async findByLotId(lotId, limit = 100, offset = 0) {
    return this.findAll({
      limit,
      offset,
      filters: { lot_id: lotId }
    });
  }

  /**
   * Специфичный метод: поиск по типу продукта
   */
  async findByProductType(productType, limit = 100, offset = 0) {
    return this.findAll({
      limit,
      offset,
      filters: { product_type: productType }
    });
  }

  // Статические обертки для совместимости
  static async findById(id, includeInactive = false) { return new Product().findById(id, includeInactive); }
  
  static async findAll(limit = 100, offset = 0, status = 'active') {
    const instance = new Product();
    const query = instance.db(instance.tableName);

    if (status === 'active') {
      query.where({ is_active: true });
    } else if (status === 'inactive') {
      query.where({ is_active: false });
    }

    return query
      .orderBy('name', 'asc')
      .limit(limit)
      .offset(offset);
  }

  static async findByLotId(lotId, limit, offset) { return new Product().findByLotId(lotId, limit, offset); }
  static async create(data) { return new Product().create(data); }
  static async update(id, data) { return new Product().update(id, data); }
  static async delete(id) { return new Product().delete(id); }
  static async restore(id) { return new Product().restore(id); }
  
  static async count(status = 'active') {
    const includeInactive = status === 'all';
    const filters = {};
    if (status === 'inactive') filters.is_active = false;
    return new Product().count(filters, includeInactive);
  }

  static async findByProductType(productType, limit, offset) { 
    return new Product().findByProductType(productType, limit, offset); 
  }
}

module.exports = Product;