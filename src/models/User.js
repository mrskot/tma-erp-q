const db = require('../config/database');
const BaseModel = require('./BaseModel');

class User extends BaseModel {
  constructor() {
    super('users');
  }

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
    return this.findAll({
       limit,
       filters: { role }
     });
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

  // Переопределение findAll для совместимости с текущим API контроллера,
  // который ожидает сигнатуру (limit, offset, status)
  static async findAll(limit = 100, offset = 0, status = 'active') {
    const instance = new User();
    const includeInactive = status === 'all' || status === 'inactive';

    if (status === 'inactive') {
        return instance.db(instance.tableName)
            .where('is_active', false)
            .limit(limit)
            .offset(offset)
            .orderBy('created_at', 'desc');
    }

    return instance.findAll({
         limit,
         offset,
         includeInactive: status === 'all'
     });
  }

  // Статические обертки для совместимости с сервисами,
  // которые вызывают User.findById вместо new User().findById
  static async findById(id) { return new User().findById(id); }
  static async findByTelegramId(id) { return new User().findByTelegramId(id); }
  static async create(data) { return new User().create(data); }
  static async update(id, data) { return new User().update(id, data); }
  static async delete(id) { return new User().delete(id); }
  static async reactivate(id) { return new User().restore(id); }
  static async findByRole(role) { return new User().findByRole(role); }
  static async verifyPinCode(tgId, pin) { return new User().verifyPinCode(tgId, pin); }
  static async count(status) {
       const includeInactive = status === 'all';
       return new User().count({}, includeInactive);
   }
}
module.exports = User;