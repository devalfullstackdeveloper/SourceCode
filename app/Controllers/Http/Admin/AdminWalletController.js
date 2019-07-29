'use strict'

const User = use('App/Models/User')
const Pair = use('App/Models/Pair')
const Address = use('App/Models/Address')
const Order = use('App/Models/Order')
const PersonalInfo = use('App/Models/PersonalInfo')
const Kyc = use('App/Models/Kyc')
const axios = use('axios')
const AddressKyc = use('App/Models/AddressKyc')
const { validate }  = use('Validator')
const Transaction    = use('App/Models/Transaction')
const Mail          = use('Mail')
const Env           = use('Env')
const Hash = use('Hash')

class AdminWalletController {

	async index({request, response, view}){
const page = (request.get().page !== undefined) ? request.get().page : 1 
		
							const users = await Pair
							.query()
							.select('pairs.coin', 'pairs.derive_currency', 'pairs.icon', 'addresses.public_key','addresses.id')
							.joinRaw("LEFT JOIN (SELECT id, currency, public_key FROM addresses WHERE user_id=1) AS addresses ON pairs.derive_currency = addresses.currency")
							.where('pairs.deleted_at', null)
							.groupBy('pairs.derive_currency', 'pairs.coin', 'pairs.icon','addresses.public_key','addresses.id') 
							.fetch()
							
console.log(users.rows)
		return view.render('admin.details.view', {users : users})

	}
async viewDetail({params, request, response, view}){

		const user = await User.find(params.id)

		if( ! user ){
			return response.route('admin.users')
		}

		const histories = await Order
							  .query()
							  .select('price', 'amount', 'total', 'pair', 'order_type', 'status', 'created_at')
							  .where('user_id', 1)
							  .where('status', 1)
							  .fetch()

		const opens = await Order
							.query()
							.select('price', 'amount', 'remain', 'total', 'pair', 'order_type', 'status', 'created_at')
							.where('user_id', 1)
							.where('status', 0)
							.fetch()

		const depositeTxs = await Transaction
							.query()
							.select('amount', 'currency', 'created_at')
							.where('user_id', 1)
							.where('tx_type', 1)
							.fetch()

		const withdrawTxs = await Transaction
							.query()
							.where('user_id', 1)
							.where('tx_type', 0)
							.fetch()
							
							const pairs = await Pair
							.query()
							.select('pairs.coin', 'pairs.derive_currency', 'pairs.icon', 'addresses.public_key','addresses.id')
							.joinRaw("LEFT JOIN (SELECT id, currency, public_key FROM addresses WHERE user_id=1) AS addresses ON pairs.derive_currency = addresses.currency")
							.where('pairs.deleted_at', null)
							.groupBy('pairs.coin', 'pairs.derive_currency', 'pairs.icon','addresses.public_key','addresses.id')
							.fetch()

		return view.render('admin.details.view', { user : user, histories : histories, opens : opens, depositeTxs : depositeTxs, withdrawTxs : withdrawTxs, pairs : pairs })

	}
	async balance({ response, request, params, antl }){

		

		const pairs = await Pair
							.query()
							.select('pairs.derive_currency', 'addresses.public_key','addresses.id')
							.leftJoin('addresses', 'pairs.derive_currency', 'addresses.currency')
							.where('pairs.deleted_at', null)
							.where('addresses.user_id', 1)
							.groupBy('pairs.derive_currency','addresses.public_key','addresses.id')
							.fetch()

		const len = pairs.rows.length

		const addresses = {}

		for (var i = 0; i < len; i++) {
			addresses[pairs.rows[i].derive_currency] = pairs.rows[i].public_key
		}

		const url = Env.get('CRYPTO_URL') + 'balance/' + JSON.stringify(addresses) + '/' + Env.get('CRYPTO_NETWORK')

		const balances = await axios.get( url )
		.then(data => {
			return data.data
		})
		.catch(err => {
			// console.log(err)
		})


		var btcBalance = balances.btc.balance

		const currencies = await Pair
							.query()
							.select('derive_currency')
							.where('deleted_at', null)
							.where('derive_currency', '!=', 'btc')
							.groupBy('derive_currency')
							.fetch()

		for( var i=0; i < currencies.rows.length; i++ ){

			var crrURL = 'https://api.binance.com/api/v3/ticker/price?symbol=' + (currencies.rows[i].derive_currency ).toUpperCase() + 'BTC'
			console.log(crrURL)
			await axios.get( crrURL )
			.then(data => {

				if( balances[currencies.rows[i].derive_currency] ){
					btcBalance +=  ( balances[currencies.rows[i].derive_currency].balance ) * Number(data.data.price)
				}

			})
			.catch(err => {
				console.log(err)
			})

		}

		const btcusd = await axios.get( 'https://api.bitfinex.com/v1/pubticker/btcusd' ).then(data => { return data.data.last_price })
		const btceur = await axios.get( 'https://api.bitfinex.com/v1/pubticker/btceur' ).then(data => { return data.data.last_price })

		const btcusdPrice = btcBalance * Number( btcusd )
		const btceurPrice = btcBalance * Number( btceur )

		return response.json({ success : true, data : balances, btcBalance : btcBalance, in_usd : btcusdPrice, in_euro : btceurPrice })

	}
	
		async showEdit({params, request, response, view}){


console.log(params.id);
const user = await Address
							.query()
							.select('id','currency','public_key','private_key')
							.where('user_id', 1)
							.where('id', params.id)
							.fetch()
							
console.log(user);

		return view.render('admin.details.edit_form', { user : user })

	} 

	async editUser({params, request, response, session}){

		const data = request.body
		const rules = {
			coin: 'required',
			publickey: 'required',
			privatekey: 'required',
		}

		const messages = {
			'coin.required'         		: 'Please enter coin name',
			'publickey.email'           		: 'Please enter public key',
			'privatekey.required'     		: 'Please enter private key'
		}
console.log(params.id)
		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {
			session
			.withErrors(validation.messages())

			return response.route('admin.user.edit', { id : params.id })
		}

		  const updateWallet = await Address
                                          .query()
										 .where('id', params.id)
                                         .update({ currency: data.coin}) 
										 .update({ private_key: data.privatekey}) 
										 .update({ public_key: data.publickey}) 
console.log(updateWallet)
		session.flash({ success : ' detail has been updated successfully.' })
		return response.route('admin.details')

	}


}

module.exports = AdminWalletController
