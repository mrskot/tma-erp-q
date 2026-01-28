const db = require('../config/database');

class Application {
  static async findById(id) {
    return db('applications as a')
      .select(
        'a.*',
        'p.name as product_name',
        'l.name as lot_name',
        db.raw("master.first_name || ' ' || master.last_name as master_name"),
        db.raw("inspector.first_name || ' ' || inspector.last_name as inspector_name")
      )
      .leftJoin('products as p', 'a.product_id', 'p.id')
      .leftJoin('lots as l', 'a.lot_id', 'l.id')
      .leftJoin('users as master', 'a.master_id', 'master.id')
      .leftJoin('users as inspector', 'a.inspector_id', 'inspector.id')
      .where('a.id', id)
      .first();
  }

  static async findAll({ filters = {}, limit = 100, offset = 0, user = null }) {
    const query = db('applications as a')
      .select(
        'a.*',
        'p.name as product_name',
        'l.name as lot_name',
        db.raw("master.first_name || ' ' || master.last_name as master_name"),
        db.raw("inspector.first_name || ' ' || inspector.last_name as inspector_name")
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
        query.andWhere('a.inspector_id', user.id);
      }
    }

    if (filters.master_id) {
        query.andWhere('a.master_id', filters.master_id);
    }
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
    const [app] = await db('applications')
      .insert(appData)
      .returning('*');
    return app;
  }

  static async createBatch(appsData) {
    if (!appsData || appsData.length === 0) {
      return [];
    }
    return db.transaction(async (trx) => {
      const apps = await trx('applications')
        .insert(appsData)
        .returning('*');
      return apps;
    });
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

