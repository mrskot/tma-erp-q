const db = require('../config/database');
const BaseModel = require('./BaseModel');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  static instance = new User();

  /**
   * Специфичный метод: поиск по Telegram ID
   */
  async findByTelegramId(telegramId) {
    return this.db(this.tableName)
      .where({ telegram_id: telegramId, is_active: true })
      .first();
  }

  /**
   * Специфичный метод: поиск по роли
   */
  async findByRole(role, limit = 100) {
    return this.findAll({ filters: { role }, limit });
  }

  /**
   * Специфичный метод: обновление времени входа
   */
  async updateLastLogin(id) {
    return this.db(this.tableName)
      .where({ id })
      .update({
        last_login_at: this.db.fn.now(),
        updated_at: this.db.fn.now()
      });
  }

  /**
   * Специфичный метод: проверка PIN
   */
  async verifyPinCode(telegramId, pinCode) {
    const user = await this.db(this.tableName)
      .where({ telegram_id: telegramId, pin_code: pinCode, is_active: true })
      .first();
    
    if (user) {
      await this.updateLastLogin(user.id);
      return user;
    }
    return null;
  }

  // Статические методы для совместимости с существующим кодом
  static async findById(id) { return User.instance.findById(id); }
  static async findByTelegramId(id) { return User.instance.findByTelegramId(id); }
  static async create(data) { return User.instance.create(data); }
  static async update(id, data) { return User.instance.update(id, data); }
  static async delete(id) { return User.instance.delete(id); }
  static async restore(id) { return User.instance.restore(id); }
  static async findByRole(role) { return User.instance.findByRole(role); }
  static async verifyPinCode(tgId, pin) { return User.instance.verifyPinCode(tgId, pin); }

  static async findAll(limit = 100, offset = 0, status = 'active') {
    const includeInactive = status === 'all';
    const filters = status === 'inactive' ? { is_active: false } : {};
    return User.instance.findAll({ limit, offset, filters, includeInactive });
  }

  static async count(status = 'active') {
       const includeInactive = status === 'all';
    const filters = status === 'inactive' ? { is_active: false } : {};
    return User.instance.count(filters, includeInactive);
   }
}

module.exports = User;