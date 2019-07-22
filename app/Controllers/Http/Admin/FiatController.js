'use strict'

const Transaction    = use('App/Models/Transaction')
const Mail          = use('Mail')
const User          = use('App/Models/User')
const Env           = use('Env')

class FiatController {

	async deposits({ params, request, view }) {

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const txs = await Transaction
							.query()
							.select('users.name', 'users.email', 'users.mobile', 'transactions.amount', 'transactions.created_at')
							.leftJoin('users', 'transactions.user_id', 'users.id')
							.where('users.deleted_at', null)
							.where('transactions.currency', params.currency)
							.where('transactions.tx_type', 1)
							.paginate(page)

		return view.render('admin.fiat.deposits', { txs : txs })

	}

	async withdrawals({ params, request, view }) {

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const txs = await Transaction
							.query()
							.select('transactions.*', 'users.name', 'users.email')
							.leftJoin('users', 'transactions.user_id', 'users.id')
							.where('users.deleted_at', null)
							.where('transactions.currency', params.currency)
							.where('transactions.tx_type', 0)
							.paginate(page)

		return view.render('admin.fiat.withdrawals', { txs : txs })

	}

	async changeStatus({request, response}){

		const tx = await Transaction.find(request.get().id)

		if( ! tx ){
			return response.json({ success : false, message : 'Invalid Transaction.' })
		}

		tx.status = request.get().status

		await tx.save()

		const user = await User.find(tx.user_id)

		const data = { status : request.get().status, name : user.name, amount : tx.amount, currency : tx.currency, anti_phishing_code : user.anti_phishing_code }

		await Mail.send('emails.withdraw_status', data, (message) => {
			message
			.to(user.email)
			.from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
			.subject('Withdrawal Request')
		})

		return response.json({ success : true, message : 'Transaction status updated.', tx : tx })

	}

}

module.exports = FiatController
