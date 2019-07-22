'use strict'

const { validate } = use('Validator')
const User = use('App/Models/User')
const LoginHistory  = use('App/Models/LoginHistory')
//const RequestC  = use('App/Models/RequestC')
const UserDevice    = use('App/Models/UserDevice')
const PersonalInfo    = use('App/Models/PersonalInfo')
const Requestcoin    = use('App/Models/RequestCoin')
const Kyc    = use('App/Models/Kyc')
const AddressKyc    = use('App/Models/AddressKyc')
const Hash = use('Hash')
const speakeasy = use('speakeasy')
const QRCode = use('qrcode')
const Mail = use('Mail')
const Env = use('Env')

class RequestAppController {
	
		async index({request, response, view, auth}){
const page = (request.get().page !== undefined) ? request.get().page : 1 
 const user = await auth.getUser()
		const requestcoin = await Requestcoin
							.query().with('user')
							.where('user_id' , user.id)
							.where('status' , 1)
							.orderBy('id', 'desc')
							.paginate(page)
							

		return view.render('requestcoin.information', {requestcoins : requestcoin.toJSON()})

	} 
	
async addCoininfo ({request, response, antl, auth, session}) {

        const rules = {
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
            'coinfname.required' : 'coinfullname required',
			'coinaname.required' : 'coinAbbreviation required',
            'issuedate.required' : 'issuedate required',
			'issuedprice.required' : 'issuedprice required',
			'issuebprice.required' : 'issuebprice required',
			'totalsupply.required' : 'totalsupply required',
			'maxsupply.required' : 'maxsupply required',
			'circulsupply.required' : 'circulsupply required',
			'prooftype.required' : 'prooftype required',
			'ealgo.required' : 'algo required',
			'website.required' : 'website required',
			'explorer.required' : 'explorer required',
			'sourcecode.required' : 'sourcecode required',
			'intro.required' : 'intro required'
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
          session
				.withErrors(validation.messages())
				.flashExcept()

        }
      
console.log(request.file('upload-icon'))
       if(!request.file('upload-icon')){
			session.flash({ error : 'Please choose currency icon.' })
		//	antl.formatMessage('Please choose currency icon.')
			return response.route('application')
		}

		const icon = request.file('upload-icon', {
			types: ['image'],
			size: '2mb'
		})

		const newName = new Date().getTime() + '.' + icon.subtype
console.log(newName)
		await icon.move('public/images/coins', {
			name: newName,
			overwrite: true
		})

		if (!icon.moved()) {
		
			session.flash({ error : icon.error() })
			return response.route('application')
		}

        if(!request.file('whitep')){
			session.flash({ error : 'Please choose whitepaper.(Invalid Application)' })
			return response.route('application')
		}

		const white = request.file('whitep', {
			types: ['application'],
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
			return response.route('application')
		}


     
        const user = await auth.getUser()
		
							
		   const requestcoin = await Requestcoin 
		                         .query()
                                 .where('user_id', user.id)
                                 .where('status', 1)
                                 .update({ coinfname: request.body.coinfname, coinaname: request.body.coinaname, issuedate: request.body.issuedate, issuedprice: request.body.issuedprice, issuedprice: request.body.issuedprice,totalsupply: request.body.totalsupply, maxsupply: request.body.maxsupply, circulsupply: request.body.circulsupply,prooftype: request.body.prooftype,ealgo: request.body.ealgo,website: request.body.website,explorer: request.body.explorer, sourcecode: request.body.sourcecode,intro: request.body.intro, iconimage: newName, whitep: newName2,anyother1: request.body.group4}) 
							/* 	 .update({ coinaname: request.body.coinaname}) 
								 .update({ issuedate: request.body.issuedate})
								 .update({ issuedprice: request.body.issuedprice})
								 .update({ issuebprice: request.body.issuebprice})
								 .update({ totalsupply: request.body.totalsupply})
								 .update({ maxsupply: request.body.maxsupply})
								 .update({ circulsupply: request.body.circulsupply})
								 .update({ prooftype: request.body.prooftype})
								 .update({ ealgo: request.body.ealgo})
								 .update({ website: request.body.website})
								 .update({ explorer: request.body.explorer})
								 .update({ sourcecode: request.body.sourcecode})
								 .update({ intro: request.body.intro})
								 .update({ iconimage: request.body.newName})
								 .update({ whitep: request.body.newName2})    */
console.log(requestcoin.rows) 

     antl.formatMessage('messages.request_auth_enabled')
return response.route('application')	 //  return response.json({ error : false, message : antl.formatMessage('messages.request_auth_enabled') })

    } 
}

module.exports = RequestAppController	
	