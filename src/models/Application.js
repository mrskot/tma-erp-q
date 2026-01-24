const db = require('../config/database');

class Application {
  static async findById(id) {
    return db('applications')
      .where({ id, is_active: true })
      .first();
  }

  static async findAll(limit = 100, offset = 0) {
    return db('applications')
      .where({ is_active: true })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async findByStatus(status, limit = 100, offset = 0) {
    return db('applications')
      .where({ status, is_active: true })
      .orderBy('desired_inspection_time', 'asc')
      .limit(limit)
      .offset(offset);
  }

  static async findByMasterId(masterId, limit = 100, offset = 0) {
    return db('applications')
      .where({ master_id: masterId, is_active: true })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async findByApplicationNumber(number) {
    return db('applications')
      .where({ application_number: number, is_active: true })
      .first();
  }

  static async create(appData) {
    const [app] = await db('applications')
      .insert(appData)
      .returning('*');
    return app;
  }

  static async update(id, appData) {
    const [app] = await db('applications')
      .where({ id })
      .update({
        ...appData,
        updated_at: db.fn.now()
      })
      .returning('*');
    return app;
  }

  static async delete(id) {
    return db('applications')
      .where({ id })
      .update({
        is_active: false,
        updated_at: db.fn.now()
      });
  }

  static async count() {
    const result = await db('applications')
      .where({ is_active: true })
      .count('id as count')
      .first();
    return parseInt(result.count, 10);
  }

  static async countByStatus(status) {
    const result = await db('applications')
      .where({ status, is_active: true })
      .count('id as count')
      .first();
    return parseInt(result.count, 10);
  }

  static async updateStatus(id, status, rejectionReason = null) {
    const updateData = { status, updated_at: db.fn.now() };
    if (rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const [app] = await db('applications')
      .where({ id })
      .update(updateData)
      .returning('*');
    return app;
  }
}

module.exports = Application;
