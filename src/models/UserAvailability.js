// File: src/models/UserAvailability.js
const BaseModel = require('./BaseModel');

class UserAvailability extends BaseModel {
  constructor() {
    super('user_availability');
  }

  static instance = new UserAvailability();

  async findByUserId(userId) {
    return this.db(this.tableName)
      .where({ user_id: userId })
      .first();
  }

  // --- Статические обертки ---
  static async create(data) {
    return UserAvailability.instance.create(data);
  }

  static async findByUserId(userId) {
    return UserAvailability.instance.findByUserId(userId);
  }

  static async update(id, data) {
    return UserAvailability.instance.update(id, data);
  }
}

module.exports = UserAvailability;