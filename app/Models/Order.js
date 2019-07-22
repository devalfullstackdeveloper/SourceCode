'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Order extends Model {
    static boot () {
		super.boot()

		this.addHook('beforeCreate', async (orderInstance) => {
			orderInstance.created_at = new Date()
		})
	}
}

module.exports = Order
