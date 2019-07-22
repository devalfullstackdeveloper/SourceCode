'use strict'

const Slider = use('App/Models/Slider')
const { validate } = use('Validator')

class SliderController {

	async index({request, view}){

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const sliders = await Slider
							.query()
							.select('id', 'title', 'subtitle','alt', 'image')
							.where('deleted_at', null)
							.paginate(page)

		return view.render('admin.sliders.list', {sliders : sliders})

	}

	async remove({request, response}){

		const slider = await Slider.find(request.get().id)

		if( ! slider ){
			return response.json({ success : false, message : 'Invalid slider.' })
		}

		slider.deleted_at = new Date()

		await slider.save()

		return response.json({ success : true, message : 'Slider has been removed.' })

	}

	async showNew({view}){
		return view.render('admin.sliders.new_form')
	}

	async addNew({request, response, view, session}){

		const rules = {
			title : 'required',
			subtitle : 'required',
			alt : 'required'
		}

		const messages = {
			'title.required' 			: 'Title is required',
			'subtitle.required' 		: 'Subtitle is required',
			'alt.required' 		        : 'Alternative information is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.slider.new')
		}

		if(!request.file('image')){
			session.flash({ error : 'Please choose slider image.' })
			return response.route('admin.slider.new')
		}

		const image = request.file('image', {
			types: ['image'],
			size: '2mb'
		})

		const newName = new Date().getTime() + '.' + image.subtype

		await image.move('public/images/sliders', {
			name: newName,
			overwrite: true
		})

		if (!image.moved()) {
			session.flash({ error : image.error() })
			return response.route('admin.slider.new')
		}

		const slider = new Slider()

		slider.title = request.body.title
		slider.subtitle = request.body.subtitle
		slider.alt = request.body.alt
		slider.image = newName

		await slider.save()

		session.flash({ success : 'Slider has been added successfully.' })

		return response.route('admin.slider.new')
		
	}

	async showEdit({params, response, view}){

		const slider = await Slider.find(params.id)

		return view.render('admin.sliders.edit_form', {slider : slider})

	}

	async edit({params, request, response, view, session}){

		const rules = {
			title : 'required',
			subtitle : 'required',
			alt : 'required'
		}

		const messages = {
			'title.required' 			: 'Title is required',
			'alt.required' 			: 'Alternative information is required',
			'subtitle.required' 		: 'Subtitle is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.slider.edit', { id : params.id })
		}

		const slider = await Slider.find(params.id)

		if( request.file('image') ){

			const image = request.file('image', {
				types: ['image'],
				size: '2mb'
			})

			const newName = new Date().getTime() + '.' + image.subtype

			await image.move('public/images/sliders', {
				name: newName,
				overwrite: true
			})

			if (!image.moved()) {
				session.flash({ error : image.error() })
				return response.route('admin.slider.edit', { id : params.id })
			}

			slider.image = newName

		}

		slider.title = request.body.title
		slider.subtitle = request.body.subtitle
		slider.alt = request.body.alt

		await slider.save()

		session.flash({ success : 'Slider has been edited successfully.' })

		return response.route('admin.sliders')
		
	}

}

module.exports = SliderController
