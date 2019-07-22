'use strict'

const Env = use('Env')
const Mail = use('Mail')
const axios = use('axios')
const User = use('App/Models/User')
const Order = use('App/Models/Order')
const { validate } = use('Validator')
const Address = use('App/Models/Address')
const StopOrder = use('App/Models/StopOrder')

class TradingController {

    async buy({ params, request, response, auth, antl }) {

        const rules = {
            price: 'required',
            amount: 'required',
            total: 'required',
            pair: 'required',
            currency: 'required',
            current_price: 'required'
        }

        const messages = {
            'price.required'    : antl.formatMessage('messages.price_required'),
            'amount.required'   : antl.formatMessage('messages.amount_required'),
            'total.required'    : antl.formatMessage('messages.total_required'),
            'pair.required'     : antl.formatMessage('messages.pair_required'),
            'currency.required' : antl.formatMessage('messages.currency_required')
        }

        let placeOrderPrice = Number(request.body.price)
        let theCurrentPrice = Number(request.body.current_price)

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            var errors = validation.messages()
            return response.json({ success : false, message : errors })
        }

        const data = request.body
        const user = auth.user

        if( ! user ){
            return response.json({ 
                success : false, 
                message : antl.formatMessage('messages.not_logged_in') 
            })
        }

        var balance = 0

        // check which currency user is selling to buy
        if( data.currency == 'usd' ) {
            balance = user.usd_balance
        } else if( data.currency == 'euro' ) {
            balance = user.euro_balance
        } else {
            const balanceAddress = await Address
                                     .query()
                                     .where('currency', data.currency)
                                     .where('user_id', user.id)
                                     .first()
            if( balanceAddress ) {
                balance = balanceAddress.balance
            }
        }

        var order_type = 0

        if( data.stop_limit == '' ){
            data.stop_limit = 0
        } else if( data.stop_limit != '' ){
            data.stop_limit = data.stop_limit
        }

        var totalperc = ( (Number(data.total) * Number(data.feesperc) ) / 100 ); 
        data.total =  Number(data.total) + Number(totalperc)

        // calculate order amount
        var total = parseFloat(data.price) * parseFloat(data.amount)

        // check either user have sufficient balance or not
        if( balance < total ){
            return response.json({
                success: false, 
                message: 'You do not have sufficient balance you must have ' + Number(data.total).toFixed(8) + ' ' +data.currency+ ' with fee to place order'
            })
        }

        var against = 0
        var status = 0
        var availableOrder = ''

        // check either user placing order agains another order or not
        if( data.against != '' ) {

            // find any order available to fullfill user's order
            availableOrder = await Order
                                    .query()
                                    .select('id', 'remain', 'status', 'user_id')
                                    .where('status', 0)
                                    .where('pair', data.pair)
                                    .where('remain', '>=', data.amount)
                                    .where('user_id', '!=', user.id)
                                    .where('price', data.price)
                                    .where('id', data.against)
                                    .where('order_type', 1)
                                    .first()

        } else {

            // find any order available to fullfill user's order
            availableOrder = await Order
                                    .query()
                                    .select('id', 'remain', 'status', 'user_id')
                                    .where('status', 0)
                                    .where('pair', data.pair)
                                    .where('remain', '>=', data.amount)
                                    .where('user_id', '!=', user.id)
                                    .where('price', data.price)
                                    .where('order_type', 1)
                                    .first()

        }

        // check either order available or not
        if( availableOrder ) {

            against = availableOrder.id
            status = 1

            // decrease remaining avialable order amount
            availableOrder.remain = (Number(availableOrder.remain) - Number(data.amount)).toFixed(8)

            // check either order complete or not
            if(availableOrder.remain == 0){
                availableOrder.status = 1
            }

            // save available order
            await availableOrder.save()

            // find available order's user detail
            const againstUser = await User.find(availableOrder.user_id)

            // add order's amount in available order's user's wallet
            if( data.currency == 'usd' ){
                againstUser.usd_balance = againstUser.usd_balance + total
            } else if( data.currency == 'euro' ){
                againstUser.euro_balance = againstUser.euro_balance + total
            }

            await againstUser.save()

            const userWallet = await Address
                                     .query()
                                     .select('public_key','balance')
                                     .where('currency', data.derive_currency)
                                     .where('user_id', user.id)
                                     .first()

            // // get user's wallet address
            // const adminWallet = await Address
            //                           .query()
            //                           .select('public_key', 'private_key')
            //                           .where('currency', data.derive_currency)
            //                           .where('user_id', 1)
            //                           .first()
                                      
            var mainbalupdate =  Number(userWallet.balance) + Number(data.amount)
            var mainbalupdate =  mainbalupdate.toFixed(8)
                                    
            const updateWalletunew = await Address
                                    .query()
                                    .where('currency', data.derive_currency)
                                    .where('user_id', user.id)
                                    .update({ balance: mainbalupdate})
        }

        // Auto complete order
        if( placeOrderPrice >= theCurrentPrice ) {

            const placedOrderAddress = await Address.findBy({
                currency: data.derive_currency,
                user_id: user.id
            })

            if( placedOrderAddress ) {
                placedOrderAddress.balance = Number(placedOrderAddress.balance) + Number(data.amount)
                await placedOrderAddress.save()
            }
        }

        // save order detail
        const order = await new Order()

        order.user_id       = user.id
        order.price         = data.price
        order.amount        = data.amount
        order.fees        = totalperc
        order.remain        = data.amount
        order.total         = data.total
        order.pair          = data.pair
        order.order_type    = order_type
        order.order_against = against
        order.status        = (placeOrderPrice >= theCurrentPrice) ? 1 : 0
        order.stop_amout     = data.stop_limit
        await order.save()

        // deduct fiat balance from user's account
        if( data.currency == 'usd' ) {
            //user.usd_balance = user.usd_balance - total
            user.usd_balance = user.usd_balance - data.total
        } else if( data.currency == 'euro' ) {
            //user.euro_balance = user.euro_balance - total
            user.euro_balance = user.euro_balance - data.total
        }

        await user.save()

        var mailData = {
            transaction_type : 'buy',
            name : auth.user.name,
            pair : data.pair,
            amount : data.amount,
        }

        // send notification mail to admin 
        await Mail.send('emails.support.transaction', mailData, (message) => {
            message 
            .to('admin@zithex.com')
            .cc('support@zithex.com')
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('New Transaction Request')
        })

        return response.json({ success : true, message : antl.formatMessage('messages.order_placed') })
    }
    
    async exchangebuy({ params, request, response, auth, antl }){

        const rules = {
            price: 'required',
            amount: 'required',
            total: 'required',
            pair: 'required',
            currency: 'required'
        }

        const messages = {
            'price.required'    : antl.formatMessage('messages.price_required'),
            'amount.required'   : antl.formatMessage('messages.amount_required'),
            'total.required'    : antl.formatMessage('messages.total_required'),
            'pair.required'     : antl.formatMessage('messages.pair_required'),
            'currency.required' : antl.formatMessage('messages.currency_required')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            var errors = validation.messages()
            return response.json({ success : false, message : errors })
        }

        const data = request.body
        const user = auth.user

        if( ! user ){
            return response.json({
                success : false, 
                message : antl.formatMessage('messages.not_logged_in')
            })
        }

        var balance = 0

        // check which currency user is selling to buy
        if( data.currency == 'usd' ){
            balance = user.usd_balance
        } else if( data.currency == 'euro' ){
            balance = user.euro_balance
        }

        var order_type = 5

        if( data.stop_limit == '' ){
            data.stop_limit = 0
        } else if( data.stop_limit != '' ){
            data.stop_limit = data.stop_limit
        }

        var totalperc = ((Number(data.total)*Number(data.feesperc))/100); 
        data.total =  Number(data.total) + Number(totalperc)

        // calculate order amount 
        var total = parseFloat(data.price) * parseFloat(data.amount)

        // check either user have sufficient balance or not
        if( balance < total ){
            return response.json({
                success: false,
                message: 'You do not have sufficient balance you must have ' + Number(total).toFixed(8) + ' ' +data.currency+ ' with fee to place order'
            })
        }

        var against = 0

        const userWallet = await Address
                                 .query()
                                 .select('balance')
                                 .where('currency', data.derive_currency)
                                 .where('user_id', user.id)
                                 .first()

        if(!userWallet.balance) {
            userWallet.balance = 0
        }

        var dbalanace = Number(userWallet.balance) + Number(data.amount)
        var ddbalanace = dbalanace.toFixed(8);

        // get user's wallet address
        const updateWallet = await Address
                                .query()
                                .where('currency', data.derive_currency)
                                .where('user_id', user.id)
                                .update({ balance: ddbalanace})

        // save order detail
        const order = await new Order()

        order.user_id       = user.id
        order.price         = data.price
        order.amount        = data.amount
        order.remain        = data.amount
        order.fees          = totalperc
        order.total         = data.total
        order.pair          = data.pair
        order.order_type    = order_type
        order.order_against = against
        order.status        = 1
        order.stop_amout        = data.stop_limit

        await order.save()

        // deduct fiat balance from user's account
        if( data.currency == 'usd' ){
            user.usd_balance = user.usd_balance - data.total
        } else if( data.currency == 'euro' ){
            user.euro_balance = user.euro_balance - data.total
        }
        
        await user.save() 

        var mailData = {
            transaction_type : 'exchange buy',
            name : auth.user.name,
            pair : data.pair,
            amount : data.amount,
        }

        // send notification mail to admin 
        await Mail.send('emails.support.transaction', mailData, (message) => {
            message 
            .to('admin@zithex.com')
            .cc('support@zithex.com')
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('New Transaction Request')
        })

        return response.json({ success : true, message : antl.formatMessage('messages.exchange_placed') })
    }
    
    async orderstopbuy({ params, request, response, auth, antl }){

        const data = request.body

        // find any order available to fullfill user's order
        const  stoporder = await StopOrder
                                .query()
                                .select('id', 'user_id', 'price', 'amount', 'total', 'pair', 'stop_amout')
                                .where('id', data.stopid)
                                .where('order_type', 3)
                                .where('status', 0).limit(1)
                                .fetch()
                                    
        if (stoporder.rows[0] !='') {

            const user = auth.user

            if( ! user ){
                return response.json({ success : false, message : antl.formatMessage('messages.not_logged_in') })
            }

            var balance = 0

            // check which currency user is selling to buy
            if( data.currency == 'usd' ){
                balance = user.usd_balance
            } else if( data.currency == 'euro' ){
                balance = user.euro_balance
            }

            // calculate order amount
            // check either user have sufficient balance or not
            if( balance < stoporder.rows[0].total ){
                return response.json({ success : false, message : antl.formatMessage('messages.insufficient_balance') })
            }

            var against = 0
            var status = 0
            var availableOrder = ''

            // check either user placing order agains another order or not
            if( data.against != '' ) {
   
                // find any order available to fullfill user's order
                availableOrder = await Order
                                        .query()
                                        .select('id', 'remain', 'status', 'user_id')
                                        .where('status', '0')
                                        .where('pair', stoporder.rows[0].pair)
                                        .where('remain', '>=', stoporder.rows[0].amount)
                                        .where('user_id', '!=', user.id)
                                        .where('price', stoporder.rows[0].price)
                                        .where('id', against)
                                        .where('order_type', 1)
                                        .first()
                                        
            } else {

                // find any order available to fullfill user's order
                availableOrder = await Order
                                    .query()
                                    .select('id', 'remain', 'status', 'user_id')
                                    .where('status', '0')
                                    .where('pair', stoporder.rows[0].pair)
                                    .where('remain', '>=', stoporder.rows[0].amount)
                                    .where('user_id', '!=', user.id)
                                    .where('price', stoporder.rows[0].price)
                                    .where('order_type', 1)
                                    .first()

            }


            // check either order available or not
            if( availableOrder ) {

                against = availableOrder.id
                status = 1

                // decrease remaining avialable order amount
                availableOrder.remain = (Number(availableOrder.remain) - Number(stoporder.rows[0].amount)).toFixed(6)

                // check either order complete or not
                if(availableOrder.remain == 0){
                    availableOrder.status = 1
                }

                // save available order
                await availableOrder.save()

                // find available order's user detail
                const againstUser = await User.find(availableOrder.user_id)

                // add order's amount in available order's user's wallet
                if( data.currency == 'usd' ) {
                    againstUser.usd_balance = againstUser.usd_balance + total
                    await againstUser.save()
                } else if( data.currency == 'euro' ) {
                    againstUser.euro_balance = againstUser.euro_balance + total
                    await againstUser.save()
                }

                const userWallet = await Address
                                         .query()
                                         .select('public_key')
                                         .where('currency', data.derive_currency)
                                         .where('user_id', user.id)
                                         .first()

                // get user's wallet address
                const adminWallet = await Address
                                          .query()
                                          .select('public_key', 'private_key')
                                          .where('currency', data.derive_currency)
                                          .where('user_id', 1)
                                          .first()

                const txUrl = Env.get('CRYPTO_URL') + data.derive_currency + '/tx/' + adminWallet.private_key + '/' + adminWallet.public_key + '/' + userWallet.address + '/' + stoporder.rows[0].amount + '/' + Env.get('CRYPTO_NETWORK')

                await axios.get( txUrl ).then(txData => {
                    if( ! txData.data.success ){
                        return response.json({ success : false, message : antl.formatMessage('messages.transaction_place_failed') })
                    }
                })
            }

            // save order detail
            const order = await new Order()

            order.user_id       = user.id
            order.price         = stoporder.rows[0].price
            order.amount        = stoporder.rows[0].amount
            order.remain        = stoporder.rows[0].amount
            order.total         = stoporder.rows[0].total
            order.pair          = stoporder.rows[0].pair
            order.order_type    = 0
            order.order_against = against
            order.status        = status
            order.stop_amout    = stoporder.rows[0].stop_amout
            await order.save()

            // deduct fiat balance from user's account
            if( data.currency == 'usd' ){
                user.usd_balance = user.usd_balance - stoporder.rows[0].total
            } else if( data.currency == 'euro' ){
                user.euro_balance = user.euro_balance - stoporder.rows[0].total
            }

            await user.save()

            const updateorder = await StopOrder
                                      .query()
                                      .where('id', data.stopid)
                                      .update({ status: '1'}) 

            return response.json({ success : true, message : antl.formatMessage('messages.order_placed') })   

        } else {
            return response.json({ success : true, message : error.message })
        }
    }
    
    
    async orderstopsell({ params, request, response, auth, antl }) {

        const data = request.body

        // find any order available to fullfill user's order
        const  stoporder = await StopOrder
                                .query()
                                .select('id', 'user_id', 'price', 'amount', 'total', 'pair', 'stop_amout')
                                .where('id', data.stopid)
                                 .where('order_type', 4)
                                .where('status', 0).limit(1)
                                .fetch()

                                    
        if (stoporder.rows[0] !='') {
            const user = auth.user

            if( ! user ){
                return response.json({ success : false, message : antl.formatMessage('messages.not_logged_in') })
            }

            var balance = 0
 
            // check which currency user is selling to buy
            if( data.currency == 'usd' ){
                balance = user.usd_balance
            } else if( data.currency == 'euro' ){
                balance = user.euro_balance
            }
    
            // calculate order amount
            var total = parseFloat(stoporder.rows[0].price) * parseFloat(stoporder.rows[0].amount)

            // check either user have sufficient balance or not
            if( balance < stoporder.rows[0].total ){
                return response.json({ success : false, message : antl.formatMessage('messages.insufficient_balance') })
            }
        
            var against = 0
            var status = 0
            var availableOrder = ''

            // check either user placing order agains another order or not
            if( data.against != '' ) {

                // find any order available to fullfill user's order
                availableOrder = await Order
                                            .query()
                                            .select('id', 'remain', 'status', 'user_id')
                                            .where('status', '0')
                                            .where('pair', stoporder.rows[0].pair)
                                            .where('remain', '>=', stoporder.rows[0].amount)
                                            .where('user_id', '!=', user.id)
                                            .where('price', stoporder.rows[0].price)
                                            .where('id', against)
                                            .where('order_type', 0)
                                            .first()

            } else {

                // find any order available to fullfill user's order
                availableOrder = await Order
                                            .query()
                                            .select('id', 'remain', 'status', 'user_id')
                                            .where('status', '0')
                                            .where('pair', data.pair)
                                            .where('remain', '>=', data.amount)
                                            .where('user_id', '!=', user.id)
                                            .where('price', stoporder.rows[0].price)
                                            .where('order_type', 0)
                                            .first()
            }

            // check either order available or not
            if( availableOrder ) {

                against = availableOrder.id
                status = 1

                // decrease remaining avialable order amount
                availableOrder.remain = (Number(availableOrder.remain) - Number(data.amount)).toFixed(6)

                // check either order complete or not
                if(availableOrder.remain == 0){
                    availableOrder.status = 1
                }

                // save available order
                await availableOrder.save()

                // find available order's user detail
                const againstUser = await User.find(availableOrder.user_id)

                // add order's amount in available order's user's wallet
                if( data.currency == 'usd' ){
                    againstUser.usd_balance = againstUser.usd_balance + total
                    await againstUser.save()
                } else if( data.currency == 'euro' ){
                    againstUser.euro_balance = againstUser.euro_balance + total
                    await againstUser.save()
                }

                const userWallet = await Address
                                         .query()
                                         .select('public_key')
                                         .where('currency', data.derive_currency)
                                         .where('user_id', user.id)
                                         .first()

                // get user's wallet address
                const adminWallet = await Address
                                          .query()
                                          .select('public_key', 'private_key')
                                          .where('currency', data.derive_currency)
                                          .where('user_id', 1)
                                          .first()

                const txUrl = Env.get('CRYPTO_URL') + data.derive_currency + '/tx/' + adminWallet.private_key + '/' + adminWallet.public_key + '/' + userWallet.address + '/' + stoporder.rows[0].amount + '/' + Env.get('CRYPTO_NETWORK')

                await axios.get( txUrl ).then(txData => {
                    if( ! txData.data.success ){
                        return response.json({ success : false, message : antl.formatMessage('messages.transaction_place_failed') })
                    }
                })
            }

            // save order detail
            const order = await new Order()

            order.user_id       = user.id
            order.price         = stoporder.rows[0].price
            order.amount        = stoporder.rows[0].amount
            order.remain        = stoporder.rows[0].amount
            order.total         = stoporder.rows[0].total
            order.pair          = stoporder.rows[0].pair
            order.order_type    = 1
            order.order_against = against
            order.status        = status
            order.stop_amout    = stoporder.rows[0].stop_amout
            await order.save()

            // deduct fiat balance from user's account
            if( data.currency == 'usd' ){
                user.usd_balance = user.usd_balance - total
            } else if( data.currency == 'euro' ){
                user.euro_balance = user.euro_balance - total
            }

            await user.save()

            const updateorder = await StopOrder
                                          .query()
                                          .where('id', data.stopid)
                                          .update({ status: '1'}) 

            return response.json({ success : true, message : antl.formatMessage('messages.order_placed') })
        } else {
            return response.json({ success : true, message : error.message })
        }
    }

    async stopbuy({ params, request, response, auth, antl }){

        const rules = {
            price: 'required',
            amount: 'required',
            total: 'required',
            pair: 'required',
            currency: 'required'
        }

        const messages = {
            'price.required'    : antl.formatMessage('messages.price_required'),
            'amount.required'   : antl.formatMessage('messages.amount_required'),
            'total.required'    : antl.formatMessage('messages.total_required'),
            'pair.required'     : antl.formatMessage('messages.pair_required'),
            'currency.required' : antl.formatMessage('messages.currency_required')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            var errors = validation.messages()
            return response.json({ success : false, message : errors })
        }

        const data = request.body
        const user = auth.user

        if( ! user ){
            return response.json({ success : false, message : antl.formatMessage('messages.not_logged_in') })
        }

        var balance = 0

        // check which currency user is selling to buy
        if( data.currency == 'usd' ){
            balance = user.usd_balance
        } else if( data.currency == 'euro' ){
            balance = user.euro_balance
        }

        if( data.stop_limit == '' ){
            data.stop_limit = 0
            var order_type = 0
        } else if( data.stop_limit != '' ){
            data.stop_limit = data.stop_limit
            var order_type = 3
        }
        
        var totalperc = ((data.total*data.feesperc)/100); 
        data.total =  Number(data.total) + Number(totalperc)

        // calculate order amount
        var total = parseFloat(data.price) * parseFloat(data.amount)

        // check either user have sufficient balance or not
        if( balance < total ){
            return response.json({ success : false, message : antl.formatMessage('messages.insufficient_balance') })
        }

        var against = 0
        var status = 0
        var availableOrder = ''

        const stoporder = await new StopOrder()

        stoporder.user_id       = user.id
        stoporder.price         = data.price
        stoporder.amount        = data.amount
        stoporder.total         = data.total
        stoporder.fees         = totalperc
        stoporder.pair          = data.pair
        stoporder.order_type    = order_type
        stoporder.stop_amout    = data.stop_limit

        await stoporder.save()

        var mailData = {
            transaction_type : 'stop buy',
            name : auth.user.name,
            pair : data.pair,
            amount : data.amount,
        }

        // send notification mail to admin 
        await Mail.send('emails.support.transaction', mailData, (message) => {
            message 
            .to('admin@zithex.com')
            .cc('support@zithex.com')
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('New Transaction Request')
        })

        return response.json({ success : true, message : antl.formatMessage('messages.stop_order_placed') })
    }
    
    async stopsell({ params, request, response, auth, antl }){

        const rules = {
            stopsell_limit: 'required',
            amount: 'required',
             price: 'required',
           total: 'required',
            pair: 'required',
            currency: 'required'
        }

        const messages = {
            'price.required'    : antl.formatMessage('messages.price_required'),
            'amount.required'   : antl.formatMessage('messages.amount_required'),
            'total.required'    : antl.formatMessage('messages.total_required'),
            'pair.required'     : antl.formatMessage('messages.pair_required'),
            'currency.required' : antl.formatMessage('messages.currency_required')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            var errors = validation.messages()
            return response.json({ success : false, message : errors })
        }

        const data = request.body
        const user = auth.user

        if( ! user ){
            return response.json({ success : false, message : antl.formatMessage('messages.not_logged_in') })
        }

        // check which currency user is selling to buy
        if( data.currency == 'usd' ) {
            balance = user.usd_balance
        } else if( data.currency == 'euro' ) {
            balance = user.euro_balance
        }

        if( data.stopsell_limit == '' ) {
            data.stopsell_limit = 0
            var order_type = 0
        } else if( data.stopsell_limit != '' ) {
            data.stopsell_limit = data.stopsell_limit
            var order_type = 4
        }

        // calculate order amount
        var totalperc = ((data.amount*data.feesperc)/100); 
        data.amount =  Number(data.amount) + Number(totalperc)
        
        // get user's wallet address
        const address = await Address
                              .query()
                              .select('public_key', 'private_key')
                              .where('currency', data.currency)
                              .where('user_id', user.id)
                              .first()

        if( ! address ){
            return response.json({ success : false, message : antl.formatMessage('messages.wallet_not_found') })
        }

        const url = Env.get('CRYPTO_URL') + data.currency + '/balance/' + address.public_key + '/' + Env.get('CRYPTO_NETWORK')

        const acBalance = await axios.get( url )
        .then(acData => {
            return acData.data.balance
        })

        // check either user have sufficient balance or not
        if( acBalance < parseFloat(data.amount) ){
            return response.json({ success : false, message : antl.formatMessage('messages.insufficient_balance') })
        }

        var against = 0
        var status = 0
        var availableOrder = ''

        const stoporder = await new StopOrder()

        stoporder.user_id       = user.id
        stoporder.price         = data.price
        stoporder.amount        = data.amount
        stoporder.total         = data.total
        stoporder.pair          = data.pair
        stoporder.fees          = totalperc
        stoporder.order_type    = order_type
        stoporder.stop_amout    = data.stopsell_limit
        await stoporder.save()

        var mailData = {
                transaction_type : 'stop sell',
                name : auth.user.name,
                pair : data.pair,
                amount : data.amount,
            }

        // send notification mail to admin 
        await Mail.send('emails.support.transaction', mailData, (message) => {
            message 
            .to('admin@zithex.com')
            .cc('support@zithex.com')
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('New Transaction Request')
        })

        return response.json({ success : true, message : antl.formatMessage('messages.stop_order_placed') })
    }

    async sell({ params, request, response, auth, antl }){

        try {

            const rules = {
                price: 'required',
                amount: 'required',
                total: 'required',
                pair: 'required',
                currency: 'required',
                current_price: 'required'
            }

            const messages = {
                'price.required'    : antl.formatMessage('messages.price_required'),
                'amount.required'   : antl.formatMessage('messages.amount_required'),
                'total.required'    : antl.formatMessage('messages.total_required'),
                'pair.required'     : antl.formatMessage('messages.pair_required'),
                'currency.required' : antl.formatMessage('messages.currency_required')
            }

            const validation = await validate(request.all(), rules, messages)

            if (validation.fails()) {
                var errors = validation.messages()
                return response.json({ success : false, message : errors })
            }

            let placeOrderPrice = Number(request.body.price)
            let theCurrentPrice = Number(request.body.current_price)

            const data = request.body
            const user = auth.user

            if( ! user ) {
                return response.json({
                    success : false,
                    message : antl.formatMessage('messages.not_logged_in')
                })
            }

            // get user's wallet address
            const address = await Address
                                  .query()
                                  .select('balance')
                                  .where('currency', data.currency)
                                  .where('user_id', user.id)
                                  .first()

            var userBalance = address.balance
            
            if( ! address ){
                return response.json({
                    success : false, 
                    message : antl.formatMessage('messages.wallet_not_found')
                })
            }

    //      const url = Env.get('CRYPTO_URL') + data.currency + '/balance/' + address.public_key + '/' + Env.get('CRYPTO_NETWORK')

    //      const acBalance = await axios.get( url )
    //      .then(acData => {
                
                // acData.data.balance  = acData.data.balance.toFixed(8) 
             //    newbalance = newbalance.toFixed(8)
                // acData.data.balance = Number(acData.data.balance) + Number(newbalance)
                
    //          return acData.data.balance.toFixed(8)
    //      })

            var order_type = 1

            if( data.stop_limit == '' ) {
                data.stop_limit = 0
            } else if( data.stop_limit != '' ) {
                data.stop_limit = data.stop_limit
            }

            var totalperc = ((Number(data.amount) * Number(data.feesperc))/100);
            data.amount =  Number(data.amount) + Number(totalperc)
             
            // check either user have sufficient balance or not
            if( userBalance < parseFloat(data.amount) ){
                return response.json({
                    success: false,
                    message: 'You do not have sufficient balance you must have ' + data.amount + ' ' +data.currency+ ' with fee to place order'
                })
            }

            var against = 0
            var status = 0

            var availableOrder = ''

            // check either user placing order agains another order or not
            if( data.against != '' ) {

                // find any order available to fullfill user's order
                availableOrder = await Order
                                        .query()
                                        .select('id', 'remain', 'status', 'user_id')
                                        .where('status', '0')
                                        .where('pair', data.pair)
                                        .where('remain', '>=', data.amount)
                                        .where('user_id', '!=', user.id)
                                        .where('price', data.price)
                                        .where('id', data.against)
                                        .where('order_type', 0)
                                        .first()

            } else {

                // find any order available to fullfill user's order
                availableOrder = await Order
                                        .query()
                                        .select('id', 'remain', 'status', 'user_id')
                                        .where('status', '0')
                                        .where('pair', data.pair)
                                        .where('remain', '>=', data.amount)
                                        .where('user_id', '!=', user.id)
                                        .where('price', data.price)
                                        .where('order_type', 0)
                                        .first()
            }

            // check either order available or not
            if( availableOrder ) {

                against = availableOrder.id
                status = 1

                // decrease remaining avialable order amount
                availableOrder.remain = (Number(availableOrder.remain) - Number(data.amount)).toFixed(6)

                // check either order complete or not
                if(availableOrder.remain == 0){
                    availableOrder.status = 1
                }

                // save available order
                await availableOrder.save()

                // find available order's user detail
                const againstUser = await Address.query()
                                                 .select('balance')
                                                 .where('user_id', availableOrder.user_id)
                                                 .where('currency', data.currency)
                                                 .first()

                if( ! againstUser ){
                    return response.json({
                        success: false, 
                        message : antl.formatMessage('messages.against_user_not_wallet')
                    })
                }

                // const txUrl = Env.get('CRYPTO_URL') + data.currency + '/tx/' + address.private_key + '/' + address.public_key + '/' + againstUser.public_key + '/' + data.amount + '/' + Env.get('CRYPTO_NETWORK')

                // await axios.get( txUrl ).then(txData => {

                //  if( ! txData.data.success ){
                //      return response.json({ success : false, message : antl.formatMessage('messages.transaction_place_failed') })
                //  }

                // })

                // deduct fiat balance from user's account
                if( data.currency == 'usd' ){
                    user.usd_balance = user.usd_balance + (Number(data.total))
                } else if( data.currency == 'euro' ){
                    user.euro_balance = user.euro_balance + (Number(data.total))
                }

                await user.save()

            } else {

                // get user's wallet address
                // const adminWallet = await Address
                //                           .query()
                //                           .select('public_key','balance')
                //                           .where('currency', data.currency)
                //                           .where('user_id', 1)
                //                           .first()

                // if( ! adminWallet ){
                //     return response.json({ success : false, message : antl.formatMessage('messages.admin_not_have_wallet') })
                // }
                
                // const url = Env.get('CRYPTO_URL') + data.currency + '/balance/' + address.public_key + '/' + Env.get('CRYPTO_NETWORK')
    //          const acBalancemain = await axios.get( url )

                var totalbalancer = Number(address.balance)
                var totalbalancer = totalbalancer.toFixed(8)

                if( totalbalancer < parseFloat(data.amount) ) {
                    return response.json({
                        success: false, 
                        message: 'You do not have sufficient balance you must have ' + Number(data.amount).toFixed(8) + ' ' +data.currency+ ' with fee to place order'
                    })
                } else {

                    address.balance = (address.balance).toFixed(8)
                    var addressnewbal = Number(address.balance) - Number(data.amount)
                    var addressnewbal = addressnewbal.toFixed(8)

                    if(addressnewbal <= 0) {
                        var updatevertual = 0
                    } else {
                        var updatevertual = addressnewbal
                    }

                    const updateWallety = await Address 
                                            .query()
                                            .where('currency', data.currency)
                                            .where('user_id', user.id)
                                            .update({ balance: updatevertual})

                    // const txUrl = Env.get('CRYPTO_URL') + data.currency + '/tx/' + address.private_key + '/' + address.public_key + '/' + adminWallet.public_key + '/' + addressnewbal + '/' + Env.get('CRYPTO_NETWORK')

                    // await axios.get( txUrl ).then(txData => {
                    //     if( ! txData.data.success ){
                    //         return response.json({ success : false, message : antl.formatMessage('messages.transaction_place_failed') })
                    //     }
                    // })
                }

                // deduct fiat balance from user's account
                if( data.currency == 'usd' ){
                    user.usd_balance = user.usd_balance + Number(data.total)
                } else if( data.currency == 'euro' ){
                    user.euro_balance = user.euro_balance + Number(data.total)
                }

                await user.save()
            }

            if( placeOrderPrice <= theCurrentPrice ) {

                var balAddCurrency = data.derive_currency

                if( balAddCurrency == 'usd' ){
                    user.usd_balance = Number(user.usd_balance) + Number(data.total)
                    await user.save()
                } else if( balAddCurrency == 'euro' ){
                    user.euro_balance = Number(user.euro_balance) + Number(data.total)
                    await user.save()
                } else {

                    const placedOrderAddress = await Address.findBy({
                        currency: balAddCurrency,
                        user_id: user.id
                    })

                    placedOrderAddress.balance = Number(placedOrderAddress.balance) + Number(data.amount)
                    await placedOrderAddress.save()
                }

            }

            // save order detail
            const order = await new Order()

            order.user_id       = user.id
            order.price         = data.price
            order.amount        = data.amount
            order.fees          = totalperc
            order.remain        = data.amount
            order.total         = data.total
            order.pair          = data.pair
            order.order_type    = 1
            order.order_against = against 
            order.status        = (placeOrderPrice <= theCurrentPrice) ? 1 : 0
            order.stop_amout    = data.stop_limit 
            await order.save()

            var mailData = {
                transaction_type: 'sell',
                name: auth.user.name,
                pair: data.pair,
                amount: data.amount
            }

            // send notification mail to admin 
            await Mail.send('emails.support.transaction', mailData, (message) => {
                message 
                .to('admin@zithex.com')
                .cc('support@zithex.com')
                .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
                .subject('New Transaction Request')
            })

            return response.json({
                success : true, 
                message: antl.formatMessage('messages.order_placed')
            })
        } catch(error){
            return response.json({
                success: false,
                message: error.message
            })
        }
    }

    // Exchange Sell
    async exchangesell({ params, request, response, auth, antl }){

        const rules = {
            price: 'required',
            amount: 'required',
            total: 'required',
            pair: 'required',
            currency: 'required'
        }

        const messages = {
            'price.required'    : antl.formatMessage('messages.price_required'),
            'amount.required'   : antl.formatMessage('messages.amount_required'),
            'total.required'    : antl.formatMessage('messages.total_required'),
            'pair.required'     : antl.formatMessage('messages.pair_required'),
            'currency.required' : antl.formatMessage('messages.currency_required')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            var errors = validation.messages()
            return response.json({ success : false, message : errors })
        }

        const data = request.body
        const user = auth.user

        const address = await Address
                                  .query()
                                  .select('balance')
                                  .where('currency', data.currency)
                                  .where('user_id', user.id)
                                  .first()

        var userBalance = address.balance

        if( ! address ){
            return response.json({ success : false, message : antl.formatMessage('messages.wallet_not_found') })
        }

        // const url = Env.get('CRYPTO_URL') + data.currency + '/balance/' + address.public_key + '/' + Env.get('CRYPTO_NETWORK')

        // const acBalance = await axios.get( url )
        // .then(acData => {
        //     acData.data.balance  = acData.data.balance.toFixed(8) 
        //     newbalance = newbalance.toFixed(8)
        //     acData.data.balance = Number(acData.data.balance) + Number(newbalance)
        //     return acData.data.balance.toFixed(8)
        // })

        var order_type = 5

        if( data.stop_limit == '' ){
            data.stop_limit = 0
        } else if( data.stop_limit != '' ){
            data.stop_limit = data.stop_limit
        }

        var totalperc = (( Number(data.amount) * Number(data.feesperc) ) / 100);
        data.amount =  Number(data.amount) + Number(totalperc)
             
        // check either user have sufficient balance or not
        if( userBalance < parseFloat(data.amount) ){
            return response.json({
                success: false,
                message: 'You do not have sufficient balance you must have ' + Number(data.amount).toFixed(8) + ' ' +data.currency+ ' with fee to place order'
            })
        }

        var against = 0
        var status = 0
        var availableOrder = ''

        const userWallet = await Address
                                 .query()
                                 .select('balance')
                                 .where('currency', data.currency)
                                 .where('user_id', user.id)
                                 .first()

        var dbalanace = Number(userWallet.balance) - Number(data.amount)
        var ddbalanace = dbalanace.toFixed(8);

        // get user's wallet address
        const updateWallet = await Address
                                .query()
                                .where('currency', data.currency)
                                .where('user_id', user.id)
                                .update({ balance: ddbalanace})

        // save order detail
        const order = await new Order()

        order.user_id       = user.id
        order.price         = data.price
        order.amount        = data.amount
        order.remain        = data.amount
        order.total         = data.total
        order.pair          = data.pair
        order.fees          = totalperc
        order.order_type    = order_type
        order.order_against = against
        order.status        = 1
        order.stop_amout    = data.stop_limit
        await order.save()

        var newpair = data.pair
        var lastChar = newpair.substr(newpair.length - 3);

        // deduct fiat balance from user's account
        if( lastChar == 'usd' ){
            user.usd_balance = Number(user.usd_balance) + Number(data.total)
        } else if( lastChar == 'eur' ){
            user.euro_balance = Number(user.euro_balance) + Number(data.total)
        }

        await user.save() 

        var mailData = {
            transaction_type : 'exchange sell',
            name : auth.user.name,
            pair : data.pair,
            amount : data.amount,
        }

        // send notification mail to admin 
        await Mail.send('emails.support.transaction', mailData, (message) => {
            message 
            .to('admin@zithex.com')
            .cc('support@zithex.com')
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('New Transaction Request')
        })

        return response.json({ success : true, message : antl.formatMessage('messages.exchange_placed') })
    }
}

module.exports = TradingController
