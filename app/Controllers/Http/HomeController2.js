'use strict'

const Pair = use('App/Models/Pair')
const Slider = use('App/Models/Slider')
const axios = use('axios')

class HomeController2 {

	async index({ params, request, response, view, antl, session }) {

		const pairs = {}

		pairs.sliders = await Slider.query().select('id', 'title', 'subtitle', 'image').where('deleted_at', null).fetch()

		pairs.favourite_pairs = session.get('favourite_pairs', [])
		pairs.favourite = await Pair.query().whereIn('pair_key', pairs.favourite_pairs).where('deleted_at', null).fetch()
		pairs.usd = await Pair.query().where('base_currency', 'usd').where('deleted_at', null).fetch()
		pairs.euro = await Pair.query().where('base_currency', 'euro').where('deleted_at', null).fetch()
		pairs.btc = await Pair.query().where('base_currency', 'btc').where('deleted_at', null).fetch()
		pairs.eth = await Pair.query().where('base_currency', 'eth').where('deleted_at', null).fetch()

		return view.render('home.home', { pairs : pairs });
		
	}

	async favourite({ params, response, session }){

		if( ! params.pair ){
			return response.json({ success : false, message : 'Empty pair' })
		}

		const favourite_pairs = session.get('favourite_pairs', [])

		var index = favourite_pairs.indexOf(params.pair)

		if( index < 0 ){
			
			favourite_pairs.push(params.pair)
			session.put('favourite_pairs', favourite_pairs)
			return response.json({ added : true, message : 'Added' })
			
		} else {
			favourite_pairs.splice(index, 1)
			session.put('favourite_pairs', favourite_pairs)
			return response.json({ added : false, message : 'Removed' })
		}

	}

	/**
	 * Ticker API
	 *
	 * Provide data related to given pair
	 */
	async tickerApi({params, response}) {

		// Collet the symbol
		const symbol = params.pair ? params.pair : 'BTCUSD';

		// Get ticker information from API
		const ticker = await axios
		.get(`https://api-pub.bitfinex.com/v2/tickers?symbols=t${symbol}`) 
		.then((res) => {
			if( res.status == 200 ) 
				return res.data

			return false
		})
		.catch((error) => {
			return false
		})

		// If no data found or error
		if( ticker == false )
			return response.json([])

		// Return information
		return response.json(ticker)
	}
}

module.exports = HomeController2