'use strict'

const HireTraderRequest = use('App/Models/HireTraderRequest')

class HireTraderController {

	async index({request, view}){

		const page = (request.get().page !== undefined) ? request.get().page : 1 

		const hireTraderRequests = await HireTraderRequest
							.query()
							.select('id', 'first_name', 'middle_name',"last_name", 'email', 'package', 'mobile','address','zipcode','city','country','dob', 'payment_currency', 'payment_transaction_hash', 'created_at')
							.where('deleted_at', null)
							.paginate(page)        
		return view.render('admin.hiretrader.list', {hireTraderRequests : hireTraderRequests, packages: [
			"Part Time (4 HOURS PER DAY, FOR 1 MONTH,PRICE 0,05 BTC)",
			"FULL TIME (8 HOURS, FOR 1 MONTH,PRICE 0,10 BTC)",
			"12 HOURS PER DAY,FOR 1 MONTH, PRICE 0,15 BTC)",
			"24 HOURS PER DAY ,FOR 1 MONTH,PRICE (0,25BTC)"
		]})

	}

	async remove({request, response}){

		const hireTraderRequest = await HireTraderRequest.find(request.get().id)

		if( ! hireTraderRequest ){
			return response.json({ success : false, message : 'Invalid Hire Trader.' })
		}

		hireTraderRequest.deleted_at = new Date()

		await hireTraderRequest.save()

		return response.json({ success : true, message : 'Hire trader request removed successfully.' })

	}

}

module.exports = HireTraderController
