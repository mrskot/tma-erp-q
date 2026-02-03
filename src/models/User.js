const db = require('../config/database');
const BaseModel = require('./BaseModel');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  static instance = new User();

  /**
   * Поиск по Telegram ID
   */
  async findByTelegramId(telegramId) {
    return this.db(this.tableName)
      .where({ telegram_id: telegramId, is_active: true })
      .first();
  }

  /**
   * Поиск по Username
   */
  async findByUsername(username) {
    return this.db(this.tableName)
      .where({ username, is_active: true })
      .first();
  }

  /**
   * Поиск по PIN (только активные)
   */
  async findByPin(pinCode) {
    return this.db(this.tableName)
      .where({ pin_code: pinCode, is_active: true })
      .first();
  }

  /**
   * Обновление статистики входа
   */
  async updateLoginStats(id) {
    return this.db(this.tableName)
      .where({ id })
      .update({
        last_login_at: this.db.fn.now(),
        updated_at: this.db.fn.now()
      });
  }

  // --- Статические обертки (Delegates to instance) ---

  static async findById(id) {
    return User.instance.findById(id);
  }

  static async findAll(params) {
    return User.instance.findAll(params);
  }

  static async create(data) {
    return User.instance.create(data);
  }

  static async update(id, data) {
    return User.instance.update(id, data);
  }

  static async delete(id) {
    return User.instance.delete(id);
  }

  static async reactivate(id) {
    return User.instance.restore(id);
  }

  static async findByTelegramId(id) {
    return User.instance.findByTelegramId(id);
  }

  static async findByUsername(name) {
    return User.instance.findByUsername(name);
  }

  static async findByPin(pin) {
    return User.instance.findByPin(pin);
  }

  static async updateLoginStats(id) {
    return User.instance.updateLoginStats(id);
  }

  /**
   * Метод для совместимости с контроллерами, использующими count()
   */
  static async count(filters = {}, includeInactive = false) {
    return User.instance.count(filters, includeInactive);
  }
}

module.exports = User;