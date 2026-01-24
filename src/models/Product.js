const db = require('../config/database');

class Product {
  static async findById(id) {
    return db('products')
      .where({ id, is_active: true })
      .first();
  }

  static async findAll(limit = 100, offset = 0) {
    return db('products')
      .where({ is_active: true })
      .orderBy('name', 'asc')
      .limit(limit)
      .offset(offset);
  }

  static async findByLotId(lotId, limit = 100, offset = 0) {
    return db('products')
      .where({ lot_id: lotId, is_active: true })
      .orderBy('name', 'asc')
      .limit(limit)
      .offset(offset);
  }

  static async create(productData) {
    const [product] = await db('products')
      .insert(productData)
      .returning('*');
    return product;
  }

  static async update(id, productData) {
    const [product] = await db('products')
      .where({ id })
      .update({
        ...productData,
        updated_at: db.fn.now()
      })
      .returning('*');
    return product;
  }

  static async delete(id) {
    return db('products')
      .where({ id })
      .update({
        is_active: false,
        updated_at: db.fn.now()
      });
  }

  static async count() {
    const result = await db('products')
      .where({ is_active: true })
      .count('id as count')
      .first();
    return parseInt(result.count, 10);
  }

  static async findByProductType(productType, limit = 100, offset = 0) {
    return db('products')
      .where({ product_type: productType, is_active: true })
      .orderBy('name', 'asc')
      .limit(limit)
      .offset(offset);
  }
}

module.exports = Product;
