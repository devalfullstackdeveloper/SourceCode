'use strict'

const Pair = use('App/Models/Pair')
const Slider = use('App/Models/Slider')
const Sponsor = use('App/Models/Sponsor')
const axios = use('axios')

class HomeController2 {

	async index({ params, request, response, view, antl, session }) {

		const pairs = {}

		pairs.sliders = await Slider.query().select('id', 'title', 'subtitle','alt', 'image').where('deleted_at', null).fetch()
		pairs.favourite_pairs = session.get('favourite_pairs', [])
		pairs.favourite = await Pair.query().whereIn('pair_key', pairs.favourite_pairs).where('deleted_at', null).fetch()
		pairs.usd = await Pair.query().where('base_currency', 'usd').where('deleted_at', null).where('status', 1).fetch()
		pairs.euro = await Pair.query().where('base_currency', 'eur').where('deleted_at', null).where('status', 1).fetch()
		pairs.btc = await Pair.query().where('base_currency', 'btc').where('deleted_at', null).where('status', 1).fetch()
		pairs.eth = await Pair.query().where('base_currency', 'eth').where('deleted_at', null).where('status', 1).fetch()

		const usdPairs = Array.prototype.map.call(pairs.usd.rows, function(item){ return `t${(item.pair_key).toUpperCase()}`; }).join(",")
		const euroPairs = Array.prototype.map.call(pairs.euro.rows, function(item){ return `t${(item.pair_key).toUpperCase()}`; }).join(",")
		const btcPairs = Array.prototype.map.call(pairs.btc.rows, function(item){ return `${(item.pair_key).toUpperCase()}`; }).join(",")
		const ethPairs = Array.prototype.map.call(pairs.eth.rows, function(item){ return `${(item.pair_key).toUpperCase()}`; }).join(",")
		const custRates = {};
		Array.prototype.map.call(pairs.usd.rows, function(item){ return custRates[item.pair_key] = item.custom_amount; })
		Array.prototype.map.call(pairs.euro.rows, function(item){ return custRates[item.pair_key] = item.custom_amount; })
		Array.prototype.map.call(pairs.btc.rows, function(item){ return custRates[item.pair_key] = item.custom_amount; })
		Array.prototype.map.call(pairs.eth.rows, function(item){ return custRates[item.pair_key] = item.custom_amount; })

		pairs.custRates = JSON.stringify(custRates)

		pairs.allPairs = `${usdPairs},${euroPairs}`;

		pairs.btcEthPairs = `${btcPairs},${ethPairs}`;
		// Get sponsors
		const data = {}

		data.sponsors = await Sponsor
					.query()
					.select('name', 'description', 'image','alt')
					.where('deleted_at', null).fetch()


		return view.render('home.home', { pairs : pairs, sponsors: data.sponsors });
	} 

	async favourite({ params, response, session }){

		if( ! params.pair ){
			return response.json({ success : false, message : 'Empty pair' })
		}

		const favourite_pairs = session.get('favourite_pairs', [])

		var index = favourite_pairs.indexOf(params.pair)

		if( index < 0 ) {
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
	async tickerApi({request, response}) {
		// Collet the symbol
		const symbol = request.get().symbols ? request.get().symbols : 'tBTCUSD';
		// Get ticker information from API
		const ticker = await axios
		.get(`https://api-pub.bitfinex.com/v2/tickers?symbols=${symbol}`)
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
	
	async candlesData({request, response}) {
	    
	    // Collet the symbol
		const pair = request.get().pair ? request.get().pair : 'tBTCUSD';

		// Get ticker information from API
		const ticker = await axios
		.get(`https://api-pub.bitfinex.com/v2/candles/trade:1M:${pair}/hist?limit=50&sort=-1`)
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