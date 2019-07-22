'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class AuthReturn {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, response, auth }, next) {

    if( ! auth.user ) {

      if( (request.url()).split('/')[1] == 'admin' ){
        return response.route('admin')
      }

      return response.route('login')

    }

    // call next to advance the request
    await next()
  }
}

module.exports = AuthReturn
