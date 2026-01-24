/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    // Добавляем колонку после 'phone_number' для логического порядка
    table.string('bitrix_id').nullable().after('phone_number');
    // Добавляем индекс для быстрого поиска
    table.index('bitrix_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    // Удаляем в обратном порядке: сначала индекс, потом колонку
    table.dropIndex('bitrix_id');
    table.dropColumn('bitrix_id');
  });
};
