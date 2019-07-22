'use strict'

const WhoWeAre = use('App/Models/WhoWeAre')
const { validate } = use('Validator')

class WhoWeAreController {

	async index({ request, view }) {

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const data = {}

		data.whoweares = await WhoWeAre
		.query()
		.select('id', 'title', 'description', 'image')
		.where('deleted_at', null)
		.paginate(page)

		return view.render('admin.whoweare.list', data)

	}

	async showNew({ view }) {
		return view.render('admin.whoweare.new_form')
	}

	async addNew({ request, response, session }) {

		if(!request.file('image')){
			session.flash({ error : 'Please select image.' })
			return response.route('admin.whoweare')
		}

		const image = request.file('image', {
			types: ['image'],
			size: '2mb'
		})

		const newName = new Date().getTime() + '.' + image.subtype

		await image.move('public/images/who-we-are', {
			name: newName,
			overwrite: true
		})

		if ( ! image.moved() ) {
			session.flash({ error : 'Failed to move image.' })
			return response.route('admin.whoweare')
		}

		const rules = {
			title : 'required',
			description 	: 'required'
		}

		const messages = {
			'title.required' : 'Question is required',
			'description.required' : 'Description is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
			.withErrors(validation.messages())
			.flashExcept()

			return response.route('admin.whoweare.new')
		}

		const whoweare = new WhoWeAre()

		whoweare.title = request.body.title
		whoweare.description = request.body.description
		whoweare.image = newName

		await whoweare.save()

		session.flash({ success : 'Added successfully.' })

		return response.route('admin.whoweare')

	}

	async showEdit({ params, view }) {

		const whoweare = await WhoWeAre.find(params.id)

		if( ! whoweare ){
			session.flash({ error : 'Not found.' })
		}

		return view.render('admin.whoweare.edit_form', { whoweare : whoweare })
	}

	async edit({ params, request, response, session }) {

		const rules = {
			title : 'required',
			description 	: 'required'
		}

		const messages = {
			'title.required' : 'Question is required',
			'description.required' : 'description is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
			.withErrors(validation.messages())
			.flashExcept()

			return response.route('admin.pair.new')
		}

		const whoweare = await WhoWeAre.find(params.id)

		if( ! whoweare ){
			session.flash({ error : 'Not found.' })
		}

		if(request.file('image')){

			const image = request.file('image', {
				types: ['image'],
				size: '2mb'
			})

			const newName = new Date().getTime() + '.' + image.subtype

			await image.move('public/images/who-we-are', {
				name: newName,
				overwrite: true
			})

			if ( ! image.moved() ) {
				session.flash({ error : 'Failed to move image.' })
				return response.route('admin.whoweare')
			}

			whoweare.image = newName

		}

		whoweare.title = request.body.title
		whoweare.description = request.body.description

		await whoweare.save()

		session.flash({ success : 'Updated successfully.' })

		return response.route('admin.whoweare')

	}

	async remove({ request, response }){

		const whoweare = await WhoWeAre.find(request.get().id)

		if( ! whoweare ){
			return response.json({ success : false, message : 'Invalid.' })
		}

		whoweare.deleted_at = new Date()

		await whoweare.save()

		return response.json({ success : true, message : 'Removed successfully.' })

	}

}

module.exports = WhoWeAreController
