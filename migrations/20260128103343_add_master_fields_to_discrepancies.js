/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('discrepancies', (table) => {
    table.string('fix_photo_url');
    table.string('fix_photo_key');
    table.text('special_opinion');
    table.boolean('is_disputed').defaultTo(false);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('discrepancies', (table) => {
    table.dropColumn('fix_photo_url');
    table.dropColumn('fix_photo_key');
    table.dropColumn('special_opinion');
    table.dropColumn('is_disputed');
  });
};

