const db = require('../config/database');

class Lot {
  static async findAllWithMasterIds(limit = 100, offset = 0) {
    return db('lots')
      .select('lots.*') // Выбираем все поля из таблицы lots
      .where('lots.is_active', true)
      .orderBy('lots.priority', 'asc')
      .orderBy('lots.name', 'asc')
      .limit(limit)
      .offset(offset);
  }

  // Получить участок по ID
  static async findById(id) {
    return db('lots')
      .where({ id, is_active: true })
      .first();
  }

  // Получить все активные участки
  static async findAll(limit = 100, offset = 0, status = 'active') {
    const query = db('lots');

    if (status === 'active') {
      query.where({ is_active: true });
    } else if (status === 'inactive') {
      query.where({ is_active: false });
    }
    // Если status === 'all', фильтр по is_active не применяется

    return query
      .orderBy('priority', 'asc')
      .orderBy('name', 'asc')
      .limit(limit)
      .offset(offset);
  }

  // Получить участок по коду
  static async findByCode(code) {
    return db('lots')
      .where({ code, is_active: true })
      .first();
  }

  // Получить участки по мастеру
  static async findByMaster(masterId) {
    return db('lots')
      .where({ is_active: true })
      .where(function() {
        this.where('main_master_id', masterId)
          .orWhere('temp_master_id', masterId);
      })
      .orderBy('priority', 'asc');
  }

  // Создать новый участок
  static async create(lotData) {
    const [lot] = await db('lots')
      .insert(lotData)
      .returning('*');
    return lot;
  }

  // Обновить участок
  static async update(id, lotData) {
    const [lot] = await db('lots')
      .where({ id })
      .update({
        ...lotData,
        updated_at: db.fn.now()
      })
      .returning('*');
    return lot;
  }

  // Удалить участок (soft delete)
  static async delete(id) {
    return db('lots')
      .where({ id })
      .update({
        is_active: false,
        updated_at: db.fn.now()
      });
  }

  // Восстановить участок
  static async reactivate(id) {
    return db('lots')
      .where({ id })
      .update({
        is_active: true,
        updated_at: db.fn.now()
      });
  }

  // Получить участок с информацией о мастерах
  static async findByIdWithMasters(id) {
    const lot = await db('lots')
      .where({ 'lots.id': id, 'lots.is_active': true })
      .leftJoin('users as main_master', 'lots.main_master_id', 'main_master.id')
      .leftJoin('users as temp_master', 'lots.temp_master_id', 'temp_master.id')
      .select(
        'lots.*',
        'main_master.first_name as main_master_first_name',
        'main_master.last_name as main_master_last_name',
        'main_master.username as main_master_username',
        'temp_master.first_name as temp_master_first_name',
        'temp_master.last_name as temp_master_last_name',
        'temp_master.username as temp_master_username'
      )
      .first();

    if (!lot) return null;

    // Форматируем результат
    return {
      ...lot,
      main_master: lot.main_master_id ? {
        id: lot.main_master_id,
        first_name: lot.main_master_first_name,
        last_name: lot.main_master_last_name,
        username: lot.main_master_username
      } : null,
      temp_master: lot.temp_master_id ? {
        id: lot.temp_master_id,
        first_name: lot.temp_master_first_name,
        last_name: lot.temp_master_last_name,
        username: lot.temp_master_username
      } : null
    };
  }

  // Получить все участки с информацией о мастерах
  // Возвращает плоскую структуру с ID мастеров для удобства на фронте
  static async findAllWithMasters(limit = 100, offset = 0, status = 'active') {
    const query = db('lots');

    if (status === 'active') {
      query.where({ 'lots.is_active': true });
    } else if (status === 'inactive') {
      query.where({ 'lots.is_active': false });
    }
    // Если status === 'all', фильтр не применяется
    
    const lots = await query
      .leftJoin('users as main_master', 'lots.main_master_id', 'main_master.id')
      .leftJoin('users as temp_master', 'lots.temp_master_id', 'temp_master.id')
      .select(
        'lots.*',
        'main_master.first_name as main_master_first_name',
        'main_master.last_name as main_master_last_name',
        'main_master.username as main_master_username',
        'temp_master.first_name as temp_master_first_name',
        'temp_master.last_name as temp_master_last_name',
        'temp_master.username as temp_master_username'
      )
      .orderBy('lots.priority', 'asc')
      .orderBy('lots.name', 'asc')
      .limit(limit)
      .offset(offset);

    return lots.map(lot => ({
      ...lot,
      // Плоские поля для фронта (удобство)
      main_master_name: lot.main_master_id ? `${lot.main_master_first_name} ${lot.main_master_last_name}` : null,
      temp_master_name: lot.temp_master_id ? `${lot.temp_master_first_name} ${lot.temp_master_last_name}` : null,
      // Объекты мастеров для полной информации
      main_master: lot.main_master_id ? {
        id: lot.main_master_id,
        first_name: lot.main_master_first_name,
        last_name: lot.main_master_last_name,
        username: lot.main_master_username
      } : null,
      temp_master: lot.temp_master_id ? {
        id: lot.temp_master_id,
        first_name: lot.temp_master_first_name,
        last_name: lot.temp_master_last_name,
        username: lot.temp_master_username
      } : null
    }));
  }

  // Подсчёт активных участков
  static async count(status = 'active') {
    const query = db('lots');
    
    if (status === 'active') {
      query.where({ is_active: true });
    } else if (status === 'inactive') {
      query.where({ is_active: false });
    }
    // Если status === 'all', фильтр не применяется

    const result = await query
      .count('id as count')
      .first();
    return parseInt(result.count, 10);
  }

  // Назначить временного мастера
  static async assignTempMaster(lotId, tempMasterId) {
    const [lot] = await db('lots')
      .where({ id: lotId })
      .update({
        temp_master_id: tempMasterId,
        updated_at: db.fn.now()
      })
      .returning('*');
    return lot;
  }

  // Удалить временного мастера (вернуть к основному)
  static async removeTempMaster(lotId) {
    const [lot] = await db('lots')
      .where({ id: lotId })
      .update({
        temp_master_id: null,
        updated_at: db.fn.now()
      })
      .returning('*');
    return lot;
  }
}

module.exports = Lot;
