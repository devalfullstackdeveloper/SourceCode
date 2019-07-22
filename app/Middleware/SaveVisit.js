'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const VisitHistory = use('App/Models/VisitHistory')
const axios         = use('axios')
const UAParser      = use('ua-parser-js')

class SaveVisit {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, session }, next) {

    // var ip = request.header('x-real-ip')

    // var location = session.get('location')

    // var ipurl = `https://ipapi.co/${ip}/json/`

    // if( ! location ){
    //   await axios.get(ipurl)
    //   .then(locationResponse => {
    //       location = locationResponse.data
    //       location = location.city + ', ' + location.region + ', ' + location.country_name
    //   })
    // }

    // var result = await new UAParser().setUA(request.header('user-agent')).getResult()
    // var device = result.browser.name + ' V' + result.browser.version + ' ( ' + result.os.name + ' ) '

    // const history = new VisitHistory()

    // history.ip_address = ip
    // history.location = location
    // history.device = device
    // history.page = request.url()

    // await history.save()

    // call next to advance the request
    await next()

  }
}

module.exports = SaveVisit
