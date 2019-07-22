'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class RequestFees extends Model {
	
	static get table () {
		return 'requestfees';
	}
	user () { 
    return this.belongsTo('App/Models/User')
  }
}

module.exports = RequestFees
