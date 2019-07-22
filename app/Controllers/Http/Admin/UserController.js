'use strict'

const Env = use('Env')
const Mail = use('Mail')
const Hash = use('Hash')
const axios = use('axios')
const Kyc = use('App/Models/Kyc')
const User = use('App/Models/User')
const Pair = use('App/Models/Pair')
const Order = use('App/Models/Order')
const { validate } = use('Validator')
const Address = use('App/Models/Address')
const CryptoWithdrawRequest = use('App/Models/CryptoWithdrawRequest')
const AddressKyc = use('App/Models/AddressKyc')
const Transaction  = use('App/Models/Transaction')
const PersonalInfo = use('App/Models/PersonalInfo')

class UserController {

	async index({request, response, view}) {

		const page = (request.get().page !== undefined) ? request.get().page : 1 
		const users = await User
							.query()
							.select('users.id', 'users.name', 'users.email', 'users.mobile', 'users.status', 'kycs.status AS kyc_status', 'address_kycs.status AS address_kyc_status')
							.leftJoin('kycs', 'kycs.user_id', 'users.id')
							.leftJoin('address_kycs', 'address_kycs.user_id', 'users.id')
							.where('users.deleted_at', null)
							.where('users.is_admin', 0)
							.orderBy('id', 'desc')
							.fetch()
							
		return view.render('admin.users.list', {users : users})
	}

	async changeStatus({request, response}) {

		const user = await User.find(request.get().id)

		if( ! user ){
			return response.json({ success : false, message : 'Invalid user.' })
		}

		user.status = request.get().status
		await user.save()

		return response.json({ success : true, message : 'User status updated.', user : user })
	}

	async remove({request, response}) {

		const user = await User.find(request.get().id)

		if( ! user ){
			return response.json({ success : false, message : 'Invalid user.' })
		}

		await user.delete()

		return response.json({ success : true, message : 'User has been removed.' })
	}

	async viewDetail({params, request, response, view}) {

		const user = await User.find(params.id)

		if( ! user ){
			return response.route('admin.users')
		}

		const histories = await Order
							  .query()
							  .select('price', 'fees', 'amount', 'total', 'pair', 'order_type', 'status', 'created_at')
							  .where('user_id', params.id)
							  .where('status', 1)
							  .fetch()

		const opens = await Order
							.query()
							.select('price', 'fees', 'amount', 'remain', 'total', 'pair', 'order_type', 'status', 'created_at')
							.where('user_id', params.id)
							.where('status', 0)
							.fetch()

		const depositeTxs = await Transaction
							.query()
							.select('amount', 'currency', 'created_at')
							.where('user_id', params.id)
							.where('tx_type', 1)
							.fetch()

		const withdrawTxs = await Transaction
							.query()
							.where('user_id', params.id)
							.where('tx_type', 0)
							.fetch()

		const cryptoWithdrawRequestByUserId = await CryptoWithdrawRequest
							.query()
							.where('user_id', params.id)
							.where('walletamount', '!=', 0)
							.whereNotNull('walletamount')
							.whereNotNull('walletaddress')
							.orderBy('created_at', 'DESC')
							.fetch()

		const userBalances = await Address
							.query()
							.where('user_id', params.id)
							.fetch()
							
		const pairs = await Pair
							.query()
							.select('pairs.coin', 'pairs.derive_currency', 'pairs.icon', 'addresses.id')
							.joinRaw("LEFT JOIN (SELECT id ,currency FROM addresses WHERE user_id=" + params.id + ") AS addresses ON pairs.derive_currency = addresses.currency")
							.where('pairs.deleted_at', null)
							.whereIn('pairs.derive_currency', ['btc','eth','xrp','bab','ltc','eos','xlm','trx','xmr','trx','dsh','iot','neo','etc'])
							.groupBy('pairs.derive_currency')
							.fetch()

		return view.render('admin.users.view', { 
			user : user, 
			histories : histories, 
			opens : opens, 
			depositeTxs : depositeTxs, 
			withdrawTxs : withdrawTxs, 
			cryptoWithdrawRequestByUserId: cryptoWithdrawRequestByUserId,
			pairs : pairs,
			userBalances: userBalances
		})
	}
	
	async showNew({view,params}) {
		return view.render('admin.addressnew.new_form', {user_id: params.id})
	}

	async EditaNew({view,params}) {
		const requestcoin = await Address.find(params.id)
		return view.render('admin.addressnew.edit_form', {requestcoin: requestcoin })
	}

	async edNew({ request, response, auth, antl,params, session }) {
		
		const rules = {
            coin: 'required'
        }
		
		const messages = {
            'coin.required' : 'coin_name_required'
			
        }

		const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
			session.withErrors(validation.messages()).flashExcept()
			return response.route('admin.user.edita', { id: request.body.id_r })
		}
		
		const updateWallet = await Address
                                        .query()
                                        .where('id', request.body.id_r)
                                        .update({ currency: request.body.coin})
		
		return response.route('admin.user.view', { id: request.body.user_id })
	}

	async addNew({ request, response, auth, antl,params, session }){

		const rules = {
            coin: 'required'
        }

        const messages = {
            'coin.required' : 'coin_name_required'
			
        }

        const validation = await validate(request.all(), rules, messages)

      	if (validation.fails()) {
			session.withErrors(validation.messages()).flashExcept()
			return response.route('admin.user.new', { id: request.body.userid })
		}

		const requestcoin = new Address 

        requestcoin.currency = request.body.coin
		requestcoin.user_id = request.body.userid
      	await  requestcoin.save()

		return response.route('admin.user.view', { id: request.body.userid })
	}
	
	async balance({ response, request, params, antl }){

		const pairs = await Pair
							.query()
							.select('pairs.derive_currency')
							.leftJoin('addresses', 'pairs.derive_currency', 'addresses.currency')
							.where('pairs.deleted_at', null)
							.where('addresses.user_id', params.id)
							.groupBy('pairs.derive_currency')
							.fetch()

		const len = pairs.rows.length

		const address = {}

		for (var i = 0; i < len; i++) {
			address[pairs.rows[i].derive_currency] = pairs.rows[i]
		}

		const url = Env.get('CRYPTO_URL') + 'balance/' + JSON.stringify(address) + '/' + Env.get('CRYPTO_NETWORK')

		const balances = await axios.get( url )
		.then(data => {
			return data.data
		})
		.catch(err => {
			
		})

		var btcBalance = balances.btc.balance

		const currencies = await Pair
							.query()
							.select('derive_currency')
							.where('deleted_at', null)
							.where('derive_currency', '!=', 'btc')
							.groupBy('derive_currency')
							.fetch()

		for( var i=0; i < currencies.rows.length; i++ ) {

			var crrURL = 'https://api.binance.com/api/v3/ticker/price?symbol=' + (currencies.rows[i].derive_currency ).toUpperCase() + 'BTC'

			await axios.get( crrURL )
			.then(data => {
				if( balances[currencies.rows[i].derive_currency] ){
					btcBalance +=  ( balances[currencies.rows[i].derive_currency].balance ) * Number(data.data.price)
				}
			})
			.catch(err => {
				
			})
		}

		const btcusd = await axios.get( 'https://api.bitfinex.com/v1/pubticker/btcusd' ).then(data => { return data.data.last_price })
		const btceur = await axios.get( 'https://api.bitfinex.com/v1/pubticker/btceur' ).then(data => { return data.data.last_price })

		const btcusdPrice = btcBalance * Number( btcusd )
		const btceurPrice = btcBalance * Number( btceur )

		return response.json({ success : true, data : balances, btcBalance : btcBalance, in_usd : btcusdPrice, in_euro : btceurPrice })
	}

	async showEdit({params, request, response, view}){

		const user = await User.find(params.id)

		if( ! user ){
			session.flash({ error : 'User not found.' })
			return response.route('admin.users')
		}

		return view.render('admin.users.edit_form', { user : user })
	}

	async editUser({params, request, response, session}){

		const user = await User.find(params.id)

		if( ! user ){
			session.flash({ error : 'User not found.' })
			return response.route('admin.users')
		}

		const rules = {
			name: 'required',
			email: 'required|email',
			sms_auth: 'required',
			tfa_status: 'required'
		}

		const messages = {
			'name.required'         		: 'Please enter name',
			'email.email'           		: 'Please enter valid email',
			'email.required'        		: 'Please enter email',
			'sms_auth.required'     		: 'Please enter sms auth',
			'tfa_status.required'     		: 'Please enter 2fa status'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {
			session
			.withErrors(validation.messages())

			return response.route('admin.user.edit', { id : user.id })
		}

		user.name = request.body.name
		user.email = request.body.email
		user.mobile = request.body.mobile
		user.anti_phishing_code = request.body.anti_phishing_code
		user.sms_auth = request.body.sms_auth
		user.tfa_status = request.body.tfa_status

		await user.save()

		session.flash({ success : 'Users detail has been updated successfully.' })
		return response.route('admin.users')

	}

	async updatePassword({ params, request, response, session }){

		const user = await User.find(params.id)

		if( ! user ){
			session.flash({ error : 'User not found.' })
			return response.route('admin.users')
		}

		const rules = {
            password: 'required|confirmed'
		}

		const messages = {
            'password.required'     : "Please enter password",
            'password.confirmed'	: "Password not match"
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {
			session
			.withErrors(validation.messages())

			return response.route('admin.user.edit', { id : user.id })
		}

		user.password = await Hash.make(request.input("password"))

		await user.save()

		session.flash({ success : 'Users password has been updated successfully.' })
		return response.route('admin.users')
	}

	async kyc({params, view}){

		const kyc = await Kyc.findBy('user_id', params.id)
		const info = await PersonalInfo.findBy('user_id', params.id)

		return view.render('admin.users.kyc', { info : info, kyc : kyc })
	}

	async kycStatus({ params, request, response }){

		const kyc = await Kyc.findBy('user_id', request.get().user_id)

		if( ! kyc ){
			return response.json({ success : false, message : 'KYCs not found' })
		}

		kyc.status = request.get().status

		const result = await kyc.save()

		var user = await User.find(request.get().user_id)

		user.level = 1
		var mailTemplate = 'emails.kyc_rejected'
		var mailSubject = 'KYC Rejected'

		if( request.get().status == 1 ){
			user.level = 2
			mailTemplate = 'emails.kyc_approved'
			mailSubject = 'KYC Approved'
		}

		await user.save()

		user.url = Env.get('APP_URL')

        await Mail.send(mailTemplate, user.toJSON(), (message) => {
            message
            .to(user.email)
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject(mailSubject)
        })

		return response.json({ success : true, message : 'KYC status updated successfully' })
	}

	async addressKyc({params, view}){
		const kyc = await AddressKyc.findBy('user_id', params.id)

		return view.render('admin.users.address-kyc', { kyc : kyc })
	}

	async addressKycStatus({ params, request, response }){

		const kyc = await AddressKyc.findBy('user_id', request.get().user_id)

		if( ! kyc ){
			return response.json({ success : false, message : 'KYCs not found' })
		}

		kyc.status = request.get().status

		const result = await kyc.save()

		var user = await User.find(request.get().user_id)

		user.level = 2
		var mailTemplate = 'emails.kyc_rejected'
		var mailSubject = 'KYC Rejected'

		if( request.get().status == 1 ){
			user.level = 3
			mailTemplate = 'emails.kyc_approved'
			mailSubject = 'KYC Approved'
		}

		await user.save()

		user.url = Env.get('APP_URL')

        await Mail.send(mailTemplate, user.toJSON(), (message) => {
            message
            .to(user.email)
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject(mailSubject)
        })

		return response.json({ success : true, message : 'KYC status updated successfully' })
	}

	/**
	 * Update user balance based on user ID
	 * Update USD and EURO wallet balance
	 */
	async updateBalance({request, response}) {

		// Get user
		let user = await User.find(request.body.user)

		// If no user
		if( ! user ) {
			return response.json({success: false});
		}

		// update user balance based on type
		if( request.body.currency == 'usd' ) {
			user.usd_balance = Number(request.body.balance)
			await user.save()
		} else if( request.body.currency == 'euro' ) {
			user.euro_balance = Number(request.body.balance)
			await user.save()
		} else {
			const userBalance = await CryptoWithdrawRequest.findBy({
				user_id: user.id,
				currency: request.body.currency
			})

			if( !userBalance ) {
				return response.json({success: false});
			}

			userBalance.balance = Number(request.body.balance)
			await userBalance.save()

			await Address 
			.query()
			.where('currency', request.body.currency)
			.where('user_id', user.id)
			.update({
				balance: request.body.balance
			   })

		}

		return response.json({success: true})
	}
}

module.exports = UserController
