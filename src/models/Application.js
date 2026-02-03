const db = require('../config/database');
const BaseModel = require('./BaseModel');

class Application extends BaseModel {
  constructor() {
    super('applications');
  }

  static instance = new Application();

  /**
   * Вспомогательный метод для построения базового запроса со всеми связями
   * @private
   */
  _getRichQuery() {
    return this.db(`${this.tableName} as a`)
      .select(
        'a.*',
        'p.name as product_name',
        'p.inspection_mode',
        'p.checklist as product_checklist',
        'l.name as lot_name',
        this.db.raw("m.first_name || ' ' || m.last_name as master_name"),
        this.db.raw("i.first_name || ' ' || i.last_name as inspector_name"),
        // Подзапросы для счетчиков несоответствий
        this.db.raw(`(
          SELECT COUNT(*) FROM discrepancies 
          WHERE application_id = a.id AND is_active = true
        ) as total_discrepancies`),
        this.db.raw(`(
          SELECT COUNT(*) FROM discrepancies 
          WHERE application_id = a.id AND is_active = true AND status IN ('resolved', 'closed')
        ) as closed_discrepancies`)
      )
      .leftJoin('products as p', 'a.product_id', 'p.id')
      .leftJoin('lots as l', 'a.lot_id', 'l.id')
      .leftJoin('users as m', 'a.master_id', 'm.id')
      .leftJoin('users as i', 'a.inspector_id', 'i.id');
  }

  /**
   * Поиск по ID с богатыми данными
   */
  async findById(id, includeInactive = false) {
    const query = this._getRichQuery().where('a.id', id);

    if (!includeInactive) {
      query.andWhere('a.is_active', true);
    }

    return query.first();
  }

  /**
   * Поиск по номеру заявки
   */
  async findByApplicationNumber(number) {
    return this.db(this.tableName)
      .where({ application_number: number, is_active: true })
      .first();
  }

  /**
   * Получение списка заявок с фильтрацией
   */
  async findAll(params = {}) {
    const { filters = {}, limit = 100, offset = 0, user = null } = params;
    
    const query = this._getRichQuery()
      .where('a.is_active', true)
      .orderBy('a.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Фильтрация на основе роли пользователя
    if (user) {
      if (user.role === 'master') {
        // Мастер видит только свои заявки
        query.andWhere('a.master_id', user.id);
      } else if (user.role === 'inspector') {
        // Инспектор видит: 
        // 1. Новые (еще не назначенные)
        // 2. Назначенные на него
        // Но только если не запрошен конкретный статус, ограничивающий выборку
        if (!filters.status || filters.status === 'all' || filters.status.includes('new')) {
          query.andWhere(function() {
            this.where('a.inspector_id', user.id)
                .orWhereNull('a.inspector_id')
                .orWhere('a.status', 'new');
          });
        } else {
          query.andWhere('a.inspector_id', user.id);
        }
      }
    }

    // Дополнительные фильтры
    if (filters.master_id) query.andWhere('a.master_id', filters.master_id);
    if (filters.inspector_id) query.andWhere('a.inspector_id', filters.inspector_id);
    if (filters.lot_id) query.andWhere('a.lot_id', filters.lot_id);
    if (filters.product_id) query.andWhere('a.product_id', filters.product_id);

    // Обработка статусов (может быть списком: 'new,assigned')
    if (filters.status && filters.status !== 'all') {
      const statuses = filters.status.split(',');
      if (statuses.length > 1) {
        query.whereIn('a.status', statuses);
      } else {
        query.where('a.status', filters.status);
      }
    }
    
    return query;
  }

  /**
   * Массовое создание заявок
   */
  async createBatch(appsData) {
    if (!appsData || appsData.length === 0) return [];
    return this.db.transaction(async (trx) => {
      await trx(this.tableName).insert(appsData);
      const numbers = appsData.map(a => a.application_number);
      return trx(this.tableName).whereIn('application_number', numbers).andWhere('is_active', true);
    });
  }

  /**
   * Обновление статуса
   */
  async updateStatus(id, status, rejectionReason = null) {
    const updateData = { status };
    if (rejectionReason) updateData.rejection_reason = rejectionReason;
    return this.update(id, updateData);
  }

  // --- Статические методы-прокси ---
  static async findById(id) { return Application.instance.findById(id); }
  static async findByApplicationNumber(num) { return Application.instance.findByApplicationNumber(num); }
  static async create(data) { return Application.instance.create(data); }
  static async createBatch(data) { return Application.instance.createBatch(data); }
  static async update(id, data) { return Application.instance.update(id, data); }
  static async delete(id) { return Application.instance.delete(id); }
  static async findAll(params) { return Application.instance.findAll(params); }
  
  static async updateStatus(id, status, reason) { 
    return Application.instance.updateStatus(id, status, reason); 
  }

  static async count(filters, includeInactive) {
    return Application.instance.count(filters, includeInactive);
  }

  static async countByStatus(status) {
    const result = await db('applications')
      .where({ status, is_active: true })
      .count('id as count').first();
    return parseInt(result.count || result['count(*)'] || 0, 10);
  }
}

module.exports = Application;