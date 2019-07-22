'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PairSchema extends Schema {
  up () {
    this.create('pairs', (table) => {
      table.increments()
      table.string('coin')
      table.string('pair_name')
      table.string('pair_key')
      table.string('base_currency')
      table.string('icon')
      table.timestamp('created_at').defaultTo(this.fn.now())
      table.timestamp('updated_at').defaultTo(this.fn.now())
      table.datetime('deleted_at').nullable()
    })
  }

  down () {
    this.drop('pairs')
  }
}

module.exports = PairSchema
