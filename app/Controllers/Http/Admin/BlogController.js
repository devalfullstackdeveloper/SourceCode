'use strict'

const { validate } = use('Validator')
const Blog = use('App/Models/Blog')

class BlogController {

	async index({ request, view }) {

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const data = {}

		data.blogs = await Blog
							.query()
							.select('id', 'title')
							.where('deleted_at', null)
							.paginate(page)

		return view.render('admin.blogs.list', data)

	}

	async showNew({ view }) {
		return view.render('admin.blogs.new_form')
	}

	async addNew({ request, response, session }) {

		const rules = {
			title 		: 'required',
			description : 'required',
			alternative_text:'required'
		}

		const messages = {
			'title.required' 		: 'Title is required',
			'description.required'	: 'Description is required',
			'alternative_text.required':'Alternative Text is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.blog.new')
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

		await image.move('public/images/blogs', {
			name: newName,
			overwrite: true
		})

		if (!image.moved()) {
			session.flash({ error : image.error() })
			return response.route('admin.blog.new')
		}
		


		
		var slugVar = request.body.title
		slugVar = slugVar.replace(/\s+/g, '-').toLowerCase()

		var count = await Blog
        .query()
        .where('slug', slugVar)
         .count('* as total')  
         var total = count[0].total
         if(total != 0)
         {
			 // exists 
             
           slugVar = slugVar + "-" + Math.floor((Math.random() * 100) + 1)
		 }
		



		const blog = new Blog()



		
        
		blog.title = request.body.title
		blog.slug = slugVar
		blog.description = request.body.description
		blog.alternative_text = request.body.alternative_text
		blog.image = newName

		await blog.save()

		session.flash({ success : 'Blog has been added successfully.' })

		return response.route('admin.blogs')

	}

	async showEdit({ params, view }) {

		const blog = await Blog.find(params.id)

		if( ! blog ){
			session.flash({ error : 'Blog not found.' })
		}

		return view.render('admin.blogs.edit_form', { blog : blog })
	}

	async edit({ params, request, response, session }) {

		
		const rules = {
			title 		: 'required',
			description : 'required',
			alternative_text:'required'
		}

		const messages = {
			'title.required' 		: 'Title is required',
			'description.required'	: 'Description is required',
			'alternative_text.required':'Alternative Text is required'
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {

			session
				.withErrors(validation.messages())
				.flashExcept()

			return response.route('admin.blog.edit', { id : params.id })
		}

		const blog = await Blog.find(params.id)

		if( request.file('image') ){

			const image = request.file('image', {
				types: ['image'],
				size: '2mb'
			})

			const newName = new Date().getTime() + '.' + image.subtype

			await image.move('public/images/blogs', {
				name: newName,
				overwrite: true
			})

			if (!image.moved()) {
				session.flash({ error : image.error() })
				return response.route('admin.blog.new')
			}

			blog.image = newName

		}

		if( ! blog ){
			session.flash({ error : 'Blog not found.' })
		}

         
		var slugVar = request.body.title
		slugVar = slugVar.replace(/\s+/g, '-').toLowerCase()

		var count = await Blog
        .query()
        .where('slug', slugVar)
         .count('* as total')  
         var total = count[0].total
         if(total != 0)
         {
			 // exists 
             
           slugVar = slugVar + "-" + Math.floor((Math.random() * 100) + 1)
		 }
		


		blog.title = request.body.title
		blog.slug = slugVar
		blog.description = request.body.description
		blog.alternative_text = request.body.alternative_text
		await blog.save()

		session.flash({ success : 'Blog has been updated successfully.' })

		return response.route('admin.blogs')

	}

	async remove({ request, response }){

		const blog = await Blog.find(request.get().id)

		if( ! blog ){
			return response.json({ success : false, message : 'Invalid blog.' })
		}

		blog.deleted_at = new Date()

		await blog.save()

		return response.json({ success : true, message : 'Blog has been removed.' })

	}

}

module.exports = BlogController
