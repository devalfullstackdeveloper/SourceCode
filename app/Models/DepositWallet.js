'use strict'

const Model = use('Model')

class DepositWallet extends Model {
    
    
	/**
	 * Override table name
	 */
	static get table () {
		return 'deposit_wallets';
	}
}

module.exports = DepositWallet
