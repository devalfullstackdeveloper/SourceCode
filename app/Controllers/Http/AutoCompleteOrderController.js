'use strict'

const Order = use('App/Models/Order')
const Address = use('App/Models/Address')
const Pair = use('App/Models/Pair')

class AutoCompleteOrderController {

	async autoCompleteBuy({ request, response, auth }) {

		let currentPrice = Number(request.body.currentPrice)
		let currentPair = (request.body.currentPair)

		let pairData = await Pair.query()
								 .where({
								 	pair_key: currentPair
								 })
								 .first()

		if( ! pairData ) {
			return response.json({
				status: "NO"
			});
		}

		let allOpenOrders = await Order.query()
									   .where({
									   		order_type: 0,
									   		status: 0,
									   		pair: currentPair,
									   		user_id: auth.user.id
									   })
									   .whereRaw(`price >= ${currentPrice}`)
									   .fetch()

		if( allOpenOrders.rows.length == 0 ) {
			return response.json({
				status: "NO"
			})
		}

		for(var i in allOpenOrders.rows) {

			let walletToUpdate = await Address.findBy({
                currency: pairData.derive_currency,
                user_id: auth.user.id
            })

            if( walletToUpdate ) {
                walletToUpdate.balance = Number(walletToUpdate.balance) + Number(allOpenOrders.rows[i].amount)
                await walletToUpdate.save()
            }

            let openOrderUpdate = await Order.findBy({
		   		id: allOpenOrders.rows[i].id
		   	})

            openOrderUpdate.status = 1
		   	await openOrderUpdate.save()

		   	return response.json({
				status: "DONE"
			})
		}

		return response.json({
			totalIs: allOpenOrders.rows.length,
			statusIs: "OK"
		})
	}

	async autoCompleteSell({ request, response, auth }) {

		let currentPrice = Number(request.body.currentPrice)
		let currentPair = (request.body.currentPair)
		let user = auth.user

		let pairData = await Pair.query()
								 .where({
								 	pair_key: currentPair
								 })
								 .first()

		if( ! pairData ) {
			return response.json({
				status: "NO"
			})
		}

		let allOpenOrders = await Order.query()
									   .where({
									   		order_type: 1,
									   		status: 0,
									   		pair: currentPair,
									   		user_id: auth.user.id
									   })
									   .whereRaw(`price <= ${currentPrice}`)
									   .fetch()

		if( allOpenOrders.rows.lengh == 0 ) {
			return response.json({
				status: "NO"
			})
		}

		for(var i in allOpenOrders.rows) {

			var balAddCurrency = pairData.base_currency

            if( balAddCurrency == 'usd' ){
                user.usd_balance = Number(user.usd_balance) + Number(allOpenOrders.rows[i].total)
                await user.save()
            } else if( balAddCurrency == 'euro' ){
                user.euro_balance = Number(user.euro_balance) + Number(allOpenOrders.rows[i].total)
                await user.save()
            } else {

                let walletToUpdate = await Address.findBy({
                    currency: balAddCurrency,
                    user_id: user.id
                })

                walletToUpdate.balance = Number(walletToUpdate.balance) + (Number(allOpenOrders.rows[i].amount) - Number(allOpenOrders.rows[i].fees))
                await walletToUpdate.save()
            }

            let openOrderUpdate = await Order.findBy({
		   		id: allOpenOrders.rows[i].id
		   	})

            openOrderUpdate.status = 1
		   	await openOrderUpdate.save()

		   	return response.json({
				status: "DONE"
			})
		}

		return response.json({
			status: "OK"
		})
	}
}

module.exports = AutoCompleteOrderController
