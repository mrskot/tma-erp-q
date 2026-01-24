exports.up = function(knex) {
  return knex.schema.createTable('system_configs', (table) => {
    table.increments('id').primary();
    table.string('key').unique().notNullable(); // Уникальный ключ конфигурации
    table.jsonb('value').defaultTo('{}'); // Значение (может быть любым JSON)
    table.string('data_type').defaultTo('string'); // Тип данных: string, number, boolean, array, object
    table.string('category').defaultTo('general'); // Категория: general, security, telegram, bitrix, sla, etc.
    table.text('description'); // Описание параметра
    table.boolean('is_public').defaultTo(false); // Доступен ли через публичный API
    table.boolean('is_encrypted').defaultTo(false); // Нужно ли шифровать значение
    
    // Кто и когда изменил
    table.integer('updated_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['key']);
    table.index(['category']);
    table.index(['is_public']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('system_configs');
};