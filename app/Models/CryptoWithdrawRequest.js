'use strict'

const Model = use('Model')

class CryptoWithdrawRequest extends Model {
    
    
	/**
	 * Override table name
	 */
	static get table () {
		return 'crypto_withdraw_request';
	}
}

module.exports = CryptoWithdrawRequest