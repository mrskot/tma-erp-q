const db = require('../config/database');
const BaseModel = require('./BaseModel');

class Discrepancy extends BaseModel {
  constructor() {
    super('discrepancies');
  }

  /**
   * Переопределяем findById для подтягивания данных
   */
  async findById(id, includeInactive = false) {
    const query = this.db(`${this.tableName} as d`)
      .select(
        'd.*', 
        'p.inspection_mode', 
        'a.application_number',
        'a.btx_appl_id',
        db.raw("u_ins.first_name || ' ' || u_ins.last_name as inspector_name"),
        db.raw("u_resp.first_name || ' ' || u_resp.last_name as responsible_name")
      )
      .leftJoin('applications as a', 'd.application_id', 'a.id')
      .leftJoin('products as p', 'a.product_id', 'p.id')
      .leftJoin('users as u_ins', 'd.inspector_id', 'u_ins.id')
      .leftJoin('users as u_resp', 'd.responsible_id', 'u_resp.id')
      .where('d.id', id);

    if (!includeInactive) {
      query.andWhere('d.is_active', true);
    }

    return query.first();
  }

  /**
   * Специфичный метод: по ответственному
   */
  async findByResponsibleId(responsibleId, limit = 100, offset = 0) {
    return this.findAll({
      limit,
      offset,
      filters: { responsible_id: responsibleId }
    });
  }

  /**
   * Специфичный метод: по заявке
   */
  async findByApplicationId(applicationId) {
    return this.db(this.tableName)
      .where({ application_id: applicationId, is_active: true })
      .orderBy('detected_at', 'desc');
  }

  // Статические обертки для совместимости
  static async findById(id) { return new Discrepancy().findById(id); }
  static async create(data) { return new Discrepancy().create(data); }
  static async update(id, data) { return new Discrepancy().update(id, data); }
  static async delete(id) { return new Discrepancy().delete(id); }
  
  static async findAll(filters = {}, limit = 100, offset = 0) {
    const instance = new Discrepancy();
    const query = instance.db(`${instance.tableName} as d`)
      .select(
        'd.*', 
        'a.application_number',
        db.raw("u_ins.first_name || ' ' || u_ins.last_name as inspector_name")
      )
      .leftJoin('applications as a', 'd.application_id', 'a.id')
      .leftJoin('users as u_ins', 'd.inspector_id', 'u_ins.id')
      .where('d.is_active', true);

    if (filters.application_id) query.where('d.application_id', filters.application_id);
    if (filters.responsible_id) query.where('d.responsible_id', filters.responsible_id);

    if (filters.status && filters.status !== 'all') {
      const statuses = filters.status.split(',');
      statuses.length > 1 ? query.whereIn('d.status', statuses) : query.where('d.status', filters.status);
    }

    if (filters.severity && filters.severity !== 'all') {
      query.where('d.severity', filters.severity);
    }

    return query
      .orderBy('d.detected_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async count(status = 'active') {
    const includeInactive = status === 'all';
    const filters = {};
    if (status === 'inactive') filters.is_active = false;
    return new Discrepancy().count(filters, includeInactive);
  }

  static async updateStatus(id, status, closureScenario = null, additionalData = {}) {
    const updateData = {
      status,
      ...additionalData
    };
    if (closureScenario) updateData.closure_scenario = closureScenario;
    if (status === 'closed') updateData.closed_at = db.fn.now();
    
    return new Discrepancy().update(id, updateData);
  }

  static async findByStatus(status, limit, offset) {
      return new Discrepancy().findAll({ filters: { status }, limit, offset });
  }

  static async findByApplicationId(appId) {
      return new Discrepancy().findByApplicationId(appId);
  }

  static async findByResponsibleId(respId, limit, offset) {
      return new Discrepancy().findByResponsibleId(respId, limit, offset);
  }
}

module.exports = Discrepancy;

