'use strict'

const About = use('App/Models/About')
const { validate } = use('Validator')

class AboutUSController {

	async index({request, view}){

		//const page = (request.get().page !== undefined) ? request.get().page : 1 
		const abouts = await About
							.query()
							.where('deleted_at', null).fetch()
							//.paginate(page)

		return view.render('admin.aboutus.list', {abouts : abouts})

	}
	async showEdit({params, response, view}){

		const about = await About.find(params.id)
		return view.render('admin.aboutus.edit_form', {about : about})

	}

	async edit({params, request, response, view, session}){

		const rules = {
			Name : 'required',
			Description : 'required',
			alt : 'required',
		}

		const messages = {
			'Name.required' 			: 'Title is required',
			'Description.required' 		: 'Description is required',
			'alt.required' 		: 'Alternative information is required',
		}

		const validation = await validate(request.all(), rules, messages)
		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.aboutus.edit', { id : params.id })
		}

		const about = await About.find(params.id)

		if( request.file('image') ){

			const image = request.file('image', {
				types: ['image'],
				size: '2mb'
			})

			const newName = new Date().getTime() + '.' + image.subtype

			await image.move('public/images/about', {
				name: newName,
				overwrite: true
			})

			if (!image.moved()) {
				session.flash({ error : image.error() })
				return response.route('admin.aboutus.edit', { id : params.id })
			}

			about.image = newName

		}

		about.Name = request.body.Name
		about.Description = request.body.Description
        about.alt = request.body.alt
		await about.save()

		session.flash({ success : 'About us has been edited successfully.' })

		return response.route('admin.aboutus')
		
	}

	
}

module.exports = AboutUSController
