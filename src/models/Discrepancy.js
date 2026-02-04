const db = require('../config/database');

class Discrepancy {
  /**
   * Вспомогательный метод для базового запроса со всеми связями
   * @private
   */
  static _getRichQuery() {
    return db('discrepancies as d')
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
      .where('d.is_active', true);
  }

  static async findById(id) {
    return this._getRichQuery().where('d.id', id).first();
  }

  static async findAll(filters = {}, limit = 100, offset = 0) {
    const query = this._getRichQuery();

    if (filters.application_id) query.where('d.application_id', filters.application_id);
    if (filters.responsible_id) query.where('d.responsible_id', filters.responsible_id);
    
    if (filters.status && filters.status !== 'all') {
      const statuses = filters.status.split(',');
      query.whereIn('d.status', statuses);
    }

    if (filters.severity && filters.severity !== 'all') {
      query.where('d.severity', filters.severity);
    }

    return query.orderBy('d.detected_at', 'desc').limit(limit).offset(offset);
  }

  static async create(data) {
    const [id] = await db('discrepancies').insert({
      ...data,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });
    return this.findById(id);
  }

  static async update(id, data) {
    await db('discrepancies')
      .where('id', id)
      .update({
        ...data,
        updated_at: db.fn.now()
      });
    return this.findById(id);
  }

  static async updateStatus(id, status, closureScenario = null, additionalData = {}) {
    const updateData = {
      status,
      ...additionalData,
      updated_at: db.fn.now()
    };
    if (closureScenario) updateData.closure_scenario = closureScenario;
    if (status === 'closed') updateData.closed_at = db.fn.now();

    await db('discrepancies').where('id', id).update(updateData);
    return this.findById(id);
  }

  static async delete(id) {
    return db('discrepancies').where('id', id).update({ is_active: false });
  }

  static async count(filters = {}) {
    const query = db('discrepancies').where('is_active', true);
    if (filters.status && filters.status !== 'all') query.where('status', filters.status);
    const result = await query.count('id as count').first();
    return parseInt(result.count || 0, 10);
  }

  static async countByStatus(status) {
    const result = await db('discrepancies')
      .where({ status, is_active: true })
      .count('id as count').first();
    return parseInt(result.count || 0, 10);
  }

  static async findByApplicationId(appId) {
    return this._getRichQuery().where('d.application_id', appId).orderBy('d.detected_at', 'desc');
  }

  static async findByResponsibleId(respId, limit, offset) {
    return this.findAll({ responsible_id: respId }, limit, offset);
  }
}

module.exports = Discrepancy;