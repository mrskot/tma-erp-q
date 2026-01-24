exports.up = function(knex) {
  return knex.schema.createTable('applications', (table) => {
    table.increments('id').primary();
    table.string('application_number').unique().notNullable(); // Уникальный номер заявки
    table.integer('master_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('lot_id').unsigned().references('id').inTable('lots').onDelete('CASCADE');
    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE');
    table.string('serial_number'); // Серийный номер изделия/партии
    table.integer('quantity').defaultTo(1); // Количество
    
    // Фото МКИ (Маршрутная карта изделия)
    table.string('mki_photo_url');
    table.string('mki_photo_key'); // Ключ в S3
    
    // Сроки
    table.timestamp('desired_inspection_time').notNullable(); // Желаемый срок приёмки
    table.timestamp('assigned_at'); // Когда назначена инспектору
    table.timestamp('started_at'); // Когда начата проверка
    table.timestamp('completed_at'); // Когда завершена
    
    // Статусы
    table.enum('status', ['new', 'assigned', 'in_progress', 'accepted', 'rejected']).notNullable().defaultTo('new');
    table.text('rejection_reason'); // Причина отклонения
    
    // Метаданные
    table.jsonb('metadata').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['application_number']);
    table.index(['master_id']);
    table.index(['lot_id']);
    table.index(['product_id']);
    table.index(['status', 'is_active']);
    table.index(['desired_inspection_time']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('applications');
};