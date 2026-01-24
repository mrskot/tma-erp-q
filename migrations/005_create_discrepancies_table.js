exports.up = function(knex) {
  return knex.schema.createTable('discrepancies', (table) => {
    table.increments('id').primary();
    table.string('discrepancy_number').unique().notNullable(); // Уникальный номер несоответствия
    
    // Связь с заявкой (опционально - несоответствие может быть автономным)
    table.integer('application_id').unsigned().references('id').inTable('applications').onDelete('SET NULL');
    
    // Основная информация
    table.string('title').notNullable(); // Краткое описание
    table.text('description'); // Подробное описание
    table.enum('severity', ['low', 'medium', 'high', 'critical']).defaultTo('medium'); // Серьезность
    
    // Фото дефекта
    table.string('defect_photo_url');
    table.string('defect_photo_key'); // Ключ в S3
    
    // Ответственные
    table.integer('responsible_id').unsigned().references('id').inTable('users').onDelete('SET NULL'); // Основной ответственный
    table.integer('assigned_worker_id').unsigned().references('id').inTable('users').onDelete('SET NULL'); // Рабочий, назначенный на устранение
    table.integer('inspector_id').unsigned().references('id').inTable('users').onDelete('SET NULL'); // Инспектор, обнаруживший
    
    // Сроки
    table.timestamp('detected_at').notNullable(); // Когда обнаружено
    table.timestamp('assigned_at'); // Когда назначено ответственному
    table.timestamp('started_at'); // Когда начато устранение
    table.timestamp('due_date'); // Срок устранения
    table.timestamp('closed_at'); // Когда закрыто
    
    // Статусы и сценарии закрытия
    table.enum('status', ['new', 'assigned', 'in_progress', 'resolved', 'closed']).notNullable().defaultTo('new');
    table.enum('closure_scenario', ['fixed', 'resolution_card', 'scrap', 'political']); // Сценарий закрытия
    
    // Дополнительная информация для сценариев
    table.text('resolution_card_details'); // Детали карточки разрешения
    table.text('scrap_reason'); // Причина списания в брак
    table.text('political_decision_details'); // Детали политического решения
    
    // Метаданные
    table.jsonb('metadata').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['discrepancy_number']);
    table.index(['application_id']);
    table.index(['responsible_id']);
    table.index(['inspector_id']);
    table.index(['status', 'is_active']);
    table.index(['closure_scenario']);
    table.index(['detected_at']);
    table.index(['due_date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('discrepancies');
};