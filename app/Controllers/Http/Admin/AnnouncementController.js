'use strict'

const { validate } = use('Validator')
const Announcement = use('App/Models/Announcement')

class AnnouncementController {

	async index({ request, view }) {

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const data = {}

		data.announcements = await Announcement
							.query()
							.select('id', 'title')
							.where('deleted_at', null)
							.paginate(page)

		return view.render('admin.announcements.list', data)

	}

	async showNew({ view }) {
		return view.render('admin.announcements.new_form')
	}

	async addNew({ request, response, session }) {

		const rules = {
			title 		: 'required',
			description : 'required'
		}

		const messages = {
			'title.required' 		: 'Title is required',
			'description.required'	: 'Description is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.announcement.new')
		}

		const announcement = new Announcement()

		announcement.title = request.body.title
		announcement.description = request.body.description

		await announcement.save()

		session.flash({ success : 'Announcement has been added successfully.' })

		return response.route('admin.announcements')

	}

	async showEdit({ params, view }) {

		const announcement = await Announcement.find(params.id)

		if( ! announcement ){
			session.flash({ error : 'Announcement not found.' })
		}

		return view.render('admin.announcements.edit_form', { announcement : announcement })
	}

	async edit({ params, request, response, session }) {

		const rules = {
			title 		: 'required',
			description : 'required'
		}

		const messages = {
			'title.required' 		: 'Title is required',
			'description.required'	: 'Description is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.pair.new')
		}

		const announcement = await Announcement.find(params.id)

		if( ! announcement ){
			session.flash({ error : 'Announcement not found.' })
		}

		announcement.title = request.body.title
		announcement.description = request.body.description

		await announcement.save()

		session.flash({ success : 'Announcement has been updated successfully.' })

		return response.route('admin.announcements')

	}

	async remove({ request, response }){

		const announcement = await Announcement.find(request.get().id)

		if( ! announcement ){
			return response.json({ success : false, message : 'Invalid announcement.' })
		}

		announcement.deleted_at = new Date()

		await announcement.save()

		return response.json({ success : true, message : 'Announcement has been removed.' })

	}

}

module.exports = AnnouncementController
