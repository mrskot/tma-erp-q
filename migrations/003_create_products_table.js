exports.up = function(knex) {
  return knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable(); // Наименование: Обмотка НН, Остов, Трансформатор ТСЛ и т.д.
    table.string('affiliation'); // Принадлежность: ТМГ, ТСЛ, ТМ, оснастка и т.д.
    table.enum('product_type', ['finished', 'semi_finished', 'assembly', 'part']).notNullable().defaultTo('finished'); // Тип: готовое изделие, ПФ, узел, деталь
    table.enum('unit_of_measure', ['шт', 'компл']).notNullable().defaultTo('шт'); // Единица измерения: штуки или комплекты
    table.integer('lot_id').unsigned().references('id').inTable('lots').onDelete('CASCADE');
    
    // Контролёр по умолчанию для этого типа продукта
    table.integer('default_inspector_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    
    // Связи с предыдущим и следующим участком (для производственного маршрута)
    table.integer('previous_lot_id').unsigned().references('id').inTable('lots').onDelete('SET NULL');
    table.integer('next_lot_id').unsigned().references('id').inTable('lots').onDelete('SET NULL');
    
    table.jsonb('checklist').defaultTo('[]'); // Чек-лист приёмки в JSON формате
    table.integer('inspection_time_minutes').defaultTo(30); // Время контроля в минутах
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['name']);
    table.index(['affiliation']);
    table.index(['lot_id', 'is_active']);
    table.index(['product_type']);
    table.index(['default_inspector_id']);
    table.index(['previous_lot_id']);
    table.index(['next_lot_id']);
    table.unique(['name', 'lot_id']); // Уникальная комбинация наименования и участка
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('products');
};