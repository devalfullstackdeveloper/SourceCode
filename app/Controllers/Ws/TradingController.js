'use strict'

const Order = use('App/Models/Order')

class TradingController {

  constructor ({ socket, request, auth }) {
    this.socket = socket
    this.request = request
    this.auth = auth
  }

  async onMessage (message) {

    const orders = {}

    orders.openOrders = {}
    orders.orders = {}
    orders.myHistory = {}

   // var user = null

    var pairL = ((this.socket.topic).split(':'))[1]
    var pair = (pairL).split('-')[0]
    
    var user = (pairL).split('-')[1]
    // currency = currency.split('/')

    

    /*try {
        user = await this.auth.getUser()
    } catch(e) {
        console.log('error')
    }*/

    //console.log(user)


    if( user != null ) {

        orders.openOrders = await Order
                                .query()
                                .where('status', 0)
                                .where('user_id', user)
                                .orderBy('id', 'DESC')
                                .fetch()

        orders.orders = await Order
                                .query()
                                .whereNotIn('status', [0])
                                .where('user_id', user)
                                .whereRaw('created_at >= NOW() - INTERVAL 1 DAY')
                                .orderBy('id', 'DESC')
                                .fetch()

        orders.myHistory = await Order
                                .query()
                                .whereNotIn('status', [0])
                                .where('user_id', user)
                                .where('pair', pair)
                                //.whereRaw('created_at >= NOW() - INTERVAL 1 DAY')
                                .orderBy('id', 'DESC')
                                .fetch()

    }

    orders.buy = await Order
                .query()
                .select('price', 'remain')
                .where('status', 0)
                .where('order_type', 0)
                .where('pair', pair)
                .orderBy('id', 'DESC')
                .fetch()

    orders.sell = await Order
                .query()
                .select('price', 'remain')
                .where('status', 0)
                .where('order_type', 1)
                .where('pair', pair)
                .orderBy('id', 'DESC')
                .fetch()

    orders.history = await Order
                .query()
                .select('price', 'amount', 'total')
                .where('pair', pair)
                .where('status', 1)
                .orderBy('id', 'DESC')
                .fetch()

  	this.socket.broadcastToAll('message', orders)
  	    
    //this.socket.broadcastToAll('message', {a: pair, b:user})

  }

  onClose () {
    // same as: socket.on('close')
  }

  onError () {
    // same as: socket.on('error')
  }

}

module.exports = TradingController
