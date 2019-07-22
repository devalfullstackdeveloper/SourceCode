'use strict'

const { validate } = use('Validator')
const Job = use('App/Models/Job')
const JobApply = use('App/Models/JobApply')
const Database = use('Database')

class JobController {

	async index({ request, view }) {

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const data = {}

		data.jobs = await Job
							.query()
							.select('jobs.id', 'jobs.title', 'jobs.job_type', Database.raw("count(job_applies.id) AS applied"))
							.leftJoin('job_applies', 'job_applies.job_id', 'jobs.id')
							.where('jobs.deleted_at', null)
							.groupBy('job_applies.job_id')
							.paginate(page)

		return view.render('admin.jobs.list', data)

	}

	async showNew({ view }) {
		return view.render('admin.jobs.new_form')
	}

	async addNew({ request, response, session }) {

		const rules = {
			title 		: 'required',
			job_type : 'required'
		}

		const messages = {
			'title.required' 		: 'Title is required',
			'job_type.required'	: 'Job type is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.job.new')
		}

		const job = new Job()

		job.title = request.body.title
		job.job_type = request.body.job_type

		await job.save()

		session.flash({ success : 'Job has been added successfully.' })

		return response.route('admin.jobs')

	}

	async showEdit({ params, view }) {

		const job = await Job.find(params.id)

		if( ! job ){
			session.flash({ error : 'Job not found.' })
		}

		return view.render('admin.jobs.edit_form', { job : job })
	}

	async edit({ params, request, response, session }) {

		const rules = {
			title 		: 'required',
			job_type : 'required'
		}

		const messages = {
			'title.required' 		: 'Title is required',
			'job_type.required'	: 'Job type is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.pair.new')
		}

		const job = await Job.find(params.id)

		if( ! job ){
			session.flash({ error : 'Job not found.' })
		}

		job.title = request.body.title
		job.job_type = request.body.job_type

		await job.save()

		session.flash({ success : 'Job has been updated successfully.' })

		return response.route('admin.jobs')

	}

	async remove({ request, response }){

		const job = await Job.find(request.get().id)

		if( ! job ){
			return response.json({ success : false, message : 'Invalid job.' })
		}

		job.deleted_at = new Date()

		await job.save()

		return response.json({ success : true, message : 'Job has been removed.' })

	}

	async applied({ request, view }) {
		const applieds = await JobApply.query().select('id', 'name', 'mobile', 'email', 'resume', 'created_at').fetch()
		return view.render('admin.jobs.applied', { applieds : applieds.rows });
	}

}

module.exports = JobController
