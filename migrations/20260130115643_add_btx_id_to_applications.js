/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('applications', (table) => {
    table.string('btx_appl_id').nullable(); // ID заявки в Битрикс24
    table.index('btx_appl_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('applications', (table) => {
    table.dropColumn('btx_appl_id');
  });
};

