'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UsersSchema extends Schema {
  up () {
    this.create('users', (table) => {
      table.increments()
      table.string('name')
      table.string('email').unique()
      table.string('password')
      table.integer('status').defaultTo('0')
      table.string('token')
      table.string('mobile').nullable()
      table.string('profile').nullable()
      table.string('tfa_code').nullable()
      table.string('tfa_status').defaultTo('0')
      table.string('sms_auth').defaultTo('0')
      table.string('anti_phishing_code').nullable()
      table.timestamp('created_at').defaultTo(this.fn.now())
      table.timestamp('updated_at').defaultTo(this.fn.now())
      table.datetime('deleted_at').nullable()
    })
  }

  down () {
    this.drop('users')
  }
}

module.exports = UsersSchema
