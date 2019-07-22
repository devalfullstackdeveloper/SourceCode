'use strict'

const Model = use('Model')

class WithdrawLimit extends Model {
    
    
	/**
	 * Override table name
	 */
	static get table () {
		return 'withdraw_limits';
	}
}

module.exports = WithdrawLimit
