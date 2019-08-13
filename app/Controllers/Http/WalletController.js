'use strict'

const Env = use('Env')
const Mail = use('Mail')
const axios = use('axios')
const Pair = use('App/Models/Pair')
const Order = use('App/Models/Order')
const { validate } = use('Validator')
const Address = use('App/Models/Address')
const CryptoWithdrawRequest = use('App/Models/CryptoWithdrawRequest')
const Transaction = use('App/Models/Transaction')
const PersonalInfo = use('App/Models/PersonalInfo')
const DepositWallet = use('App/Models/DepositWallet')
const WithdrawLimit = use('App/Models/WithdrawLimit')
const DepositRequest = use('App/Models/DepositRequest')

class WalletController {

	async wallets({ view, auth }) {


		const pairs = await Pair
							.query()
							.select('pairs.coin', 'pairs.pair_name','pairs.derive_currency', 'pairs.icon', 'addresses.public_key', 'addresses.balance')
							.joinRaw("LEFT JOIN (SELECT currency, public_key, balance FROM addresses WHERE user_id=" + auth.user.id + ") AS addresses ON pairs.derive_currency = addresses.currency")
							.where('pairs.deleted_at', null)
							.whereNotIn('pairs.derive_currency', ['btc','eth','xrp','bab','ltc','eos','xlm','trx','xmr','dsh','iot','neo','etc'])
							.groupBy('pairs.derive_currency', 'pairs.coin','pairs.pair_name','pairs.icon','addresses.public_key','addresses.balance')
							.fetch()


    	const pairsw = await Pair
							.query()
							.select('pairs.coin','pairs.pair_name', 'pairs.derive_currency', 'pairs.icon', 'addresses.public_key', 'addresses.balance')
							.joinRaw("LEFT JOIN (SELECT currency, public_key, balance FROM addresses WHERE user_id=" + auth.user.id + ") AS addresses ON pairs.derive_currency = addresses.currency")
							.where('pairs.deleted_at', null)
							.whereIn('pairs.derive_currency', ['btc','eth','xrp','bab','ltc','eos','xlm','trx','xmr','dsh','iot','neo','etc'])
							.groupBy('pairs.derive_currency','pairs.coin','pairs.pair_name', 'pairs.coin','pairs.icon','addresses.public_key','addresses.balance')
							.fetch()

		const personalInfo = await PersonalInfo.query().where('user_id', auth.user.id).where('deleted_at', null).first()
		const deposit_url = Env.get('DEPOSIT_URL')
		const seller_id = Env.get('SELLER_ID')
		const return_url = Env.get('RETURN_URL')

		function removeDuplicates(myArr, prop) {
			return myArr.filter((obj, pos, arr) => {
				return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
			});
		}
		var pairs_unique = removeDuplicates(pairs.rows, "derive_currency")
		var pairsw_unique = removeDuplicates(pairsw.rows, "derive_currency")
		
		return view.render('wallets.wallets', { 
			pairs : pairs_unique,
			pairsw : pairsw_unique,
			personalInfo : personalInfo,
			deposit_url : deposit_url,
			seller_id : seller_id,
			return_url : return_url
		})
	}

	async deposit({ params, view, auth, session, response }){
		const pairs = await Pair
							.query()
							.select('pairs.coin', 'pairs.derive_currency')
							.where('pairs.deleted_at', null)
							.groupBy('pairs.derive_currency','pairs.coin')
							.fetch()

		const address = await Address
							  .query()
							  .select('public_key', 'balance')
							  .where('currency', params.currency)
							  .where('user_id', auth.user.id)
							  .first()

		const depositWallet = await DepositWallet.findBy({
			currency: params.currency
		})

		if( ! depositWallet ) {
			session.flash({error: 'Sorry Not Wallet Address Available For Deposit Now.'})
            return response.route('back')
		}

		if( address == null ) {
			session.flash({ error: 'You do not have any wallet activated.' })
			return response.route('wallets', {currency : params.currency })
		}

		const balance = { available : address.balance, inOrder : 0, total : 0 }

		// const url = Env.get('CRYPTO_URL') + params.currency + '/balance/' + address.public_key + '/' + Env.get('CRYPTO_NETWORK')

		// try{
		// 	await axios.get( url )
		// 	.then(data => {
		// 		balance.available = data.data.balance
		// 	})
		// 	.catch(err => {

		// 	})
		// } catch(error){

		// }

		const order = await Order
							.query()
							.sum('remain AS inOrder')
							.where('status', 0)
							.where('user_id', auth.user.id)
							.where('pair', 'like', params.currency + '%' )
							.first()

		balance.inOrder = ( order.inOrder ) ? order.inOrder : 0
		balance.total = balance.inOrder + balance.available

		const orders = await Order
							.query()
							.select('price', 'amount', 'order_type', 'status', 'created_at')
							.where('status', '!=', 2)
							.where('user_id', auth.user.id)
							.where('pair', 'like', params.currency + '%' )
							.fetch()
		return view.render('wallets.deposit', { 
			pairs 		: pairs,
			currency 	: params.currency,
			balance 	: balance,
			address 	: address.public_key,
			orders		: orders,
			depositWallet: depositWallet
		})

	}

	async withdraw({ params, request, response, view, auth,session }){
		const pairs = await Pair
							.query()
							.select('pairs.coin', 'pairs.derive_currency')
							.where('pairs.deleted_at', null)
							.groupBy('pairs.derive_currency','pairs.coin')
							.fetch()

		const address = await Address
							  .query()
							  .select('balance')
							  .where('currency', params.currency)
							  .where('user_id', auth.user.id)
							  .first()

							 
		const balance = { available : address.balance, inOrder : 0, total : 0 }
		
		if( address == null ) {
			session.flash({ error: 'You do not have any wallet activated.' })
			return response.route('wallets', {currency : params.currency })
		}
		
		const url = Env.get('CRYPTO_URL') + params.currency + '/balance/' + address.public_key + '/' + Env.get('CRYPTO_NETWORK')

		try{
			await axios.get( url )
			.then(data => {
				balance.available = data.data.balance + address.balance
			})
		} catch(error){
		}

		const order = await Order
							.query()
							.sum('remain AS inOrder')
							.where('status', 0)
							.where('user_id', auth.user.id)
							.where('pair', 'like', params.currency + '%' )
							.first()

		balance.inOrder = ( order.inOrder ) ? order.inOrder : 0
		balance.total = balance.inOrder + balance.available

		const orders = await Order
							.query()
							.select('price', 'amount', 'order_type', 'status', 'created_at')
							.where('status', '!=', 2)
							.where('user_id', auth.user.id)
							.where('pair', 'like', params.currency + '%' )
							.fetch()

		return view.render('wallets.withdraw', { 
			pairs 		: pairs,
			currency 	: params.currency,
			balance 	: balance,
			orders		: orders
		})
	}

	async withdrawTx({ params, request, response, antl, session, auth }) {

		// Set validation rules
        const rules = {
            address: 'required',
            amount: 'required'
        }

        // Set validation messages
        const messages = {
            'address.required': antl.formatMessage('messages.address_required'),
            'amount.required': antl.formatMessage('messages.amount_required')
        }

        // Initializing validation to run test
        const validation = await validate(request.all(), rules, messages)

        // If validation fails
        if (validation.fails()) {
            session.withErrors(validation.messages())
            return response.route('withdraw', { currency : params.currency })
		}

		const _cryptoWithdrawRequest = await CryptoWithdrawRequest
							  .query()
							  .select('user_id', 'walletaddress','walletamount','balance', 'status', 'currency')
							  .where('status', 0)
							  .where('user_id', auth.user.id)	
							  .first()						

		// Check for enough balance to be exist for withdraw
	

		// If already withdraw amount is there pending request
		if( _cryptoWithdrawRequest!=null) {
			session.flash({ error:'Previous Withdrawal Request is Pending' })
			return response.route('withdraw', { currency : params.currency })
		}
		
		// check address contains ammount or not
		const _address=await Address.query().select('user_id','balance').where('user_id', auth.user.id).where('currency',params.currency) .first()

		if( Number(_address.balance) < Number(request.body.amount) ) {
			session.flash({ error: 'You do not have enough balance to withdraw.' })
			return response.route('withdraw', {currency : params.currency })
		}

        // Get currency wallet
		

		// If currency is BTC
		// We need to check for withdraw limits
		// As per the user levels
		if( params.currency == 'btc' ) {

			// Get withdraw limits
			var withdrawLimits = await WithdrawLimit.findBy({
				currency: 'btc'
			})

			// If withdraw limits exists
			if( withdrawLimits ) {

				withdrawLimits = withdrawLimits.toJSON()
				const userLevel = auth.user.level;

				// Check for level once withdraw limit
				if( userLevel == 1 && (Number(request.body.amount) > Number(withdrawLimits.level_one)) ) {
					session.flash({ error: 'Level 1 user can withdraw only '+withdrawLimits.level_one+' BTC.' })
					return response.route('withdraw', {currency : params.currency })
				}

				// Check for level two withdraw limit
				if( userLevel == 2 && (Number(request.body.amount) > Number(withdrawLimits.level_two)) ) {
					session.flash({ error: 'Level 2 user can withdraw only '+withdrawLimits.level_two+' BTC.' })
					return response.route('withdraw', {currency : params.currency })
				}

				// Check for level three withdraw limit
				if( userLevel == 3 && (Number(request.body.amount) > Number(withdrawLimits.level_three)) ) {
					session.flash({ error: 'Level 3 user can withdraw only '+withdrawLimits.level_three+' BTC.' })
					return response.route('withdraw', {currency : params.currency })
				}
			}
		}

		const updatedBalance = Number(_address.balance) - Number(request.body.amount)

		await Address 
		.query()
		.where('currency', params.currency)
		.where('user_id', auth.user.id)
		.update({
			balance: updatedBalance
		   })

		await CryptoWithdrawRequest 
	            .query()
	            .where('currency', params.currency)
	            .where('user_id', auth.user.id)
	            .insert({
					user_id: auth.user.id,
					currency: params.currency,
					balance: updatedBalance,
	            	walletaddress: request.body.address,
	            	walletamount: request.body.amount,
					status: 0
				   })
				   const user= auth.user;
				   const mailData = { name : user.name, type_tx:'Wallet', address_bank : 'Wallet address: '+ request.body.address , amount : request.body.amount, currency : params.currency, anti_phishing_code : user.anti_phishing_code }
				   mailData.url = Env.get('APP_URL')
				   await Mail.send('emails.withdraw_request', mailData, (message) => {
				   message
				   .to(user.email)
				   .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
				   .subject('Withdrawal Request')
				   })
				   await Mail.send('emails.withdraw_request_admin', mailData, (message) => {
				   message
				   .to('admin@zithex.com')
				   .cc('support@zithex.com')
				   .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
				   .subject('Withdrawal Request')
				   })		 
		session.flash({ success: antl.formatMessage('messages.transaction_placed') })
		return response.route('withdraw', { currency : params.currency })
		
	}

	async create({ request, response, auth, antl }){

		const user = await auth.getUser()

		if( ! user ){
			return response.json({ 
				success : false, 
				message : antl.formatMessage('messages.user_not_found') 
			})
		}

		await CryptoWithdrawRequest.create({
			user_id: user.id,
			currency: request.body.ocurrency
		})

		await Address.create({
			user_id: user.id,
			currency: request.body.ocurrency
		})

		return response.json({ 
			success : true, 
			message : antl.formatMessage('messages.wallet_created') 
		})

		//const address = await new Address()
		// const url = Env.get('CRYPTO_URL') + request.body.currency + '/address/' + Env.get('CRYPTO_NETWORK')

		// try{
		// 	await axios.get( url )
		// 	.then(addressData => {
		// 		address.user_id		= user.id
		// 		address.currency	= request.body.ocurrency
		// 		address.public_key 	= addressData.data.address
		// 		address.private_key = addressData.data.private_key 

		// 		address.save()

		// 		return response.json({ 
		// 			success : true, 
		// 			message : antl.formatMessage('messages.wallet_created') 
		// 		})
		// 	})
		// } catch(error){ 
		// 	return response.json({ 
		// 		success : false, 
		// 		message : antl.formatMessage('messages.wallet_creation_failed') 
		// 	})			
		// }

	}

	async balance({ response, auth, antl }){

		// const user = await auth.getUser()

		// const pairs = await Pair
		// 					.query()
		// 					.select('pairs.derive_currency', 'addresses.public_key')
		// 					.leftJoin('addresses', 'pairs.derive_currency', 'addresses.currency')
		// 					.where('pairs.deleted_at', null)
		// 					.where('addresses.user_id', user.id)
		// 					.groupBy('pairs.derive_currency')
		// 					.fetch()

		// const len = pairs.rows.length

		// const addresses = {}

		// for (var i = 0; i < len; i++) {
		// 	addresses[pairs.rows[i].derive_currency] = pairs.rows[i].public_key
		// }

		// const url = Env.get('CRYPTO_URL') + 'balance/' + JSON.stringify(addresses) + '/' + Env.get('CRYPTO_NETWORK')

		// const balances = await axios.get( url )
		// .then(data => {
		// 	return data.data
		// })
		// .catch(err => {
		// })

		// var btcBalance = balances.btc.balance

		// const currencies = await Pair
		// 					.query()
		// 					.select('derive_currency')
		// 					.where('deleted_at', null)
		// 					.where('derive_currency', '!=', 'btc')
		// 					.groupBy('derive_currency')
		// 					.fetch()

		// for( var i=0; i < currencies.rows.length; i++ ){

		// 	var crrURL = 'https://api.binance.com/api/v3/ticker/price?symbol=' + (currencies.rows[i].derive_currency ).toUpperCase() + 'BTC'

		// 	await axios.get( crrURL )
		// 	.then(data => {
		// 		if( balances[currencies.rows[i].derive_currency] ){
		// 			btcBalance +=  ( balances[currencies.rows[i].derive_currency].balance ) * Number(data.data.price)
		// 		}
		// 	})
		// 	.catch(err => {
		// 	})
		// }

		const btcusd = await axios.get( 'https://api.bitfinex.com/v1/pubticker/btcusd' ).then(data => { return data.data.last_price })
		const btceur = await axios.get( 'https://api.bitfinex.com/v1/pubticker/btceur' ).then(data => { return data.data.last_price })

		let btcBalance = 1
		const btcusdPrice = 1 * Number( btcusd )
		const btceurPrice = 1 * Number( btceur )

		return response.json({ 
			success : true, 
			// data : balances, 
			btcBalance : btcBalance, 
			in_usd : btcusdPrice, 
			in_euro : btceurPrice 
		})
	}

	async payment({ params, request, response, auth, antl, session }) {

		const user = await auth.getUser()

		const amount = parseFloat(request.body.PAYMENT_AMOUNT)

		if( request.body.PAYMENT_UNITS == 'USD' ){
			user.usd_balance += amount
		} else if( request.body.PAYMENT_UNITS == 'EUR' ){
			user.euro_balance += amount
		}

		await user.save()

		const tx = new Transaction()

		tx.user_id = auth.user.id
		tx.currency = request.body.currency_code
		tx.tx_type = 1
		tx.amount = amount
		tx.status = 1
		await tx.save()

		const mailData = { 
			name : user.name, 
			amount : tx.amount, 
			currency : tx.currency, 
			anti_phishing_code : user.anti_phishing_code 
		}

		mailData.url = Env.get('APP_URL')

		await Mail.send('emails.deposit', mailData, (message) => {
			message
			.to(user.email)
			.from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
			.subject('Deposit Amout')
		})

		await Mail.send('emails.deposit_admin', mailData, (message) => {
			message
			.to('admin@zithex.com')
			.cc('support@zithex.com')
			.from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
			.subject('Deposit Amount')
		})

		session.flash({ success: antl.formatMessage('messages.payment_deposited') })

		return response.route('wallets')
	}

	async fiatWithdraw({ params, request, response, antl, session, auth }){

        const rules = {
            currency: 'required',
            bank_name: 'required',
            branch_name: 'required',
            ac_holder: 'required',
            ac_no: 'required',
            swift_code: 'required',
            iban_number: 'required',
            mobile: 'required',
            address: 'required',
            city: 'required',
            country: 'required',
            amount: 'required'
        }

        const messages = {
            'currency.required'		: antl.formatMessage('messages.currency_required'),
            'bank_name.required'	: antl.formatMessage('messages.bank_name_required'),
            'branch_name.required'	: antl.formatMessage('messages.branch_name_required'),
            'ac_holder.required'	: antl.formatMessage('messages.ac_holder_required'),
            'ac_no.required'		: antl.formatMessage('messages.ac_no_required'),
            'swift_code.required'	: antl.formatMessage('messages.swift_code_required'),
            'iban_number.required'	: antl.formatMessage('messages.iban_number_required'),
            'mobile.required'		: antl.formatMessage('messages.mobile_required'),
            'address.required'		: antl.formatMessage('messages.address_required'),
            'city.required'			: antl.formatMessage('messages.city_required'),
            'country.required'		: antl.formatMessage('messages.country_required'),
            'amount.required'		: antl.formatMessage('messages.amount_required')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            session.withErrors(validation.messages()).flashExcept([])
            return response.route('wallets')
        }

		const user = auth.user

		var availAmount = 0
		const amount = parseFloat( request.body.amount )

		if( request.body.currency == 'USD' ){
			availAmount = user.usd_balance
			user.usd_balance -= amount
		} else if( request.body.currency == 'EUR' ){
			availAmount = user.euro_balance
			user.euro_balance -= amount
		}

		if( availAmount <  amount){
			session.flash({ error : antl.formatMessage('messages.insufficient_withdraw') })
			return response.route('wallets')
		}

		const tx = new Transaction()

		tx.user_id = user.id
		tx.currency = request.body.currency
		tx.bank_name = request.body.bank_name
		tx.branch_name = request.body.branch_name
		tx.ac_holder = request.body.ac_holder
		tx.ac_no = request.body.ac_no
		tx.swift_code = request.body.swift_code
		tx.iban_number = request.body.iban_number
		tx.mobile = request.body.mobile
		tx.address = request.body.address
		tx.city = request.body.city
		tx.country = request.body.country
		tx.tx_type = 0
		tx.amount = amount
		tx.status = 0

		await tx.save()

		await user.save()
 
		const mailData = { name : user.name, type_tx:'Bank', address_bank : 'Bank: '+ request.body.bank_name, 
		branch_name : 'Branch Name: '+ request.body.branch_name, account_no: 'Account Number: '+ request.body.ac_no,
		ac_holder :'Account Holder: '+ request.body.ac_holder , swift_code :'SWIFT: '+ request.body.swift_code, iban_number : 'IBAN: '+request.body.iban_number,
		amount : tx.amount, currency : tx.currency, anti_phishing_code : user.anti_phishing_code }
		mailData.url = Env.get('APP_URL')

		await Mail.send('emails.withdraw_request', mailData, (message) => {
			message
			.to(user.email)
			.from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
			.subject('Withdrawal Request')
		})

		await Mail.send('emails.withdraw_request_admin', mailData, (message) => {
			message
			.to('admin@zithex.com')
			.cc('support@zithex.com')
			.from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
			.subject('Withdrawal Request')
		})

		session.flash({ success : antl.formatMessage('messages.withdraw_placed') })
		return response.route('wallets')
	}

	async USDHistory({ view, auth }) {

		const deposits = await Transaction
							.query()
							.where('user_id', auth.user.id)
							.where('tx_type', 1)
							.where('currency', 'USD')
							.fetch()

		const withdrawals = await Transaction
							.query()
							.where('user_id', auth.user.id)
							.where('tx_type', 0)
							.where('currency', 'USD').fetch()

		return view.render('wallets/usd-history', { 
			deposits : deposits, 
			withdrawals : withdrawals 
		})
	}

	async EURHistory({ view, auth }) {

		const deposits = await Transaction
								.query()
								.where('user_id', auth.user.id)
								.where('tx_type', 1)
								.where('currency', 'EUR')
								.fetch()

		const withdrawals = await Transaction
								.query()
								.where('user_id', auth.user.id)
								.where('tx_type', 0)
								.where('currency', 'EUR')
								.fetch()

		return view.render('wallets/euro-history', { 
			deposits : deposits, 
			withdrawals : withdrawals 
		})
	}

	async BTCHistory({ params, view, auth }){

		const orders = await Order
							.query()
							.select('price', 'amount', 'order_type', 'status', 'created_at')
							.where('status', '!=', 2)
							.where('user_id', auth.user.id)
							.where('pair', 'like', 'btc%' )
							.fetch()

		return view.render('wallets.btc-history', {
			orders		: orders
		})
	}

	/**
	 * Complete deposit send deposit request to admin
	 */
	async depositComplete({request, response, session, auth}) {

		const depositRequest = await DepositRequest.create({
			user_id: auth.user.id,
			currency: request.body.currency,
			amount: request.body.amount,
			hash: request.body.hash
		})

		const mailData = { name : auth.user.name,email :auth.user.email,  amount : request.body.amount, currency :  request.body.currency }
		mailData.url = Env.get('APP_URL')

		await Mail.send('emails.deposit_request', mailData, (message) => {
			message
			.to(auth.user.email)
			.from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
			.subject('Deposit Request')
		})

		await Mail.send('emails.deposit_admin', mailData, (message) => {
			message
			.to('admin@zithex.com')
			.cc('support@zithex.com')
			.from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
			.subject('Deposit Request')
		}) 

		session.flash({success: 'Your deposit request submitted once verified amount will be deposited to your wallet.'})
		return response.redirect('back')
	}
}

module.exports = WalletController
