const db = require('../config/database');

class Product {
  static async findById(id, includeInactive = false) {
    const query = db('products').where({ id });
    if (!includeInactive) {
      query.andWhere({ is_active: true });
    }
    return query.first();
  }

  static async findAll(limit = 100, offset = 0, status = 'active') {
    const query = db('products');

    if (status === 'active') {
      query.where({ is_active: true });
    } else if (status === 'inactive') {
      query.where({ is_active: false });
    }
    // Если status === 'all', фильтр is_active не применяется

    return query
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

  static async restore(id) {
    return db('products')
      .where({ id })
      .update({
        is_active: true,
        updated_at: db.fn.now(),
      });
  }

  static async count(status = 'active') {
    const query = db('products');

    if (status === 'active') {
      query.where({ is_active: true });
    } else if (status === 'inactive') {
      query.where({ is_active: false });
    }
    // Если status === 'all', фильтр is_active не применяется
    
    const result = await query.count('id as count').first();
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