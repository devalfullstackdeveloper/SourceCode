'use strict'


class MaintainanceController {

	/**
	 * Ticker API for Binance BTC Data
	 */
	async index({view}) {
        return view.render('maintainance.error')
		
	}
}

module.exports = MaintainanceController