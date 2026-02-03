const db = require('../config/database');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
  }

  /**
   * Стандартная выборка с пагинацией и фильтрацией
   */
  async findAll({ limit = 100, offset = 0, filters = {}, includeInactive = false, orderBy = { column: 'created_at', direction: 'desc' } } = {}) {
    const query = this.db(this.tableName);

    // Soft delete filter
    if (!includeInactive) {
      query.where('is_active', true);
    }

    // Custom filters
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        query.where(key, filters[key]);
      }
    });

    const data = await query
      .orderBy(orderBy.column, orderBy.direction)
      .limit(limit)
      .offset(offset);

    return data;
  }

  /**
   * Поиск по ID
   */
  async findById(id, includeInactive = false) {
    const query = this.db(this.tableName).where({ id });
    
    if (!includeInactive) {
      query.andWhere('is_active', true);
    }
    
    return query.first();
  }

  /**
   * Создание записи (Safe for SQLite & Postgres)
   */
  async create(data) {
    // Удаляем id, если он передан как пустая строка (может приходить из фронтенда)
    const cleanData = { ...data };
    if (cleanData.id === '' || cleanData.id === undefined) {
      delete cleanData.id;
    }

    // Вставка записи
    const [id] = await this.db(this.tableName)
      .insert(cleanData)
      .returning('id')
      .then(ids => ids.map(id => typeof id === 'object' ? id.id : id));

    return this.findById(id, true);
  }

  /**
   * Обновление записи
   */
  async update(id, data) {
    await this.db(this.tableName)
      .where({ id })
      .update({
        ...data,
        updated_at: this.db.fn.now()
      });

    return this.findById(id, true);
  }

  /**
   * Мягкое удаление
   */
  async delete(id) {
    await this.db(this.tableName)
      .where({ id })
      .update({
        is_active: false,
        updated_at: this.db.fn.now()
      });
    return true;
  }

  /**
   * Восстановление
   */
  async restore(id) {
    await this.db(this.tableName)
      .where({ id })
      .update({
        is_active: true,
        updated_at: this.db.fn.now()
      });
    return this.findById(id, true);
  }

  /**
   * Подсчет количества
   */
  async count(filters = {}, includeInactive = false) {
    const query = this.db(this.tableName);

    if (!includeInactive) {
      query.where('is_active', true);
    }

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        query.where(key, filters[key]);
      }
    });

    const result = await query.count('id as count').first();
    return parseInt(result.count || result['count(*)'], 10);
  }
}

module.exports = BaseModel;