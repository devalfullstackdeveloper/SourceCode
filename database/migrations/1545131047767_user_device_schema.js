'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserDeviceSchema extends Schema {
  up () {
    this.create('user_devices', (table) => {
      table.increments()
      table.integer('user_id')
      table.string('ip_address')
      table.string('location')
      table.string('device')
      table.integer('status').defaultTo('0')
      table.timestamp('created_at').defaultTo(this.fn.now())
      table.timestamp('updated_at').defaultTo(this.fn.now())
      table.datetime('deleted_at').nullable()
    })
  }

  down () {
    this.drop('user_devices')
  }
}

module.exports = UserDeviceSchema
