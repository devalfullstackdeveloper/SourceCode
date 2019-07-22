'use strict'

const Pair = use('App/Models/Pair')
const { validate } = use('Validator')

class PairController {

	async index({request, view}){

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const pairs = await Pair
							.query()
							.select('id', 'coin', 'pair_name', 'pair_key', 'base_currency', 'custom_amount', 'icon', 'status')
							.where('deleted_at', null).orderBy('id', 'desc') 
							.fetch()

		return view.render('admin.pairs.list', {pairs : pairs})

	}

	async changeStatus({request, response}){

		const pair = await Pair.find(request.get().id)

		if( ! pair ){
			return response.json({ success : false, message : 'Invalid pair.' })
		}

		pair.status = request.get().status

		await pair.save()

		return response.json({ success : true, message : 'Pair status updated.', pair : pair })

	}

	async remove({request, response}){

		const pair = await Pair.find(request.get().id)

		if( ! pair ){
			return response.json({ success : false, message : 'Invalid pair.' })
		}

		pair.deleted_at = new Date()

		await pair.save()

		return response.json({ success : true, message : 'Pair has been removed.' })

	}

	async showNew({view}){
		return view.render('admin.pairs.new_form')
	}

	async addNew({request, response, view, session}){

		const rules = {
			coin 			: 'required',
			pair_name 		: 'required',
			base_currency 	: 'required',
			custom_amount 	: 'required',
			alt 	: 'required',
			is_token 		: 'required'
		}

		const messages = {
			'coin.required' 			: 'Coin name is required',
			'pair_name.required' 		: 'Pair name is required',
			'base_currency.required' 	: 'Base currency is required',
			'custom_amount.required' 	: 'Custom amount is required',
			'alt.required' 	: 'Alternative information amount is required',
			'is_token:required' 		: 'Is token required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.pair.new')
		}

		if(!request.file('icon')){
			session.flash({ error : 'Please choose currency icon.' })
			return response.route('admin.pair.new')
		}

		const icon = request.file('icon', {
			types: ['image'],
			size: '2mb'
		})

		const newName = new Date().getTime() + '.' + icon.subtype

		await icon.move('public/images/coins', {
			name: newName,
			overwrite: true
		})

		if (!icon.moved()) {
			session.flash({ error : icon.error() })
			return response.route('admin.pair.new')
		}

		const pair = new Pair()

		pair.coin 				= request.body.coin
		pair.pair_name 			= (request.body.pair_name + '/' + request.body.base_currency).toUpperCase()
		pair.pair_key 			= (request.body.pair_name + request.body.base_currency).toLowerCase()
		pair.base_currency 		= request.body.base_currency
		pair.derive_currency 	= (request.body.pair_name).toLowerCase()
		pair.custom_amount 		= request.body.custom_amount
		pair.is_token 			= request.body.is_token
		pair.alt 			= request.body.alt
		pair.icon 				= newName

		await pair.save()

		session.flash({ success : 'Pair has been added successfully.' })

		return response.route('admin.pair.new')
		
	}

	async showEdit({params, response, view}){

		const pair = await Pair.find(params.id)

		return view.render('admin.pairs.edit_form', {pair : pair})

	}

	async edit({params, request, response, view, session}){

		const rules = {
			coin 			: 'required',
			pair_name 		: 'required',
			base_currency 	: 'required',
			custom_amount 	: 'required',
			alt 	: 'required',
			is_token 		: 'required'
		}

		const messages = {
			'coin.required' 			: 'Coin name is required',
			'pair_name.required' 		: 'Pair name is required',
			'base_currency.required' 	: 'Base currency is required',
			'custom_amount.required' 	: 'Custom amount is required',
			'alt.required' 	: 'Alternative information is required',
			'is_token:required' 		: 'Is token required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.pairs')
		}

		const pair = await Pair.find(params.id)

		if( request.file('icon') ){

			const icon = request.file('icon', {
				types: ['image'],
				size: '2mb'
			})

			const newName = new Date().getTime() + '.' + icon.subtype

			await icon.move('public/images/coins', {
				name: newName,
				overwrite: true
			})

			if (!icon.moved()) {
				session.flash({ error : icon.error() })
				return response.route('admin.pairs')
			}

			pair.icon = newName

		}

		pair.coin 				= request.body.coin
		pair.pair_name 			= (request.body.pair_name + '/' + request.body.base_currency).toUpperCase()
		pair.pair_key 			= (request.body.pair_name + request.body.base_currency).toLowerCase()
		pair.base_currency 		= request.body.base_currency
		pair.derive_currency 	= (request.body.pair_name).toLowerCase()
		pair.custom_amount 		= request.body.custom_amount
		pair.alt 		= request.body.alt
		pair.is_token 			= request.body.is_token

		await pair.save()

		session.flash({ success : 'Pair has been edited successfully.' })

		return response.route('admin.pairs')
		
	}

}

module.exports = PairController
