'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Locale {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, antl, view, auth }, next) {
  	
  	const lang = request.cookie('lang')
  	
  	if (lang) {
  		antl.switchLocale(lang)
  	}

	 view.share({ locales: antl.availableLocales() })

	 await next()

  }

}

module.exports = Locale
