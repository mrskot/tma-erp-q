const db = require('../config/database');
const BaseModel = require('./BaseModel');

class Discrepancy extends BaseModel {
  constructor() {
    super('discrepancies');
  }

  static instance = new Discrepancy();

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
        this.db.raw("u_ins.first_name || ' ' || u_ins.last_name as inspector_name"),
        this.db.raw("u_resp.first_name || ' ' || u_resp.last_name as responsible_name")
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
  static async findById(id) { return Discrepancy.instance.findById(id); }
  static async create(data) { return Discrepancy.instance.create(data); }
  static async update(id, data) { return Discrepancy.instance.update(id, data); }
  static async delete(id) { return Discrepancy.instance.delete(id); }
  
  static async findAll(filters = {}, limit = 100, offset = 0) {
    const query = Discrepancy.instance.db(`${Discrepancy.instance.tableName} as d`)
      .select(
        'd.*', 
        'a.application_number',
        Discrepancy.instance.db.raw("u_ins.first_name || ' ' || u_ins.last_name as inspector_name")
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
    const filters = status === 'inactive' ? { is_active: false } : {};
    return Discrepancy.instance.count(filters, includeInactive);
  }

  static async countByStatus(status) {
    const result = await Discrepancy.instance.db(Discrepancy.instance.tableName)
      .where({ status, is_active: true })
      .count('id as count').first();
    return parseInt(result.count || result['count(*)'], 10);
  }

  static async updateStatus(id, status, closureScenario = null, additionalData = {}) {
    const updateData = {
      status,
      ...additionalData
    };
    if (closureScenario) updateData.closure_scenario = closureScenario;
    if (status === 'closed') updateData.closed_at = Discrepancy.instance.db.fn.now();
    
    return Discrepancy.instance.update(id, updateData);
  }

  static async findByStatus(status, limit, offset) {
      return Discrepancy.instance.findAll({ status }, limit, offset);
  }

  static async findByApplicationId(appId) {
      return Discrepancy.instance.findByApplicationId(appId);
  }

  static async findByResponsibleId(respId, limit, offset) {
      return Discrepancy.instance.findByResponsibleId(respId, limit, offset);
  }
}

module.exports = Discrepancy;

