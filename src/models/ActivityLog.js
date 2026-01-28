const knex = require('../config/database');

class ActivityLog {
  static async create(data) {
    const [id] = await knex('activity_logs').insert(data).returning('id');
    return id;
  }

  static async findAll(filters = {}, limit = 50, offset = 0) {
    const query = knex('activity_logs')
      .select('activity_logs.*', 'users.username as user_name')
      .leftJoin('users', 'activity_logs.user_id', 'users.id')
      .orderBy('activity_logs.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (filters.entity_type) {
      query.where('entity_type', filters.entity_type);
    }
    if (filters.entity_id) {
      query.where('entity_id', filters.entity_id);
    }
    if (filters.user_id) {
      query.where('user_id', filters.user_id);
    }
    if (filters.action_type) {
      query.where('action_type', filters.action_type);
    }

    return query;
  }

  static async findByEntity(entityType, entityId) {
    return knex('activity_logs')
      .select('activity_logs.*', 'users.username as user_name')
      .leftJoin('users', 'activity_logs.user_id', 'users.id')
      .where({ entity_type: entityType, entity_id: entityId })
      .orderBy('created_at', 'desc');
  }
}

module.exports = ActivityLog;
