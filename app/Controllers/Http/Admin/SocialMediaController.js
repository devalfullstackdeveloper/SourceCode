'use strict'
const Feedback = use('App/Models/Feedback')
const Socialmediatypes = use('App/Models/SocialMediaTypes')
const { validate } = use('Validator')
const Database = use('Database')

class SocialMediaController {

	async index({ request, view }) {
		const page = (request.get().page !== undefined) ? request.get().page : 1
		const socialmediatypes = await Socialmediatypes
			.query()
			.select('id', 'MediaName', 'iconPath')
			.where('deleted_at', null)
			.paginate(page)
		return view.render('admin.socialmedia.list', { socialmediatypes: socialmediatypes })
	}

	async remove({ request, response }) {
		const socialmedia = await Socialmediatypes.find(request.get().id)
		if (!socialmedia) {
			return response.json({ success: false, message: 'Invalid socialmedia' })
		}
		socialmedia.deleted_at = new Date()
		await socialmedia.save()
		return response.json({ success: true, message: 'socialmedia has been removed.' })
	}

	async showNew({ view }) {
		return view.render('admin.socialmedia.new_form')
	}

	async addNew({ request, response, view, session }) {
		const rules = {
			MediaName: 'required',
			alternative_text: 'required',
		}

		const messages = {
			'MediaName': 'MediaName is Required',
			'alternative_text': 'Alternative Text is Required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.socialmedia.new')
		}
		var MediaNameLength = request.body.MediaName.length;
		if (MediaNameLength > 120) {
			session.flash({ error: 'Maximum 120 characters allowed in Media title.' })
			return response.route('admin.socialmedia.new')
		}

		if (!request.file('iconPath')) {
			session.flash({ error: 'Please choose feedback image.' })
			return response.route('admin.socialmedia.new')
		}

		const iconPath = request.file('iconPath', {
			types: ['image'],
			size: '2mb'
		})

		const newName = new Date().getTime() + '.' + iconPath.subtype

		await iconPath.move('public/images/socialicons', {
			name: newName,
			overwrite: true
		})

		if (!iconPath.moved()) {
			session.flash({ error: iconPath.error() })
			return response.route('admin.socialmedia.new')
		}
		const socialmedia = new Socialmediatypes()
		socialmedia.MediaName = request.body.MediaName
		socialmedia.alternative_text = request.body.alternative_text
		socialmedia.iconPath = "/images/socialicons/" + newName
		await socialmedia.save()
		session.flash({ success: 'socialmedia has been added successfully.' })
		return response.route('admin.socialmedia.new')
	}

	async showEdit({ params, response, view }) {
		const socialmedia = await Socialmediatypes.find(params.id)
		return view.render('admin.socialmedia.edit_form', { socialmedia: socialmedia })
	}

	async edit({ params, request, response, view, session }) {

		const rules = {
			MediaName: 'required',
			alternative_text: 'required',
		}

		const messages = {
			'MediaName': 'MediaName is Required',
			'alternative_text': 'Alternative Text is Required',
		}
		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.socialmedia.edit', { id: params.id })
		}

		const socialmedia = await Socialmediatypes.find(params.id)

		if (request.file('iconPath')) {

			const icon = request.file('iconPath', {
				types: ['image'],
				size: '2mb'
			})

			const newName = new Date().getTime() + '.' + icon.subtype

			await icon.move('public/images/socialicons', {
				name: newName,
				overwrite: true
			})
			if (!icon.moved()) {
				session.flash({ error: icon.error() })
				return response.route('admin.socialmedia.edit', { id: params.id })
			}
			socialmedia.iconPath = "/images/socialicons/" + newName
		}
		socialmedia.MediaName = request.body.MediaName
		socialmedia.alternative_text = request.body.alternative_text
		await socialmedia.save()
		session.flash({ success: 'Feedback has been edited successfully.' })
		return response.route('admin.socialmedia')
	}

}

module.exports = SocialMediaController
