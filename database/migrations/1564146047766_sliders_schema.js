'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SlidersSchema extends Schema {
  up () {
    this.create('sliders', (table) => {
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('sliders')
  }
}

module.exports = SlidersSchema
