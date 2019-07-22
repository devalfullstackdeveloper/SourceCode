'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class LoginHistorySchema extends Schema {
  up () {
    this.create('login_histories', (table) => {
      table.increments()
      table.integer('user_id')
      table.string('ip_address')
      table.string('location')
      table.timestamp('created_at').defaultTo(this.fn.now())
      table.timestamp('updated_at').defaultTo(this.fn.now())
      table.datetime('deleted_at').nullable()
    })
  }

  down () {
    this.drop('login_histories')
  }
}

module.exports = LoginHistorySchema
