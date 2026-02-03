const db = require('../config/database');
const BaseModel = require('./BaseModel');

class Application extends BaseModel {
  constructor() {
    super('applications');
  }

  static instance = new Application();

  /**
   * Переопределяем findById, чтобы подтянуть все связанные данные
   */
  async findById(id, includeInactive = false) {
    const query = this.db(`${this.tableName} as a`)
      .select(
        'a.*',
        'p.name as product_name',
        'p.checklist as product_checklist',
        'l.name as lot_name',
        this.db.raw("m.first_name || ' ' || m.last_name as master_name"),
        this.db.raw("i.first_name || ' ' || i.last_name as inspector_name"),
        this.db.raw('(SELECT COUNT(*) FROM discrepancies WHERE application_id = a.id) as total_discrepancies'),
        this.db.raw("(SELECT COUNT(*) FROM discrepancies WHERE application_id = a.id AND status IN ('resolved', 'closed')) as closed_discrepancies")
      )
      .leftJoin('products as p', 'a.product_id', 'p.id')
      .leftJoin('lots as l', 'a.lot_id', 'l.id')
      .leftJoin('users as m', 'a.master_id', 'm.id')
      .leftJoin('users as i', 'a.inspector_id', 'i.id')
      .where('a.id', id);

    if (!includeInactive) {
      query.andWhere('a.is_active', true);
    }

    return query.first();
  }

  /**
   * Специфичный метод: поиск по номеру
   */
  async findByApplicationNumber(number) {
    return this.db(this.tableName)
      .where({ application_number: number, is_active: true })
      .first();
  }

  /**
   * Массовое создание (SQLite safe)
   */
  async createBatch(appsData) {
    if (!appsData || appsData.length === 0) return [];
    return this.db.transaction(async (trx) => {
      await trx(this.tableName).insert(appsData);
      const numbers = appsData.map(a => a.application_number);
      return trx(this.tableName).whereIn('application_number', numbers);
    });
  }

  // Статические обертки для совместимости
  static async findById(id) { return Application.instance.findById(id); }
  static async findByApplicationNumber(num) { return Application.instance.findByApplicationNumber(num); }
  static async create(data) { return Application.instance.create(data); }
  static async createBatch(data) { return Application.instance.createBatch(data); }
  static async update(id, data) { return Application.instance.update(id, data); }
  static async delete(id) { return Application.instance.delete(id); }
  
  static async updateStatus(id, status, rejectionReason = null) {
    const updateData = { status };
    if (rejectionReason) updateData.rejection_reason = rejectionReason;
    return Application.instance.update(id, updateData);
  }

  static async count(status = 'active') {
    const includeInactive = status === 'all';
    const filters = status === 'inactive' ? { is_active: false } : {};
    return Application.instance.count(filters, includeInactive);
  }

  static async countByStatus(status) {
    const result = await db('applications')
      .where({ status, is_active: true })
      .count('id as count').first();
    return parseInt(result.count || result['count(*)'], 10);
  }

  static async findAll(params = {}) {
    const { filters = {}, limit = 100, offset = 0, user = null } = params;
    const query = db(`${Application.instance.tableName} as a`)
      .select(
        'a.*',
        'p.name as product_name',
        'l.name as lot_name',
        db.raw("m.first_name || ' ' || m.last_name as master_name"),
        db.raw("i.first_name || ' ' || i.last_name as inspector_name"),
        db.raw('(SELECT COUNT(*) FROM discrepancies WHERE application_id = a.id) as total_discrepancies'),
        db.raw("(SELECT COUNT(*) FROM discrepancies WHERE application_id = a.id AND status IN ('resolved', 'closed')) as closed_discrepancies")
      )
      .leftJoin('products as p', 'a.product_id', 'p.id')
      .leftJoin('lots as l', 'a.lot_id', 'l.id')
      .leftJoin('users as m', 'a.master_id', 'm.id')
      .leftJoin('users as i', 'a.inspector_id', 'i.id')
      .where('a.is_active', true)
      .orderBy('a.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (user) {
      if (user.role === 'master') {
        query.andWhere('a.master_id', user.id);
      } else if (user.role === 'inspector') {
        if (filters.status !== 'new') {
          query.andWhere(function() {
            this.where('a.inspector_id', user.id).orWhereNull('a.inspector_id');
          });
        }
      }
    }

    if (filters.master_id) query.andWhere('a.master_id', filters.master_id);
    if (filters.inspector_id) query.andWhere('a.inspector_id', filters.inspector_id);
    if (filters.lot_id) query.andWhere('a.lot_id', filters.lot_id);

    if (filters.status && filters.status !== 'all') {
      const statuses = filters.status.split(',');
      statuses.length > 1 ? query.whereIn('a.status', statuses) : query.where('a.status', filters.status);
    }
    
    return query;
  }
}

module.exports = Application;


