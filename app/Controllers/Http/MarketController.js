'use strict'

const Pair = use('App/Models/Pair')
const Order = use('App/Models/Order')
const StopOrder = use('App/Models/StopOrder')
const Address = use('App/Models/Address')
const Env = use('Env')
const User = use('App/Models/User')
const axios = use('axios')
const Requestfees = use('App/Models/RequestFees')

class MarketController {

	async marketDetail({params, request, response, antl, view, auth, session}) {

	 
		const data = { base_currency_balance : 0, derive_currency_balance : 0 }
		data.user = await auth.getUser()

		if( auth.user ) {
			if(!(auth.user.usd_balance || auth.user.euro_balance)){
			session.flash({ error: 'Please deposit before to proceed in any transaction.'})
			return response.route('wallets', {currency : params.currency })
			}
		}

		data.usd = await Pair.query().where('base_currency', 'usd').where('deleted_at', null).where('status', 1).fetch()
		data.euro = await Pair.query().where('base_currency', 'eur').where('deleted_at', null).where('status', 1).fetch()
		data.btc = await Pair.query().where('base_currency', 'btc').where('deleted_at', null).where('status', 1).fetch()
		data.eth = await Pair.query().where('base_currency', 'eth').where('deleted_at', null).where('status', 1).fetch()
		data.favourite_pairs = session.get('favourite_pairs', [])
		data.favourite = await Pair.query().whereIn('pair_key', data.favourite_pairs).where('deleted_at', null).fetch()
		
		const usdPairs = Array.prototype.map.call(data.usd.rows, function(item){ return `t${(item.pair_key).toUpperCase()}`; }).join(",")
		const euroPairs = Array.prototype.map.call(data.euro.rows, function(item){ return `t${(item.pair_key).toUpperCase()}`; }).join(",")
		const btcPairs = Array.prototype.map.call(data.btc.rows, function(item){ return `${(item.pair_key).toUpperCase()}`; }).join(",")
		const ethPairs = Array.prototype.map.call(data.eth.rows, function(item){ return `${(item.pair_key).toUpperCase()}`; }).join(",")

		const custRates = {};

		Array.prototype.map.call(data.usd.rows, function(item){ return custRates[item.pair_key] = item.custom_amount; })
		Array.prototype.map.call(data.euro.rows, function(item){ return custRates[item.pair_key] = item.custom_amount; })
		Array.prototype.map.call(data.btc.rows, function(item){ return custRates[item.pair_key] = item.custom_amount; })
		Array.prototype.map.call(data.eth.rows, function(item){ return custRates[item.pair_key] = item.custom_amount; })

		data.custRates = JSON.stringify(custRates)
		data.allPairs = `${usdPairs},${euroPairs}`;

		data.btcEthPairs = `${btcPairs},${ethPairs}`;

		data.pair = await Pair.findBy('pair_key', params.pair)
		
		const stoporder = await StopOrder.query().where('user_id', auth.user.id).where('pair', params.pair).fetch()
		const stoporderdata = [];
		const stoporderdatas = {};
		
		if(stoporder.rows.length) {
			Array.prototype.map.call(stoporder.rows, function(item){
				stoporderdata.push(item.stop_amout,item.id)
			})
			data.stoporderdata = JSON.stringify(stoporderdata)
		
			Array.prototype.map.call(stoporder.rows, function(item){
				stoporderdatas[item.stop_amout] = item.id;
			})
			data.stoporderdatas = JSON.stringify(stoporderdatas)
		}

 		data.requestfees = await Requestfees.query().orderBy('id', 'asc').fetch()
        data.userfees = await Requestfees.findBy('id',auth.user.level)
	

		if( auth.user ) {

			data.base_currency_balance = 0;

			if(data.pair.base_currency == 'usd'){
				data.base_currency_balance = auth.user.usd_balance
			} else if(data.pair.base_currency == 'euro'){
				data.base_currency_balance = auth.user.euro_balance
			} else {
				const address = await Address
								  .query()
								  .where('user_id', auth.user.id)
								  .where('currency', data.pair.base_currency)
								  .first()

				if( address ) {
					data.base_currency_balance = address.balance
				}
			}

			const address = await Address
								  .query()
								  .where('user_id', auth.user.id)
								  .where('currency', data.pair.derive_currency)
								  .first()

			data.derive_currency_balance = 0;	  

			if( address ) {
				data.derive_currency_balance = address.balance

				// if(data.pair.derive_currency == 'btc' || 
				// 	data.pair.derive_currency == 'eth' || 
				// 	data.pair.derive_currency == 'xrp' || 
				// 	data.pair.derive_currency == 'bab' || 
				// 	data.pair.derive_currency == 'ltc' || 
				// 	data.pair.derive_currency == 'eos' || 
				// 	data.pair.derive_currency == 'xlm' || 
				// 	data.pair.derive_currency == 'trx' || 
				// 	data.pair.derive_currency == 'xmr' || 
				// 	data.pair.derive_currency == 'dsh' || 
				// 	data.pair.derive_currency == 'iot' || 
				// 	data.pair.derive_currency == 'neo' || 
				// 	data.pair.derive_currency == 'etc') {
				// 	var dcur = data.pair.derive_currency
				// } else {
				// 	var dcur = 'eth'
				// }

				// const url = Env.get('CRYPTO_URL') + dcur + '/balance/' + address.public_key + '/' + Env.get('CRYPTO_NETWORK')

				// data.derive_currency_balance = await axios.get( url )
				// .then(acData => {
				// 	acData.data.balance  = acData.data.balance.toFixed(8) 
				// 	newbalance = newbalance.toFixed(8)
				// 	acData.data.balance = Number(acData.data.balance) + Number(newbalance)
				// 	return (acData.data.balance).toFixed(8)
				// })
			}
		}

		data.ws_url = Env.get('WS_URL')

		return view.render('market.market', data)
	}

	async cancelOrder({request, response, antl, auth}) {

		const order = await Order.find(request.body.id)
		const user = auth.user
		var ordertype = order.order_type

		if(ordertype == 0) {

			var newpair = order.pair

			var lastChar = newpair.substr(newpair.length - 3);


			const user = auth.user

			if( lastChar == 'usd' ){
				user.usd_balance = (Number(user.usd_balance) + Number(order.total))
			} else if( lastChar == 'eur' ){
				user.euro_balance = (Number(user.euro_balance) + Number(order.total))
			} else {
				const adminWallet = await Address
										.query()
										.select('public_key','balance')
										.where('currency', lastChar)
										.where('user_id', order.user_id)
										.first()

				var newbalance = Number(adminWallet.balance) + Number(order.amount)

				const updateWallety = await Address 
									.query()
									.where('currency', lastChar)
									.where('user_id', order.user_id)
									.update({ balance: newbalance})
			}

			await user.save()

		} else if (ordertype == 1) {

			var newpair = order.pair
			var lastChar = newpair.substring(0,3);
			const user = auth.user

			if( lastChar == 'usd' ){
				user.usd_balance = (Number(user.usd_balance) + Number(order.total)) - Number(order.fees)
			} else if( lastChar == 'eur' ) {
				user.euro_balance = (Number(user.euro_balance) + Number(order.total)) - Number(order.fees)
			} else {
				const adminWallet = await Address
										.query()
										.select('public_key','balance')
										.where('currency', lastChar)
										.where('user_id', order.user_id)
										.first()

				var newbalance = Number(adminWallet.balance) + Number(order.amount)


				const updateWallety = await Address 
											.query()
											.where('currency', lastChar)
											.where('user_id', order.user_id)
											.update({ balance: newbalance}) 
			}

			await user.save()
		}

		if( ! order ){
			return response.json({success : false, error : antl.formatMessage('messages.order_not_found') })
		}

		order.status = 2
		order.save()

		return response.json({success : true, error : antl.formatMessage('messages.order_canceled') })
	}
}

module.exports = MarketController
