exports.up = function(knex) {
  return knex.schema.createTable('sync_jobs', (table) => {
    table.increments('id').primary();
    
    // Тип задания
    table.string('job_type').notNullable(); // telegram_notification, bitrix_sync, email, report_generation, etc.
    table.string('entity_type'); // application, discrepancy, user, etc.
    table.integer('entity_id').unsigned(); // ID сущности
    
    // Данные задания
    table.jsonb('payload').defaultTo('{}'); // Данные для обработки
    table.jsonb('result').defaultTo('{}'); // Результат выполнения
    
    // Статус выполнения
    table.enum('status', ['pending', 'processing', 'completed', 'failed', 'retry']).defaultTo('pending');
    table.integer('attempts').defaultTo(0); // Количество попыток
    table.text('error_message'); // Сообщение об ошибке
    
    // Время выполнения
    table.timestamp('scheduled_for').defaultTo(knex.fn.now()); // Когда запланировано
    table.timestamp('started_at'); // Когда начато
    table.timestamp('completed_at'); // Когда завершено
    
    // Приоритет
    table.integer('priority').defaultTo(5); // 1-10, где 1 - высший приоритет
    
    // Метаданные
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['job_type']);
    table.index(['entity_type', 'entity_id']);
    table.index(['status', 'scheduled_for']);
    table.index(['priority']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('sync_jobs');
};