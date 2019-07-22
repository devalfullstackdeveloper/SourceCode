'use strict'

const User = use('App/Models/User')


class LoginController {

	async showLogin({request, response, view}) {
		
		return view.render('admin.auth.login')	
	}

	async login({request, response, auth, session}) {

		const user = await User.query().where('is_admin', 1).where('email', request.body.username).fetch()

		if( user.rows.length === 0 ){
			session.flash({ error: 'Invalid Username' })
			return response.route('admin.login')
		}

		const { username, password } = request.all()

		await auth.attempt(username, password)

		return response.route('admin.dashboard')
		
	}

}

module.exports = LoginController
