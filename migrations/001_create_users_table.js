exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('telegram_id').unique().notNullable();
    table.string('first_name').notNullable();
    table.string('last_name');
    table.string('username');
    table.string('phone_number');
    table.string('pin_code', 4); // 4-digit PIN for first login
    table.string('role').notNullable().defaultTo('worker'); // worker, master, inspector, director, admin
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login_at');
    table.timestamps(true, true); // created_at, updated_at
    
    // Indexes
    table.index(['telegram_id']);
    table.index(['role', 'is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};