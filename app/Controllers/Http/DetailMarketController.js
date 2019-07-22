'use strict'

const Pair = use('App/Models/Pair')
const Order = use('App/Models/Order')
const StopOrder = use('App/Models/StopOrder')
const Address = use('App/Models/Address')
const Env = use('Env')
const User = use('App/Models/User')
const axios = use('axios')
const Requestfees = use('App/Models/RequestFees')
const Detailmarket = use('App/Models/DetailMarket')


class DetailMarketController {
	async index({params, request, response, antl, view, auth, session}){
const page = (request.get().page !== undefined) ? request.get().page : 1 
	
							
const pair = await Pair.findBy('pair_key', params.pair)
		return view.render('.detailmarket.detailmarket' , pair)  

	} 


}

module.exports = DetailMarketController
