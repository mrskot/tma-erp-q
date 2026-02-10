/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_availability', (table) => {
    table.increments('id').primary();
    // Связь с пользователем. Один к одному.
    table.integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable()
      .unique(); // У одного пользователя может быть только одна запись о доступности
    table.boolean('is_available').notNullable().defaultTo(true);
    table.date('unavailable_until').nullable().comment('До какой даты недоступен (включительно)');
    table.string('reason').nullable().comment('Причина: отпуск, больничный и т.д.');
    table.timestamps(true, true);
    table.index('is_available');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('user_availability');
};

