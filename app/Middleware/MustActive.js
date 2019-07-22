'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class MustActive {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, auth, response, session }, next) {

  	if( auth.user.status == 2 ){
		await auth.logout()
		session.flash({error: 'Acount Has Been Inactivated By Admin Please Contact To Support!'})
  		return response.route('login')
  	}

    // call next to advance the request
    await next()

  }
}

module.exports = MustActive
