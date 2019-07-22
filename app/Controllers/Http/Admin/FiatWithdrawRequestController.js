'use strict'

const Address = use('App/Models/Address')
const axios = use('axios')
const { validate } = use('Validator')
const Transaction = use('App/Models/Transaction')
const Env = use('Env')

class FiatWithdrawRequestController {

    async index({ request, response, view }) {
        const page = (request.get().page !== undefined) ? request.get().page : 1

        const transactions = await Transaction
            .query()
            .select('transactions.*', 'users.name', 'users.email')//, 'currency', 'bank_name', 'branch_name', 'ac_holder', 'amount', 'ac_no', 'swift_code', 'iban_number', 'transactions.mobile', 'address', 'city', 'country', 'status','created_at')
            .leftJoin('users', 'transactions.user_id', 'users.id')
            .where('tx_type', 0)
            .fetch();
        return view.render('admin.FiatWithdrawRequest.view', { allTransactions: transactions })

    }

}

module.exports = FiatWithdrawRequestController