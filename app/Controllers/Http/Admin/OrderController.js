'use strict'

const Database = use('Database')
const User = use('App/Models/User')
const { validate } = use('Validator')
const Order = use('App/Models/Order')

class OrderController {

	async index({ request, view }) {

		const page = (request.get().page !== undefined) ? request.get().page : 1
		const data = {}

		data.orders = await Order
							.query()
							.select('orders.id', 'orders.user_id', 'orders.order_type', 'orders.status', 'orders.price', 'orders.fees', 'orders.pair', 'orders.remain', 'orders.total', 'orders.amount', 'orders.created_at', Database.raw("users.name"))
							.innerJoin('users', 'users.id', 'orders.user_id')
							.where('orders.deleted_at', null)
							.orderBy('id', 'DESC')
							.paginate(page)

		data.btcFees = await Order
							.query()
							.where('pair', 'LIKE', '%btc')
							.whereIn('order_type', [0,1,3,4])
							.where('status', 1)
							.sum('fees as fee')

		data.usdFees = await Order
							.query()
							.where('pair', 'LIKE', '%usd')
							.whereIn('order_type', [0,1,3,4])
							.where('status', 1)
							.sum('fees as fee')

		data.euroFees = await Order
							.query()
							.where('pair', 'LIKE', '%euro')
							.whereIn('order_type', [0,1,3,4])
							.where('status', 1)
							.sum('fees as fee')

		data.ethFees = await Order
							.query()
							.where('pair', 'LIKE', '%eth')
							.whereIn('order_type', [0,1,3,4])
							.where('status', 1)
							.sum('fees as fee')

		data.btcExchangeFees = await Order
							.query()
							.where('pair', 'LIKE', '%btc')
							.whereIn('order_type', [5])
							.where('status', 1)
							.sum('fees as fee')

		data.usdExchangeFees = await Order
							.query()
							.where('pair', 'LIKE', '%usd')
							.whereIn('order_type', [5])
							.where('status', 1)
							.sum('fees as fee')

		data.euroExchangeFees = await Order
							.query()
							.where('pair', 'LIKE', '%euro')
							.whereIn('order_type', [5])
							.where('status', 1)
							.sum('fees as fee')

		data.ethExchangeFees = await Order
							.query()
							.where('pair', 'LIKE', '%eth')
							.whereIn('order_type', [5])
							.where('status', 1)
							.sum('fees as fee')

		return view.render('admin.orders.list', data)
	}
}

module.exports = OrderController