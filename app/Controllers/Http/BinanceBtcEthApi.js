'use strict'

const axios = use('axios')

class BinanceBtcEthApi {

	/**
	 * Ticker API for Binance BTC Data
	 */
	async index({request, response}) {

		// url to api
		var url = `https://api.binance.com/api/v1/ticker/24hr`;

		// If has symbol
		if( request.get().symbol && 
			request.get().symbol != '' && 
			request.get().symbol != null &&
			request.get().symbol != 'undefined' ) {
			url = `https://api.binance.com/api/v1/ticker/24hr?symbol=${request.get().symbol}`;
		}

		// Get ticker information from API
		const ticker = await axios
		.get(url)
		.then((res) => {
			if( res.status == 200 ) 
				return res.data

			return res
		})
		.catch((error) => {
			console.log(error)
		})

		// If no data found or error
		if( ticker == false )
			return response.json([])

		// Return information
		return response.json(ticker)
	}
}

module.exports = BinanceBtcEthApi