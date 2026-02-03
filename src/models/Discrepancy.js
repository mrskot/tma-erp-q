const db = require('../config/database');
const BaseModel = require('./BaseModel');

class Discrepancy extends BaseModel {
  constructor() {
    super('discrepancies');
  }

  static instance = new Discrepancy();

  /**
   * Базовый запрос с JOIN-ами для получения полной информации
   * @private
   */
  _getRichQuery() {
    return this.db(`${this.tableName} as d`)
      .select(
        'd.*',
        'a.application_number',
        'a.btx_appl_id',
        'p.name as product_name',
        'p.inspection_mode',
        this.db.raw("u_resp.first_name || ' ' || u_resp.last_name as responsible_name"),
        this.db.raw("u_ins.first_name || ' ' || u_ins.last_name as inspector_name")
      )
      .leftJoin('applications as a', 'd.application_id', 'a.id')
      .leftJoin('products as p', 'a.product_id', 'p.id')
      .leftJoin('users as u_resp', 'd.responsible_id', 'u_resp.id')
      .leftJoin('users as u_ins', 'd.inspector_id', 'u_ins.id');
  }

  /**
   * Поиск по ID с богатыми данными
   */
  async findById(id, includeInactive = false) {
    const query = this._getRichQuery().where('d.id', id);

    if (!includeInactive) {
      query.andWhere('d.is_active', true);
    }

    return query.first();
  }

  /**
   * Получение списка несоответствий с фильтрацией
   */
  async findAll(params = {}) {
    const { filters = {}, limit = 100, offset = 0 } = params;
    
    const query = this._getRichQuery()
      .where('d.is_active', true)
      .orderBy('d.detected_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Применение фильтров
    if (filters.application_id) query.andWhere('d.application_id', filters.application_id);
    if (filters.responsible_id) query.andWhere('d.responsible_id', filters.responsible_id);
    if (filters.inspector_id) query.andWhere('d.inspector_id', filters.inspector_id);

    // Фильтр по статусу (поддержка списка через запятую)
    if (filters.status && filters.status !== 'all') {
      const statuses = filters.status.split(',');
      if (statuses.length > 1) {
        query.whereIn('d.status', statuses);
      } else {
        query.where('d.status', filters.status);
      }
    }

    // Фильтр по критичности
    if (filters.severity && filters.severity !== 'all') {
      query.andWhere('d.severity', filters.severity);
    }

    return query;
  }

  /**
   * Обновление статуса со специфичной логикой закрытия
   */
  async updateStatus(id, status, closureScenario = null, additionalData = {}) {
    const updateData = {
      status,
      ...additionalData,
      updated_at: this.db.fn.now()
    };

    if (closureScenario) {
      updateData.closure_scenario = closureScenario;
    }

    if (status === 'closed') {
      updateData.closed_at = this.db.fn.now();
    }

    return this.update(id, updateData);
  }

  /**
   * Поиск по ID заявки
   */
  async findByApplicationId(applicationId) {
    return this._getRichQuery()
      .where({ 'd.application_id': applicationId, 'd.is_active': true })
      .orderBy('d.detected_at', 'desc');
  }

  // --- Статические методы-прокси для совместимости ---
  static async findById(id) { return Discrepancy.instance.findById(id); }
  static async create(data) { return Discrepancy.instance.create(data); }
  static async update(id, data) { return Discrepancy.instance.update(id, data); }
  static async delete(id) { return Discrepancy.instance.delete(id); }
  
  static async findAll(filters, limit, offset) { 
    return Discrepancy.instance.findAll({ filters, limit, offset }); 
  }

  static async count(filters, includeInactive) {
    return Discrepancy.instance.count(filters, includeInactive);
  }

  static async countByStatus(status) {
    const result = await db('discrepancies')
      .where({ status, is_active: true })
      .count('id as count').first();
    return parseInt(result.count || result['count(*)'] || 0, 10);
  }

  static async updateStatus(id, status, closureScenario, additionalData) {
    return Discrepancy.instance.updateStatus(id, status, closureScenario, additionalData);
  }

  static async findByApplicationId(appId) {
    return Discrepancy.instance.findByApplicationId(appId);
  }

  static async findByResponsibleId(respId, limit, offset) {
    return Discrepancy.instance.findAll({ 
      filters: { responsible_id: respId }, 
      limit, 
      offset 
    });
  }
}

module.exports = Discrepancy;