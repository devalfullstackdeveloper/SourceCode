'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SlidersSchema extends Schema {
  up () {
    this.table('sliders', (table) => {
      // alter table
      table.string("alt")	
    })
  }

  down () {
    this.table('sliders', (table) => {
      // reverse alternations
    })
  }
}

module.exports = SlidersSchema
