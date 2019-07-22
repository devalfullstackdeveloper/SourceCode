'use strict'

const Option = use('App/Models/Option')
const Contact = use('App/Models/Contact')
const SupportDetail = use('App/Models/SupportDetail')

class CmsController {

	async index({ params, view }) {

		const cms = await Option.findBy('cms_key', params.cms_key)

		if( ! cms ){
			session.flash({ error : 'CMS not found.' })
			return back()
		}

		return view.render('admin.cms.form', { cms : cms })

	}

	async update({ params, request, response, session }) {

		const cms = await Option.findBy('cms_key', params.cms_key)

		if( ! cms ){
			session.flash({ error : 'CMS not found.' })
			return back()
		}

		cms.content = request.body.content

		await cms.save()
		
		session.flash({ success : 'CMS updated successfully.' })

		return response.route('admin.cms', { cms_key : params.cms_key })

	}

	async contacts({ request, view }) {

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const contacts = await Contact.query().where('deleted_at', null).orderBy('id', 'desc').paginate(page)

		return view.render('admin.contacts.list', { contacts : contacts })

	}

	async showSupport({ params, view }) {

		const support = await SupportDetail.find(1)

		return view.render('admin.cms.support_form', { support : support })

	}

	async udpateSupport({ request, session, params, view, response }) {

		const support = await SupportDetail.find(1)

		support.email = request.body.email
		support.email2 = request.body.email2
		support.mobile = request.body.mobile
		support.website = request.body.website
		support.address = request.body.address
		support.facebook = request.body.facebook
		support.twitter = request.body.twitter
		support.telegram = request.body.telegram
		support.skype = request.body.skype
		support.linkedin = request.body.linkedin
		support.linkedin1 = request.body.linkedin1
		support.instagram = request.body.instagram
		support.whatsapp = request.body.whatsapp

		await support.save()

		session.flash({ success : 'Support details updated successfully.' })
		return response.route('admin.support')
	}
}

module.exports = CmsController
