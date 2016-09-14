
exports.up = function(knex, Promise) {
  return knex.schema.createTable('account_types', function(table){
    table.increments();
    table.string('type')

  }).createTable('users', function(table){
    table.increments();
    table.string('username');
    table.string('password');
    table.integer('account_type')
    table.foreign('account_type').references('id').inTable('account_types');

    table.boolean('validated').defaultTo(false)
    table.string('state')
    table.index('username')
  }).createTable('admins', function(table){
    table.increments();
    table.integer('user_id');
    table.foreign('user_id').references('id').inTable('users');
    table.string('email');

  }).createTable('sessions', function(table){
    table.increments();
    table.string('token');
    table.index('token')
    table.integer('user_id');
    table.foreign('user_id').references('id').inTable('users');
    table.dateTime('created')
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('sessions').dropTableIfExists('admins').dropTableIfExists('users').dropTableIfExists('account_types');
};
