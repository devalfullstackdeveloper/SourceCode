'use strict'

const Env = use('Env')
const Mail = use('Mail')
const Hash = use('Hash')
const QRCode = use('qrcode')
const Helpers = use('Helpers')
const Kyc = use('App/Models/Kyc')
const speakeasy = use('speakeasy')
const User = use('App/Models/User')
const { validate } = use('Validator')
const AddressKyc = use('App/Models/AddressKyc')
const UserDevice = use('App/Models/UserDevice')
const Requestcoin = use('App/Models/RequestCoin')
const LoginHistory = use('App/Models/LoginHistory')
const PersonalInfo = use('App/Models/PersonalInfo')
const HeaderImage = use('App/Models/HeaderImage')
class RequestCoinController {
	
	async index({request, response, view, auth}){

		const page = (request.get().page !== undefined) ? request.get().page : 1
		const user = await auth.getUser()

		const requestcoin = await Requestcoin
								.query()
								.with('user')
								.where('user_id' , user.id)
								.orderBy('id', 'desc')
								.paginate(page)

								const coins = {}
		var headerImage =  await HeaderImage.query().where('page_type', 7).first()
		if(!headerImage)
		{
		headerImage=new HeaderImage()
		headerImage.image='/default.png'
		coins.headerImage=headerImage
		}
		else
		coins.headerImage=headerImage
		console.log("headerImage", headerImage);
		return view.render('requestcoin.list', {requestcoins : requestcoin.toJSON(),coins:coins})
	} 
	
	 async enableRequest ({request, response, antl, auth, session}) {

        const rules = {
            projectname: 'required',
			tokenname: 'required',
            coinsymbol : 'required',
			email : 'required',
			emailaddress: 'required',
			fullname: 'required',
            companyname : 'required',
			onesentence : 'required',
			projectname2: 'required',
			coinname2: 'required',
            coinsymbol2 : 'required',
			officialweb: 'required',
			permalink: 'required',
            mainapp : 'required',
			targetind: 'required',
            anyotherinfp : 'required',
			coinfname: 'required',
			coinaname: 'required',
            issuedate : 'required',
			issuedprice : 'required',
			issuebprice: 'required',
			totalsupply: 'required',
            maxsupply : 'required',
			circulsupply: 'required',
			prooftype: 'required',
            ealgo : 'required',
			website: 'required',
            explorer : 'required',
			sourcecode: 'required',
			intro: 'required'
        }

        const messages = {
            'projectname.required': 'project name required',
			'tokenname.required': 'coin symbol required',
            'coinsymbol.required': 'coin symbol required',
			'email.required': 'emailrequired',
			'emailaddress.required': 'email  required',
			'fullname.required': 'fullname  required',
            'companyname.required': 'companyname  required',
			'onesentence.required': 'onesentence  required',
			'projectname2.required': 'projectname  required',
			'coinname2.required': 'coinname  required',
			'coinsymbol2.required': 'coinsymbol  required',
			'officialweb.required': 'officialweb  required',
			'permalink.required': 'permalink  required',
			'coinfname.required': 'coinfullname required',
			'coinaname.required': 'coinAbbreviation required',
            'issuedate.required': 'issuedate required',
			'issuedprice.required': 'issuedprice required',
			'issuebprice.required': 'issuebprice required',
			'totalsupply.required': 'totalsupply required',
			'maxsupply.required': 'maxsupply required',
			'circulsupply.required': 'circulsupply required',
			'prooftype.required': 'prooftype required',
			'ealgo.required': 'algo required',
			'website.required': 'website required',
			'explorer.required': 'explorer required',
			'sourcecode.required': 'sourcecode required',
			'intro.required': 'intro required'
        }

        const validation = await validate(request.all(), rules, messages)
		console.log(validation);
        if (validation.fails()) {
			session.withErrors(validation.messages()).flashExcept()
			return response.route('requestcoin') 
        }

        var fileNameIs  = null;

        if( request.file('iconimage') ) {

	        // File to be upload with some validation rules
			const uploadFile = request.file('iconimage', {
				types: [
					'png',
					'jpeg',
					'jpg',
					'gif'
				],
				size: '1mb'
			})

	        // File upload process
			await uploadFile.move(Helpers.publicPath('images/requestcoin'), {
	            name: `${(uploadFile.clientName).replace(/ /g, '_')}`,
	            overwrite: true
	        })

			// Check if file uploaded
			if ( ! uploadFile.moved() ) {
				console.log(uploadFile.error())

				session.flash({ error: 'Error while upload icon image' })
				return response.redirect('back')
			}
        	

        	fileNameIs =  uploadFile.fileName
        }


 /* if(!request.file('upload-iconz')){
			session.flash({ error: 'Please choose currency icon.' })
		//	antl.formatMessage('Please choose currency icon.')
			return response.route('requestcoin')
		}

		const icon = request.file('upload-iconz', {
			types: ['image'],
			size: '2mb'
		})

		const newNamez = new Date().getTime() + '.' + icon.subtype
console.log(newName)
		await icon.move('public/images/coins', {
			name: newNamez,
			overwrite: true
		})

		if (!icon.moved()) {
		
			session.flash({ error : icon.error() })
			return response.route('requestcoin')
		}

 if(!request.file('upload-icon')){
			session.flash({ error : 'Please choose currency icon.' })
		//	antl.formatMessage('Please choose currency icon.')
			return response.route('requestcoin')
		}

		const iconx = request.file('upload-icon', {
			types: ['image'],
			size: '2mb'
		})

		const newName = new Date().getTime() + '.' + iconx.subtype
console.log(newName)
		await iconx.move('public/images/coins', {
			name: newName,
			overwrite: true
		})

		if (!iconx.moved()) {
		
			session.flash({ error : iconx.error() })
			return response.route('requestcoin')
		}

        if(!request.file('whitep')){
			session.flash({ error : 'Please choose whitepaper.(Invalid Application)' })
			return response.route('requestcoin')
		}

		const white = request.file('whitep', {
			types: ['requestcoin'],
			size: '200mb'
		})
 
		const newName2 = new Date().getTime() + '.' + white.subtype
console.log(newName2)
		await white.move('public/images/coins', {
			name: newName2,
			overwrite: true
		})
 
		if (!white.moved()) {
			
			session.flash({ error : white.error() })
			return response.route('requestcoin')
		} */

        const user = await auth.getUser()
		const requestcoin = new Requestcoin 

        requestcoin.projectname = request.body.projectname
		requestcoin.tokenname = request.body.tokenname
        requestcoin.coinsymbol = request.body.coinsymbol
		requestcoin.email = request.body.email
		requestcoin.status = 0
		requestcoin.user_id = user.id
	    requestcoin.emailaddress = request.body.emailaddress
		requestcoin.fullname = request.body.fullname
		requestcoin.companyname = request.body.companyname
		requestcoin.onesentence = request.body.onesentence
		requestcoin.issuedprice = request.body.issuedprice
		requestcoin.totalsupply = request.body.totalsupply
		requestcoin.maxsupply = request.body.maxsupply
		requestcoin.circulsupply = request.body.circulsupply
		requestcoin.projectname2 = request.body.projectname2
		requestcoin.coinname2 = request.body.coinname2
		requestcoin.officialweb = request.body.officialweb
		requestcoin.permalink = request.body.permalink
		requestcoin.mainapp = request.body.mainapp
		requestcoin.targetind = request.body.targetind
		requestcoin.anyotherinfp = request.body.anyotherinfp
		requestcoin.nda = 0
		requestcoin.anyother2 = request.body.otherposition
		requestcoin.coinfname = request.body.coinfname
		requestcoin.coinaname = request.body.coinaname
		requestcoin.issuedate = request.body.issuedate
		requestcoin.issuedprice = request.body.issuedprice
		requestcoin.issuedprice = request.body.issuedprice
		requestcoin.totalsupply = request.body.totalsupply
		requestcoin.maxsupply = request.body.maxsupply
		requestcoin.circulsupply = request.body.circulsupply
		requestcoin.prooftype = request.body.prooftype
		requestcoin.ealgo = request.body.ealgo
		requestcoin.website = request.body.website
		requestcoin.explorer = request.body.explorer
		requestcoin.sourcecode = request.body.sourcecode
		requestcoin.intro = request.body.intro
		requestcoin.iconimage = 0
		requestcoin.whitep = 0
		requestcoin.anyother1 = request.body.group4

		if( request.file('iconimage') ) {
			requestcoin.iconimage = fileNameIs
		}

      	await  requestcoin.save()
    
        session.flash({ success : 'Request Coin Request Succesfully Send.' })	
        return response.route('requestcoin') 
    }
	
	async appplication ({request, response, view, auth}){

		const page = (request.get().page !== undefined) ? request.get().page : 1
		const user = await auth.getUser()

		const requestcoin = await Requestcoin
								.query()
								.with('user')
								.where('user_id' , user.id)
								.orderBy('id', 'desc')
								.paginate(page)

		return view.render('requestcoin.application', {requestcoins : requestcoin.toJSON()})
	}

	async information ({request, response, view, auth}){

		const page = (request.get().page !== undefined) ? request.get().page : 1
		const user = await auth.getUser()

		const requestcoin = await Requestcoin
								.query()
								.with('user')
								.where('user_id' , user.id)
								.orderBy('id', 'desc')
								.paginate(page)

		return view.render('requestcoin.information', {requestcoins : requestcoin.toJSON()})
	}  
}

module.exports = RequestCoinController	
	