/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('applications', (table) => {
    table.string('drawing_number'); // Номер чертежа, может быть nullable
    table.integer('inspector_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    
    table.index('drawing_number');
    table.index('inspector_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('applications', (table) => {
    // Важно удалять в обратном порядке от создания
    table.dropColumn('drawing_number');
    table.dropColumn('inspector_id');
  });
};
