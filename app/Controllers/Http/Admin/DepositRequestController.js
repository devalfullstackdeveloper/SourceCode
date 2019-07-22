'use strict'

const { validate } = use('Validator')
const DepositRequest = use('App/Models/DepositRequest')
const User = use('App/Models/User')
const Address = use('App/Models/Address')
const Database = use('Database')

class DepositRequestController {

	async index({ request, view }) {

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const data = {}

		data.requests = await DepositRequest
							.query()
							.select('deposit_requests.id', 'deposit_requests.user_id', 'deposit_requests.currency', 'deposit_requests.amount', 'deposit_requests.hash', 'deposit_requests.status', Database.raw("users.name"))
							.innerJoin('users', 'users.id', 'deposit_requests.user_id')
							.orderBy('deposit_requests.status','ASC')
							.paginate(page)
							
		return view.render('admin.depositrequest.list', data)

	}

	async changestatus({ request, response }){

		const deposit = await DepositRequest.find(request.get().id)

		if( ! deposit ){
			return response.json({ success : false, message : 'Invalid Deposit Rrequest.' })
		}
		
		if( deposit.status == 1 ) {
		    return response.json({ success : false, message : 'Deposit Rrequest Already Verified.' })
		}
		
		if( deposit.status == 2 ) {
		    return response.json({ success : false, message : 'Deposit Rrequest Already Rejected.' })
		}
		
		if (request.get().status == 'Verified') {
			deposit.status = 1;
			const address = await Address.findBy({
				user_id:deposit.user_id,
				currency:deposit.currency
			})
			address.balance = address.balance + deposit.amount
			await address.save()
		}else{
			deposit.status = 2;
		}
		await deposit.save()

		return response.json({ success : true, message : 'Deposit Request '+request.get().status+' successfully!.' })

	}

}

module.exports = DepositRequestController