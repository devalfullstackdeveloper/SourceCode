'use strict'

const Faq = use('App/Models/Faq')
const { validate } = use('Validator')

class FaqController {

	async index({ request, view }) {

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const data = {}

		data.faqs = await Faq
							.query()
							.select('id', 'question')
							.where('deleted_at', null)
							.paginate(page)

		return view.render('admin.faqs.list', data)

	}

	async showNew({ view }) {
		return view.render('admin.faqs.new_form')
	}

	async addNew({ request, response, session }) {

		const rules = {
			question : 'required',
			answer 	: 'required'
		}

		const messages = {
			'question.required' : 'Question is required',
			'answer.required' : 'answer is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.faq.new')
		}

		const faq = new Faq()

		faq.question = request.body.question
		faq.answer = request.body.answer

		await faq.save()

		session.flash({ success : 'Faq has been added successfully.' })

		return response.route('admin.faqs')

	}

	async showEdit({ params, view }) {

		const faq = await Faq.find(params.id)

		if( ! faq ){
			session.flash({ error : 'Faq not found.' })
		}

		return view.render('admin.faqs.edit_form', { faq : faq })
	}

	async edit({ params, request, response, session }) {

		const rules = {
			question : 'required',
			answer 	: 'required'
		}

		const messages = {
			'question.required' : 'Question is required',
			'answer.required' : 'answer is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.pair.new')
		}

		const faq = await Faq.find(params.id)

		if( ! faq ){
			session.flash({ error : 'Faq not found.' })
		}

		faq.question = request.body.question
		faq.answer = request.body.answer

		await faq.save()

		session.flash({ success : 'Faq has been updated successfully.' })

		return response.route('admin.faqs')

	}

	async remove({ request, response }){

		const faq = await Faq.find(request.get().id)

		if( ! faq ){
			return response.json({ success : false, message : 'Invalid faq.' })
		}

		faq.deleted_at = new Date()

		await faq.save()

		return response.json({ success : true, message : 'Faq has been removed.' })

	}

}

module.exports = FaqController
