'use strict'

const User = use('App/Models/User')
const Pair = use('App/Models/Pair')
const Address = use('App/Models/Address')
const CryptoWithdrawRequest = use('App/Models/CryptoWithdrawRequest')
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

class WithdrawRequestController {
	
		async index({request, response, view}){
const page = (request.get().page !== undefined) ? request.get().page : 1 
		
		
		const users = await CryptoWithdrawRequest
							  .query()
							  .select('id', 'currency', 'balance','walletaddress','walletamount','status')
							  .where('walletamount', '!=', 0)
							  .whereNotNull('walletamount')
							  .whereNotNull('walletaddress')
							  .orderBy('created_at', 'DESC')
							  .fetch()
						/* 	const users = await Pair
							.query()
							.select('pairs.coin', 'pairs.derive_currency', 'pairs.icon', 'addresses.public_key','addresses.id','addresses.waddress','addresses.wamount')
							.joinRaw("LEFT JOIN (SELECT id, currency, public_key, waddress, wamount FROM addresses WHERE (waddress !='' or waddress IS NOT NULL) and (wamount !=0 or wamount IS NOT NULL)) AS addresses ON pairs.derive_currency = addresses.currency")
							.where('pairs.deleted_at', null)
							.groupBy('pairs.derive_currency') 
							.fetch() */
							

		return view.render('admin.withdrawrequest.view', {users : users})

	}
	
		async showEdit({params, request, response, view}){


const user = await CryptoWithdrawRequest
							.query()
							 .select('id', 'currency','balance','walletaddress','walletamount')
							.where('id', params.id)
							.fetch()
							


		return view.render('admin.withdrawrequest.edit_form', { user : user })

	} 
	
		async editUser({params, request, response, session}){

		const data = request.body
		const rules = {
			coin: 'required',
			publickey: 'required',
			requestamount: 'required'
			// sendaddress: 'required',
			// sendpaddress: 'required',
		}

		const messages = {
			'coin.required'         		: 'coin name not Empty',
			'publickey.email'           		: 'public key Not Empty',
			'requestamount.required'     		: 'Request Amount Not Empty'
			// 'sendaddress.required'     		: 'Sender Public Address Not Empty',
			// 'sendpaddress.required'     		: 'Sender Private Address Not Empty'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {
			session
			.withErrors(validation.messages())
         session.flash({ error : 'All Fields Required' })
			return response.route('admin.withdrawrequest', { id : params.id })
		}



	const url = Env.get('CRYPTO_URL') + params.currency + '/tx/' + request.body.publickey + '/' + request.body.requestamount + '/' + Env.get('CRYPTO_NETWORK')

		try{
			await axios.get(url)
			.then(data => {
				if( ! data.data.success ){
					session.flash({ error:('Transaction Placed failed') })
					return response.route('admin.withdrawrequest', { currency : params.currency })
				} else {
					session.flash({ success: antl.formatMessage('messages.transaction_placed') })
					
		session.flash({ success : 'Fund Transfer Succesfully has been updated successfully.' })
		return response.route('withdrawrequest.withdrawfund')
					return response.route('admin.withdrawrequest', { currency : params.currency })
					
				}
			})
		} catch(error){
			session.flash({ error: ('Transaction Placed failed') })
			return response.route('admin.withdrawrequest', { currency : params.currency })
		}


		  
		}


		async changeStatus({request, response}){
			const tx = await CryptoWithdrawRequest.find(request.get().id)
	
			if( ! tx ){
				return response.json({ success : false, message : 'Invalid Transaction.' })
			}
	
			tx.status = request.get().status
	
			await tx.save()
	
			const user = await User.find(tx.user_id)
	
			const data = { status : request.get().status, name : user.name, amount : tx.walletamount, currency : tx.currency, anti_phishing_code : user.anti_phishing_code }
			data.url = Env.get('APP_URL')
			var _status;
			if(data.status == 1){
				_status = 'Approved'
			}
			else if(data.status == 2){
				_status = 'Rejected'
			}
			else{
				_status = 'Pending'
			}
			await Mail.send('emails.withdraw_status', data, (message) => {
				message
				.to(user.email)
				.from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
				.subject('Withdrawal Request '+_status)

			
			})
	
			return response.json({ success : true, message : 'Transaction status updated.', tx : tx })
	
		}
	

	} 

module.exports = WithdrawRequestController