const BaseModel = require('./BaseModel');

class ActivityLog extends BaseModel {
  constructor() {
    super('activity_logs');
  }

  static instance = new ActivityLog();

  /**
   * Специфичный метод: выборка с именами пользователей
   */
  async findAllWithUsers({ filters = {}, limit = 50, offset = 0 } = {}) {
    const query = this.db(`${this.tableName} as al`)
      .select('al.*', 'u.username as user_name')
      .leftJoin('users as u', 'al.user_id', 'u.id')
      .orderBy('al.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (filters.entity_type) query.where('al.entity_type', filters.entity_type);
    if (filters.entity_id) query.where('al.entity_id', filters.entity_id);
    if (filters.user_id) query.where('al.user_id', filters.user_id);
    if (filters.action_type) query.where('al.action_type', filters.action_type);
    return query;
  }

  async findByEntity(entityType, entityId) {
    return this.findAllWithUsers({ filters: { entity_type: entityType, entity_id: entityId } });
  }

  // Статические методы для совместимости
  static async create(data) { return ActivityLog.instance.create(data); }

  static async findAll(filters = {}, limit = 50, offset = 0) {
    return ActivityLog.instance.findAllWithUsers({ filters, limit, offset });
  }

  static async findByEntity(type, id) {
    return ActivityLog.instance.findByEntity(type, id);
  }
}
module.exports = ActivityLog;

