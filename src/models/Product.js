const db = require('../config/database');
const BaseModel = require('./BaseModel');

class Product extends BaseModel {
  constructor() {
    super('products');
  }

  static instance = new Product();

  /**
   * Специфичный метод: поиск по Lot ID
   */
  async findByLotId(lotId, limit = 100, offset = 0) {
    return this.findAll({ filters: { lot_id: lotId }, limit, offset });
  }
  /**
   * Специфичный метод: поиск по типу продукта
   */
  async findByProductType(productType, limit = 100, offset = 0) {
    return this.findAll({ filters: { product_type: productType }, limit, offset });
  }
  // Статические методы для совместимости
  static async findById(id, includeInactive = false) { return Product.instance.findById(id, includeInactive); }
  
  static async findAll(limit = 100, offset = 0, status = 'active') {
    const includeInactive = status === 'all';
    const filters = status === 'inactive' ? { is_active: false } : {};
    return Product.instance.findAll({ limit, offset, filters, includeInactive, orderBy: { column: 'name', direction: 'asc' } });
  }

  static async findByLotId(id, limit, offset) { return Product.instance.findByLotId(id, limit, offset); }
  static async create(data) { return Product.instance.create(data); }
  static async update(id, data) { return Product.instance.update(id, data); }
  static async delete(id) { return Product.instance.delete(id); }
  static async restore(id) { return Product.instance.restore(id); }

  static async count(status = 'active') {
    const includeInactive = status === 'all';
    const filters = status === 'inactive' ? { is_active: false } : {};
    return Product.instance.count(filters, includeInactive);
  }

  static async findByProductType(productType, limit, offset) {
    return Product.instance.findByProductType(productType, limit, offset);
  }
}

module.exports = Product;