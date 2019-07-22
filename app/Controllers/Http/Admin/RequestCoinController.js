'use strict'

const Requestcoin = use('App/Models/RequestCoin')
const Mail          = use('Mail')
const Env           = use('Env')
const Hash = use('Hash')

class RequestCoinController {  

	async index({request, response, view}){
const page = (request.get().page !== undefined) ? request.get().page : 1 
		const requestcoin = await Requestcoin
							.query().with('user')
							.orderBy('id', 'desc')
							.paginate(page)
							

		return view.render('admin.requestcoin.list', {requestcoins : requestcoin.toJSON()})

	} 

	 async changeStatus({request, response}){

		const requestcoin = await Requestcoin.find(request.get().id)

		if( ! requestcoin ){
			return response.json({ success : false, message : 'Invalid Requestcoin.' })
		}

		requestcoin.status = request.get().status

		await requestcoin.save()

		return response.json({ success : true, message : 'Requestcoin status updated.', requestcoin : requestcoin })

	}

	async remove({request, response}){

		const requestcoin = await Requestcoin.find(request.get().id) 

		if( ! requestcoin ){
			return response.json({ success : false, message : 'Invalid Requestcoin.' })
		}

		await requestcoin.delete()

		return response.json({ success : true, message : 'Requestcoin has been removed.' })

	}
    async viewDetail({params, request, response, view}){
                         console.log(params.id)

							const requestcoin = await Requestcoin
							.query().with('user')
							.where('id', params.id)
							.first() 
							console.log(requestcoin)
	return view.render('admin.requestcoin.view', {requestcoins : requestcoin})
	}
/*	async viewDetail({params, request, response, view}){

		const user = await User.find(params.id)

		if( ! user ){
			return response.route('admin.users')
		}

		const histories = await Order
							  .query()
							  .select('price', 'amount', 'total', 'pair', 'order_type', 'status', 'created_at')
							  .where('user_id', params.id)
							  .where('status', 1)
							  .fetch()

		const opens = await Order
							.query()
							.select('price', 'amount', 'remain', 'total', 'pair', 'order_type', 'status', 'created_at')
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

		return view.render('admin.users.view', { user : user, histories : histories, opens : opens, depositeTxs : depositeTxs, withdrawTxs : withdrawTxs })

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

	} */

}

module.exports = RequestCoinController
