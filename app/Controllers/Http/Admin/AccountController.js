'use strict'

const { validate } = use('Validator')
const User = use('App/Models/User')
const Hash = use('Hash')

class AccountController {

	async showChangePassword({view}){
		return view.render('admin.account.change_password')
	}

	async changePassword({request, response, auth, antl}){

		const rules = {
            old_password: 'required',
            new_password: 'required|confirmed'
        }

        const messages = {
            'old_password.required'     : antl.formatMessage('messages.old_password_required'),
            'new_password.required'     : antl.formatMessage('messages.new_password_required'),
            'new_password.confirmed'	: antl.formatMessage('messages.password_confirm')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            return response.json({ error : true, message : validation.messages()[0].message })
        }

        const admin = await auth.getUser()

        const isSame = await Hash.verify(request.input("old_password"), admin.password)

        if( ! isSame ){
        	return response.json({ error : true, message : antl.formatMessage('messages.incorrect_old_password') })
        }

        if(request.input("new_password") == request.input("old_password")){
        	return response.json({ error : true, message : antl.formatMessage('messages.password_same') })
        }

        admin.password = await Hash.make(request.input("new_password"))
        await admin.save()

        return response.json({ error : false, message : antl.formatMessage('messages.password_changed') })
		
	}

    async logout ({request, response, auth}) {
        await auth.logout()
        return response.route('admin.login')
    }

}

module.exports = AccountController
