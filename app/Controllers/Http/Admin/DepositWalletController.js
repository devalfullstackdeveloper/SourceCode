'use strict'

const DepositWallet = use('App/Models/DepositWallet')
const Pair = use('App/Models/Pair')
const { validate } = use('Validator')

class DepositWalletController {

	async index({ request, view }) {

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const data = {}

		data.deposits = await DepositWallet
							.query()
							.select('id', 'currency', 'address')
							.paginate(page)

		return view.render('admin.deposits.list', data)

	}

	async showNew({ view }) {
		const data = {}
		data.pairsw = await Pair
			.query()
			.select('pairs.derive_currency')
			.where('pairs.deleted_at', null)
			.groupBy('pairs.derive_currency')
			.fetch()
		return view.render('admin.deposits.new_form', data)
	}

	async addNew({ request, response, session }) {

		const rules = {
			currency : 'required',
			address  : 'required'
		}

		const messages = {
			'currency.required' : 'Currency is required',
			'address.required' : 'Address is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.deposits.new')
		}

		const deposit = new DepositWallet()

		deposit.currency = request.body.currency
		deposit.address = request.body.address

		await deposit.save()

		session.flash({ success : 'Deposite Wallet has been added successfully.' })

		return response.route('admin.deposits')

	}

	async showEdit({ params, view }) {

		const data = {}
		const deposit = await DepositWallet.find(params.id)

		if( ! deposit ){
			session.flash({ error : 'Deposit not found.' })
		}
		data.pairsw = await Pair
			.query()
			.select('pairs.derive_currency')
			.where('pairs.deleted_at', null)
			.groupBy('pairs.derive_currency')
			.fetch()
		data.deposit = 	deposit;
		return view.render('admin.deposits.edit_form', data)
	}

	async edit({ params, request, response, session }) {

		const rules = {
			currency : 'required',
			address  : 'required'
		}

		const messages = {
			'currency.required' : 'Currency is required',
			'address.required' : 'Address is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('deposits.pair.new')
		}

		const faq = await DepositWallet.find(params.id)

		if( ! faq ){
			session.flash({ error : 'Deposit not found.' })
		}

		faq.currency = request.body.currency
		faq.address = request.body.address

		await faq.save()

		session.flash({ success : 'Deposit has been updated successfully.' })

		return response.route('admin.deposits')

	}

	async remove({ request, response }){

		const deposit = await DepositWallet.find(request.get().id)

		if( ! deposit ){
			return response.json({ success : false, message : 'Invalid Deposit wallet.' })
		}

		await deposit.delete()

		return response.json({ success : true, message : 'Deposit has been removed.' })

	}

}

module.exports = DepositWalletController
