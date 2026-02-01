/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('applications', (table) => {
    table.string('production_order_number'); // Номер производственного заказа
    table.timestamp('inspected_at'); // Время завершения контроля
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('applications', (table) => {
    table.dropColumn('production_order_number');
    table.dropColumn('inspected_at');
  });
};

