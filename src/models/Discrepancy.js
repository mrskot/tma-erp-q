const db = require('../config/database');

class Discrepancy {
  static async findById(id) {
    return db('discrepancies as d')
      .select('d.*', 'p.inspection_mode', 'a.application_number')
      .leftJoin('applications as a', 'd.application_id', 'a.id')
      .leftJoin('products as p', 'a.product_id', 'p.id')
      .where({ 'd.id': id, 'd.is_active': true })
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
    // Фильтруем поля, чтобы не пытаться сохранить виртуальные колонки (из JOIN)
    const allowedColumns = [
      'application_id', 'title', 'description', 'severity', 
      'defect_photo_url', 'defect_photo_key', 'responsible_id', 
      'assigned_worker_id', 'inspector_id', 'detected_at', 'assigned_at', 
      'started_at', 'due_date', 'closed_at', 'status', 'closure_scenario', 
      'resolution_card_details', 'scrap_reason', 'political_decision_details', 
      'metadata', 'is_active', 'fix_photo_url', 'fix_photo_key', 
      'special_opinion', 'is_disputed'
    ];

    const filteredData = {};
    allowedColumns.forEach(col => {
      if (discrepancyData[col] !== undefined) {
        filteredData[col] = discrepancyData[col];
      }
    });

    await db('discrepancies')
      .where({ id })
      .update({
        ...filteredData,
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
    const allowedColumns = [
      'status', 'closure_scenario', 'closed_at', 'fix_photo_url', 
      'fix_photo_key', 'special_opinion', 'is_disputed', 'description'
    ];

    const filteredData = {};
    allowedColumns.forEach(col => {
      if (additionalData[col] !== undefined) {
        filteredData[col] = additionalData[col];
      }
    });

    const updateData = {
      status,
      updated_at: db.fn.now(),
      ...filteredData
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

