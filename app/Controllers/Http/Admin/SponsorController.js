'use strict'

const { validate } = use('Validator')
const Helpers = use('Helpers');
const Sponsor = use('App/Models/Sponsor')

class SponsorController {

	async index({ request, view }) {

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const data = {}

		data.sponsors = await Sponsor
							.query()
							.select('id', 'name', 'description','alt', 'image')
							.where('deleted_at', null)
							.paginate(page)

		return view.render('admin.sponsors.list', data)

	}


	async getAllSponsors({request, response,session,view}){
    
		return response.json({ success : false, message : 'Please select module name.' })
	}
	// // for the rest api
	// async getAllSponsors({request, response}) {
	// 	const data = {}
	// 	response.type('application/json');
	// 	return response.json({ success : true, data:"testing"})		
	// 	// console.log("get all sponsors called");
	// 	// data.sponsors = await Sponsor
	// 	// 					.query()
	// 	// 					.select('id', 'name', 'description', 'image')
	// 	// 					.where('deleted_at', null)
	// 	// 					.fetch()

	// 	// console.log(data.sponsors);
		
	// 	// return response.json({ success : true, data:sponsors})		
	// }

	async showNew({ view }) {
		return view.render('admin.sponsors.new_form')
	}

	async addNew({ request, response, session }) {

		const rules = {
			name 		: 'required',
			alt 		: 'required',
		}

		const messages = {
			'name.required' 		: 'Name is required',
			'alt.required' 		: 'Alternative information is required',
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.sponsors.new')
		}

		const sponsor = new Sponsor()

		sponsor.name = request.body.name
		sponsor.alt = request.body.alt
		sponsor.description = request.body.description
		// Save and upload Image and set the image path to the sponsor.image variable
		// Upload file
		let current_time = + new Date()
		const image = request.file('image', {
			types: ['image']
		})
		
		sponsor.image = current_time + "." + image.extname
		await image.move(Helpers.tmpPath('../public/uploads'), {
			name: current_time + "." + image.extname,
			overwrite: true
		})
		if(!image.moved()) {
			return image.error()
		}
		// End Upload file

		await sponsor.save()

		session.flash({ success : 'Sponsor has been added successfully.' })

		return response.route('admin.sponsors')

	}

	async showEdit({ params, view }) {

		const sponsor = await Sponsor.find(params.id)

		if( ! sponsor ){
			session.flash({ error : 'Sponsor not found.' })
		}

		return view.render('admin.sponsors.edit_form', { sponsor : sponsor })
	}

	async edit({ params, request, response, session }) {

		const rules = {
			name 		: 'required',
			alt 		: 'required',
		}

		const messages = {
			'name.required' 		: 'Name is required',
			'alt.required' 		: 'Alternative information is required',
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.pair.new')
		}

		const sponsor = await Sponsor.find(params.id)

		if( ! sponsor ){
			session.flash({ error : 'Sponsor not found.' })
		}

		sponsor.name = request.body.name
		sponsor.alt = request.body.alt
		sponsor.description = request.body.description
		// Save and upload Image and set the image path to the sponsor.image variable
		// Upload file
		try {
			let current_time = + new Date()
		const image = request.file('image', {
			types: ['image']
		})
		
		
		sponsor.image = current_time + "." + image.extname
		await image.move(Helpers.tmpPath('../public/uploads'), {
			name: current_time + "." + image.extname,
			overwrite: true
		})
		if(!image.moved()) {
			return image.error()
		}
		} catch (error) {
			console.log(error);
			
		}
		
		// End Upload file

		await sponsor.save()

		session.flash({ success : 'Sponsor has been updated successfully.' })

		return response.route('admin.sponsors')

	}

	async remove({ request, response }){

		const sponsor = await Sponsor.find(request.get().id)

		if( ! sponsor ){
			return response.json({ success : false, message : 'Invalid sponsor.' })
		}

		sponsor.deleted_at = new Date()

		await sponsor.save()

		return response.json({ success : true, message : 'Sponsor has been removed.' })

	}

}

module.exports = SponsorController
