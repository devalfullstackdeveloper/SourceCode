'use strict'

const User = use('App/Models/User')
const Order = use('App/Models/Order')
const Pair = use('App/Models/Pair')
const Database = use('Database')

class DashboardController {

	async index({request, response, view}){

		const data = {}

		data.users = await User.query().count('id AS users').where('users.is_admin', 0).first()
		data.pairs = await Pair.query().count('id AS pairs').where('deleted_at', null).first()
		data.orders = await Order.query().count('id AS orders').first()
		
		data.usersStatics = await Database.raw('SELECT created_at, COUNT(id) AS users FROM users GROUP BY MONTH(created_at),id')
		data.usersStatics = JSON.stringify(data.usersStatics[0])

		data.ordersStatics = await Database.raw('SELECT created_at, COUNT(id) AS orders FROM orders GROUP BY MONTH(created_at),id')  
		data.ordersStatics = JSON.stringify(data.ordersStatics[0])

		data.dailyVisitors = await Database.raw('SELECT COUNT(id) AS visitors, DATE(created_at) AS created_at FROM visit_histories GROUP BY DATE(created_at),id')
		data.dailyVisitors = JSON.stringify(data.dailyVisitors[0])

		data.weeklyVisitors = await Database.raw('SELECT COUNT(id) AS visitors, DATE(created_at) AS created_at FROM visit_histories GROUP BY WEEK(created_at),id')
		data.weeklyVisitors = JSON.stringify(data.weeklyVisitors[0])

		data.monthlyVisitors = await Database.raw('SELECT COUNT(id) AS visitors, DATE(created_at) AS created_at FROM visit_histories GROUP BY MONTH(created_at),id')
		data.monthlyVisitors = JSON.stringify(data.monthlyVisitors[0])
		data.usersStatics = await Database.raw('SELECT created_at, COUNT(id) AS users FROM users GROUP BY created_at,id')
		data.usersStatics = JSON.stringify(data.usersStatics[0])

		data.ordersStatics = await Database.raw('SELECT created_at, COUNT(id) AS orders FROM orders GROUP BY created_at,id')  
		data.ordersStatics = JSON.stringify(data.ordersStatics[0])

		data.dailyVisitors = await Database.raw('SELECT COUNT(id) AS visitors, DATE(created_at) AS created_at FROM visit_histories GROUP BY created_at,id')
		data.dailyVisitors = JSON.stringify(data.dailyVisitors[0])

		data.weeklyVisitors = await Database.raw('SELECT COUNT(id) AS visitors, DATE(created_at) AS created_at FROM visit_histories GROUP BY created_at,id')
		data.weeklyVisitors = JSON.stringify(data.weeklyVisitors[0])

		data.monthlyVisitors = await Database.raw('SELECT COUNT(id) AS visitors, DATE(created_at) AS created_at FROM visit_histories GROUP BY created_at,id')
		data.monthlyVisitors = JSON.stringify(data.monthlyVisitors[0])
		return view.render('admin.dashboard.dashboard', { data : data })

	}

}

module.exports = DashboardController
