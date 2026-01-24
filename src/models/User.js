const db = require('../config/database');

class User {
  static async findByTelegramId(telegramId) {
    return db('users')
      .where({ telegram_id: telegramId, is_active: true })
      .first();
  }

  static async findById(id) {
    return db('users')
      .where({ id, is_active: true })
      .first();
  }

  static async findAll(limit = 100, offset = 0, status = 'active') {
    const query = db('users');

    if (status === 'active') {
      query.where({ is_active: true });
    } else if (status === 'inactive') {
      query.where({ is_active: false });
    }
    // Если status === 'all', то фильтр не применяется

    return query
      .limit(limit)
      .offset(offset)
      .orderBy('created_at', 'desc');
  }

  static async create(userData) {
    const [user] = await db('users')
      .insert(userData)
      .returning('*');
    return user;
  }

  static async update(id, userData) {
    const [user] = await db('users')
      .where({ id })
      .update({
        ...userData,
        updated_at: db.fn.now()
      })
      .returning('*');
    return user;
  }

  static async delete(id) {
    return db('users')
      .where({ id })
      .update({ is_active: false, updated_at: db.fn.now() });
  }

  static async reactivate(id) {
    return db('users')
      .where({ id })
      .update({ is_active: true, updated_at: db.fn.now() });
  }

  static async findByRole(role, limit = 100) {
    return db('users')
      .where({ role, is_active: true })
      .limit(limit)
      .orderBy('created_at', 'desc');
  }

  static async updateLastLogin(id) {
    return db('users')
      .where({ id })
      .update({
        last_login_at: db.fn.now(),
        updated_at: db.fn.now()
      });
  }

  static async verifyPinCode(telegramId, pinCode) {
    const user = await db('users')
      .where({ telegram_id: telegramId, pin_code: pinCode, is_active: true })
      .first();
    
    if (user) {
      await this.updateLastLogin(user.id);
      return user;
    }
    return null;
  }

  static async count(status = 'active') {
    const query = db('users');

    if (status === 'active') {
      query.where({ is_active: true });
    } else if (status === 'inactive') {
      query.where({ is_active: false });
    }
    // Если status === 'all', фильтр не применяется

    const result = await query
      .count('id as count')
      .first();
    return parseInt(result.count, 10);
  }
}

module.exports = User;