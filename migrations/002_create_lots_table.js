exports.up = function(knex) {
  return knex.schema.createTable('lots', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('code').unique().notNullable(); // Уникальный код участка
    table.integer('priority').defaultTo(3); // Приоритет 1-5 (1 - высший)
    table.decimal('distance_to_office', 5, 2); // Расстояние до кабинета ОТК в метрах
    table.integer('main_master_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.integer('temp_master_id').unsigned().references('id').inTable('users').onDelete('SET NULL'); // Временный мастер
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['code']);
    table.index(['priority', 'is_active']);
    table.index(['main_master_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('lots');
};