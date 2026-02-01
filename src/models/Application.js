const db = require('../config/database');

class Application {
  static async findById(id) {
    return db('applications as a')
      .select(
        'a.*',
        'p.name as product_name',
        'p.checklist as product_checklist', // Подтягиваем чек-лист из изделия
        'l.name as lot_name',
        db.raw("master.first_name || ' ' || master.last_name as master_name"),
        db.raw("inspector.first_name || ' ' || inspector.last_name as inspector_name"),
        // Агрегация счетчиков несоответствий
        db.raw('(SELECT COUNT(*) FROM discrepancies WHERE application_id = a.id) as total_discrepancies'),
        db.raw("(SELECT COUNT(*) FROM discrepancies WHERE application_id = a.id AND status IN ('resolved', 'closed')) as closed_discrepancies")
      )
      .leftJoin('products as p', 'a.product_id', 'p.id')
      .leftJoin('lots as l', 'a.lot_id', 'l.id')
      .leftJoin('users as master', 'a.master_id', 'master.id')
      .leftJoin('users as inspector', 'a.inspector_id', 'inspector.id')
      .where('a.id', id)
      .first();
  }

  static async findAll({ filters = {}, limit = 100, offset = 0, user = null } = {}) {
    const query = db('applications as a')
      .select(
        'a.*',
        'p.name as product_name',
        'l.name as lot_name',
        db.raw("master.first_name || ' ' || master.last_name as master_name"),
        db.raw("inspector.first_name || ' ' || inspector.last_name as inspector_name"),
        // Агрегация счетчиков несоответствий
        db.raw('(SELECT COUNT(*) FROM discrepancies WHERE application_id = a.id) as total_discrepancies'),
        db.raw("(SELECT COUNT(*) FROM discrepancies WHERE application_id = a.id AND status IN ('resolved', 'closed')) as closed_discrepancies")
      )
      .leftJoin('products as p', 'a.product_id', 'p.id')
      .leftJoin('lots as l', 'a.lot_id', 'l.id')
      .leftJoin('users as master', 'a.master_id', 'master.id')
      .leftJoin('users as inspector', 'a.inspector_id', 'inspector.id')
      .where('a.is_active', true)
      .orderBy('a.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Apply role-based filtering
    if (user) {
      if (user.role === 'master') {
        query.andWhere('a.master_id', user.id);
      } else if (user.role === 'inspector') {
        // Контролер видит или назначенные ему, или вообще новые (никому не назначенные)
        if (filters.status !== 'new') {
            query.andWhere(function() {
                this.where('a.inspector_id', user.id)
                  .orWhereNull('a.inspector_id');
            });
        }
      }
    }

    if (filters.master_id) {
        query.andWhere('a.master_id', filters.master_id);
    }
    
    // Если передан фильтр по инспектору (даже для админа), применяем его
    if (filters.inspector_id) {
        query.andWhere('a.inspector_id', filters.inspector_id);
    }

    if (filters.lot_id) {
        query.andWhere('a.lot_id', filters.lot_id);
    }

    // Apply status filter if provided
    if (filters.status && filters.status !== 'all') {
      const statuses = filters.status.split(',');
      if (statuses.length > 1) {
        query.andWhere(function() {
          this.whereIn('a.status', statuses);
        });
      } else {
        query.andWhere('a.status', filters.status);
      }
    }
    
    return query;
  }

  static async findByApplicationNumber(number) {
    return db('applications')
      .where({ application_number: number, is_active: true })
      .first();
  }

  static async create(appData) {
    const [id] = await db('applications')
      .insert(appData);
    return this.findById(id);
  }

  static async createBatch(appsData) {
    if (!appsData || appsData.length === 0) {
      return [];
    }
    return db.transaction(async (trx) => {
      // Для SQLite insert не всегда возвращает все ID, поэтому возвращаем созданные записи по номерам
      await trx('applications').insert(appsData);
      const numbers = appsData.map(a => a.application_number);
      return trx('applications').whereIn('application_number', numbers);
    });
  }

  static async update(id, appData) {
    const allowedColumns = [
      'product_id', 'lot_id', 'master_id', 'inspector_id', 
      'application_number', 'drawing_number', 'serial_number', 
      'status', 'rejection_reason', 'desired_inspection_time', 
      'mki_photo_url', 'is_active', 'btx_id', 'production_order_number', 
      'inspected_at'
    ];

    const filteredData = {};
    allowedColumns.forEach(col => {
      if (appData[col] !== undefined) filteredData[col] = appData[col];
    });

    await db('applications')
      .where({ id })
      .update({
        ...filteredData,
        updated_at: db.fn.now()
      });
    return this.findById(id);
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

    await db('applications')
      .where({ id })
      .update(updateData);
    
    return this.findById(id);
  }
}

module.exports = Application;

