'use strict'

const Feedback = use('App/Models/Feedback')
const { validate } = use('Validator')
const Socialmediatypes = use('App/Models/SocialMediaTypes')
class FeedbackController {

	async index({ request, view }) {

		const page = (request.get().page !== undefined) ? request.get().page : 1

		const feedbacks = await Feedback
			.query()
			.select('feedbacks.id', 'feedbacks.title', 'feedbacks.feedback', 'url', 'socialmediatypes.mediaName', 'feedbacks.image', 'feedbacks.alt_tag')
			.leftJoin('socialmediatypes', 'socialmediaTypeId', 'socialmediatypes.id')
			.where('feedbacks.deleted_at', null)
			.paginate(page)

		return view.render('admin.feedback.list', { feedbacks: feedbacks })

	}

	async remove({ request, response }) {

		const feedback = await Feedback.find(request.get().id)

		if (!feedback) {
			return response.json({ success: false, message: 'Invalid feedback' })
		}

		feedback.deleted_at = new Date()

		await feedback.save()

		return response.json({ success: true, message: 'feedback has been removed.' })

	}

	async showNew({ view }) {
		const data = {}
		data.socialmedias = await Socialmediatypes
			.query()
			.select('*')
			.fetch()

		return view.render('admin.feedback.new_form', data)
	}

	async addNew({ request, response, view, session }) {

		const rules = {
			title: 'required',
			feedback: 'required',
			url: 'required',
			socialmedia: 'required',
			alt_tag: 'required'
		}

		const messages = {
			'title.required': 'Title is required',
			'feedback.required': 'Feedback is required',
			'url.required': 'Url Is Required',
			'socialmedia.required': 'Social Media is Required',
			'alt_tag.required': 'Alt tag is Required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.feedback.new')
		}
		var feedbackLength = request.body.feedback.length;
		if (feedbackLength > 120) {
			session.flash({ error: 'Maximum 120 characters allowed in feedback.' })
			return response.route('admin.feedback.new')
		}
		var urllength = request.body.url.length;
		if (urllength > 120) {
			session.flash({ error: 'Maximum 120 characters allowed in url.' })
			return response.route('admin.feedback.new')
		}
		if (!request.file('image')) {
			session.flash({ error: 'Please choose feedback image.' })
			return response.route('admin.feedback.new')
		}

		const image = request.file('image', {
			types: ['image'],
			size: '2mb'
		})

		const newName = new Date().getTime() + '.' + image.subtype

		await image.move('public/images/feedbacks', {
			name: newName,
			overwrite: true
		})

		if (!image.moved()) {
			session.flash({ error: image.error() })
			return response.route('admin.feedback.new')
		}

		const feedback = new Feedback()

		feedback.title = request.body.title
		feedback.feedback = request.body.feedback
		feedback.url = request.body.url
		feedback.image = newName
		feedback.socialmediaTypeId = request.body.socialmedia
		feedback.alt_tag = request.body.alt_tag

		await feedback.save()

		session.flash({ success: 'Feedback has been added successfully.' })

		return response.route('admin.feedback.new')

	}

	async showEdit({ params, response, view }) {
		const data = {}
		data.feedback = await Feedback.find(params.id)
		data.socialmedias = await Socialmediatypes
			.query()
			.select('*')
			.fetch()
		return view.render('admin.feedback.edit_form', data)
	}

	async edit({ params, request, response, view, session }) {

		const rules = {
			title: 'required',
			feedback: 'required',
			url: 'required',
			socialmedia: 'required',
			alt_tag: 'required'
		}

		const messages = {
			'title.required': 'Title is required',
			'feedback.required': 'Feedback is required',
			'url.required': 'Url is required',
			'socialmedia.required': 'Social Media Is required',
			'alt_tag.required': 'Alt Tag is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.feedback.edit', { id: params.id })
		}

		const feedback = await Feedback.find(params.id)

		if (request.file('image')) {

			const image = request.file('image', {
				types: ['image'],
				size: '2mb'
			})

			const newName = new Date().getTime() + '.' + image.subtype

			await image.move('public/images/feedbacks', {
				name: newName,
				overwrite: true
			})

			if (!image.moved()) {
				session.flash({ error: image.error() })
				return response.route('admin.feedback.edit', { id: params.id })
			}

			feedback.image = newName

		}

		feedback.title = request.body.title
		feedback.feedback = request.body.feedback
		feedback.url = request.body.url
		feedback.socialmediaTypeId = request.body.socialmedia
		feedback.alt_tag = request.body.alt_tag

		await feedback.save()

		session.flash({ success: 'Feedback has been edited successfully.' })

		return response.route('admin.feedbacks')

	}

}

module.exports = FeedbackController
