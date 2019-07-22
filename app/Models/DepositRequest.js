'use strict'

const Model = use('Model')

class DepositRequest extends Model {
    
    
	/**
	 * Override table name
	 */
	static get table () {
		return 'deposit_requests';
	}
}

module.exports = DepositRequest