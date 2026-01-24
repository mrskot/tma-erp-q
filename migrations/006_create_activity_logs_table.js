exports.up = function(knex) {
  return knex.schema.createTable('activity_logs', (table) => {
    table.increments('id').primary();
    
    // Кто совершил действие
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.string('user_role'); // Роль пользователя на момент действия
    
    // Что за действие
    table.string('action_type').notNullable(); // create, update, delete, status_change, assign, etc.
    table.string('entity_type').notNullable(); // user, lot, product, application, discrepancy
    table.integer('entity_id').unsigned(); // ID сущности
    
    // Детали действия
    table.jsonb('old_data').defaultTo('{}'); // Данные до изменения
    table.jsonb('new_data').defaultTo('{}'); // Данные после изменения
    table.text('description'); // Человекочитаемое описание
    
    // IP и user agent для security
    table.string('ip_address');
    table.string('user_agent');
    
    // Метаданные
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['user_id']);
    table.index(['entity_type', 'entity_id']);
    table.index(['action_type']);
    table.index(['created_at']);
    table.index(['user_role']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('activity_logs');
};