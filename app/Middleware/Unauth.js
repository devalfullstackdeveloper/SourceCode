'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Unauth {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, response, auth }, next) {

  	if( auth.user ) {
    	if(auth.user.is_admin) {
    		return response.route('admin.dashboard')	
    	}
    	return response.route('account')
    }

    // call next to advance the request
    await next()
  }
}

module.exports = Unauth
