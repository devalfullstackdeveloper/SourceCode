'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class RequestCoin extends Model {
	
	static get table () {
		return 'requestcoin';
	}
	user () { 
    return this.belongsTo('App/Models/User')
  }
}

module.exports = RequestCoin
