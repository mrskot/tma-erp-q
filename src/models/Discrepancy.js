const db = require('../config/database');

class Discrepancy {
  static async findById(id) {
    return db('discrepancies')
      .where({ id, is_active: true })
      .first();
  }

  static async findAll(filters = {}, limit = 100, offset = 0) {
    const query = db('discrepancies')
      .where({ is_active: true });

    if (filters.application_id) {
      query.where('application_id', filters.application_id);
    }

    if (filters.status && filters.status !== 'all') {
      const statuses = filters.status.split(',');
      if (statuses.length > 1) {
        query.whereIn('status', statuses);
      } else {
        query.where('status', filters.status);
      }
    }

    if (filters.severity && filters.severity !== 'all') {
      query.where('severity', filters.severity);
    }

    if (filters.responsible_id) {
      query.where('responsible_id', filters.responsible_id);
    }

    return query
      .orderBy('detected_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async findByStatus(status, limit = 100, offset = 0) {
    return db('discrepancies')
      .where({ status, is_active: true })
      .orderBy('due_date', 'asc')
      .limit(limit)
      .offset(offset);
  }

  static async findByResponsibleId(responsibleId, limit = 100, offset = 0) {
    return db('discrepancies')
      .where({ responsible_id: responsibleId, is_active: true })
      .orderBy('due_date', 'asc')
      .limit(limit)
      .offset(offset);
  }

  static async findByApplicationId(applicationId) {
    return db('discrepancies')
      .where({ application_id: applicationId, is_active: true })
      .orderBy('detected_at', 'desc');
  }

  static async create(discrepancyData) {
    const [id] = await db('discrepancies')
      .insert(discrepancyData);
    return this.findById(id);
  }

  static async update(id, discrepancyData) {
    await db('discrepancies')
      .where({ id })
      .update({
        ...discrepancyData,
        updated_at: db.fn.now()
      });
    return this.findById(id);
  }

  static async delete(id) {
    return db('discrepancies')
      .where({ id })
      .update({
        is_active: false,
        updated_at: db.fn.now()
      });
  }

  static async count() {
    const result = await db('discrepancies')
      .where({ is_active: true })
      .count('id as count')
      .first();
    return parseInt(result.count, 10);
  }

  static async countByStatus(status) {
    const result = await db('discrepancies')
      .where({ status, is_active: true })
      .count('id as count')
      .first();
    return parseInt(result.count, 10);
  }

  static async updateStatus(id, status, closureScenario = null, additionalData = {}) {
    const updateData = {
      status,
      updated_at: db.fn.now(),
      ...additionalData
    };

    if (closureScenario) {
      updateData.closure_scenario = closureScenario;
    }
    if (status === 'closed') {
      updateData.closed_at = db.fn.now();
    }
    
    await db('discrepancies')
      .where({ id })
      .update(updateData);
      
    return this.findById(id);
  }

  static async getBySeverity(severity, limit = 100, offset = 0) {
    return db('discrepancies')
      .where({ severity, is_active: true })
      .orderBy('detected_at', 'desc')
      .limit(limit)
      .offset(offset);
  }
}

module.exports = Discrepancy;

