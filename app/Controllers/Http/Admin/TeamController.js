'use strict'

const Team = use('App/Models/Team')
const { validate } = use('Validator')

class TeamController {

	async index({request, view}){

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const teams = await Team
							.query()
							.select('id', 'name', 'designation', 'description', 'image','alt')
							.where('deleted_at', null)
							.paginate(page)

		return view.render('admin.teams.list', {teams : teams})

	}

	async remove({request, response}){

		const team = await Team.find(request.get().id)

		if( ! team ){
			return response.json({ success : false, message : 'Invalid team.' })
		}

		team.deleted_at = new Date()

		await team.save()

		return response.json({ success : true, message : 'Team has been removed.' })

	}

	async showNew({view}){
		return view.render('admin.teams.new_form')
	}

	async addNew({request, response, view, session}){

		const rules = {
			name : 'required',
			designation : 'required',
			alt : 'required',
			description : 'required'
		}

		const messages = {
			'name.required' 			: 'Title is required',
			'designation.required' 		: 'Designation is required',
			'alt.required' 		: 'Alternative infromation is required',
			'description.required' 		: 'Description is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.team.new')
		}

		if(!request.file('image')){
			session.flash({ error : 'Please choose team image.' })
			return response.route('admin.team.new')
		}

		const image = request.file('image', {
			types: ['image'],
			size: '2mb'
		})

		const newName = new Date().getTime() + '.' + image.subtype

		await image.move('public/images/teams', {
			name: newName,
			overwrite: true
		})

		if (!image.moved()) {
			session.flash({ error : image.error() })
			return response.route('admin.team.new')
		}

		const team = new Team()

		team.name = request.body.name
		team.designation = request.body.designation
		team.description = request.body.description
		team.alt = request.body.alt
		team.image = newName

		await team.save()

		session.flash({ success : 'Team member has been added successfully.' })

		return response.route('admin.team.new')
		
	}

	async showEdit({params, response, view}){

		const team = await Team.find(params.id)

		return view.render('admin.teams.edit_form', {team : team})

	}

	async edit({params, request, response, view, session}){

		const rules = {
			name : 'required',
			alt : 'required',
			designation : 'required'
		}

		const messages = {
			'name.required' 			: 'Title is required',
			'designation.required' 		: 'Designation is required',
			'alt.required' 		: 'Alternative information is required',
			'description.required' 		: 'Description is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.team.edit', { id : params.id })
		}

		const team = await Team.find(params.id)

		if( request.file('image') ){

			const image = request.file('image', {
				types: ['image'],
				size: '2mb'
			})

			const newName = new Date().getTime() + '.' + image.subtype

			await image.move('public/images/teams', {
				name: newName,
				overwrite: true
			})

			if (!image.moved()) {
				session.flash({ error : image.error() })
				return response.route('admin.team.edit', { id : params.id })
			}

			team.image = newName

		}

		team.name = request.body.name
		team.designation = request.body.designation
		team.description = request.body.description
		team.alt = request.body.alt

		await team.save()

		session.flash({ success : 'Team member has been edited successfully.' })

		return response.route('admin.teams')
		
	}

}

module.exports = TeamController
