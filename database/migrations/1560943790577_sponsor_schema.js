'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SponsorSchema extends Schema {
  up () {
    this.createIfNotExists('sponsors', (table) => {
      table.increments()
      table.string('name')
      table.string('description')
      table.string('image')
      table.timestamps()
    })
  }

  down () {
    this.drop('sponsors')
  }
}

module.exports = SponsorSchema
