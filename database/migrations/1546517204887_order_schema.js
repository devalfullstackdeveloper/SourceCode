'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class OrderSchema extends Schema {
  up () {
    this.create('orders', (table) => {
      table.increments()
      table.integer('user_id')
      table.double('buy_price')
      table.double('buy_amount')
      table.string('buy_currency')
      table.double('sell_price')
      table.double('sell_amount')
      table.string('sell_currency')
      table.integer('order_against')
      table.integer('status')
      table.timestamp('created_at').defaultTo(this.fn.now())
      table.timestamp('updated_at').defaultTo(this.fn.now())
      table.datetime('deleted_at').nullable()
    })
  }

  down () {
    this.drop('orders')
  }
}

module.exports = OrderSchema
