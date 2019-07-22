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

class RequestInfoController {
	
		async index({request, response, view, auth}){
const page = (request.get().page !== undefined) ? request.get().page : 1 
 const user = await auth.getUser()
		const requestcoin = await Requestcoin
							.query().with('user')
							.where('user_id' , user.id)
							.orderBy('id', 'desc')
							.paginate(page)
							

		return view.render('requestcoin.application', {requestcoins : requestcoin.toJSON()})

	}
async addCoinapp ({request, response, antl, auth, session}) {

        const rules = {
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
            anyotherinfp : 'required'
        }

        const messages = {
            'emailaddress.required' : 'email  required',
			'fullname.required' : 'fullname  required',
            'companyname.required' : 'companyname  required',
			'onesentence.required' : 'onesentence  required',
			'projectname2.required' : 'projectname  required',
			'coinname2.required' : 'coinname  required',
			'coinsymbol2.required' : 'coinsymbol  required',
			'officialweb.required' : 'officialweb  required',
			'permalink.required' : 'permalink  required'
		}
        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
          session
				.withErrors(validation.messages())
				.flashExcept()

        }
		console.log(request.body.emailaddress)
		console.log(request.body.fullname)
         console.log(request.file('upload-icon'))
       if(!request.file('upload-icon')){
			session.flash({ error : 'Please choose currency icon.' })
		//	antl.formatMessage('Please choose currency icon.')
			return response.route('information')
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
			return response.route('information')
		}




     
        const user = await auth.getUser()
		
							
		   const requestcoin = await Requestcoin 
		                         .query()
                                 .where('user_id', user.id)
                                 .where('status', 1)
                                 .update({ emailaddress: request.body.emailaddress, fullname: request.body.fullname,companyname: request.body.companyname,onesentence: request.body.onesentence,issuedprice: request.body.issuedprice,totalsupply: request.body.totalsupply,maxsupply: request.body.maxsupply, circulsupply: request.body.circulsupply, projectname2: request.body.projectname2,coinname2: request.body.coinname2, officialweb: request.body.officialweb,permalink: request.body.permalink,mainapp: request.body.mainapp, targetind: request.body.targetind,anyotherinfp: request.body.anyotherinfp,nda: newName,anyother2: request.body.otherposition}) 
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
console.log(requestcoin) 

     session.flash({ success : 'Request Send Succesfully.' })
return response.route('information')	 //  return response.json({ error : false, message : antl.formatMessage('messages.request_auth_enabled') })

    }	
	
	   
}

module.exports = RequestInfoController	
	