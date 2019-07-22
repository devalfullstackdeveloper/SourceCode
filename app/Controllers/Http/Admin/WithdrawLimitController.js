'use strict'

const WithdrawLimit = use('App/Models/WithdrawLimit')
const { validate } = use('Validator')

class WithdrawLimitController {

	/*
	| --------------------------------------------------
	| Manage Withdraw Limits Controller
	| --------------------------------------------------
	*/

	/**
	 * Show withdraw limits for btc currency only
	 */
	async index({ request, view }) {

		const limits = await WithdrawLimit.findBy({
		    currency: 'btc'
		})

		return view.render('admin.withdrawLimits.index', {
		    limits: limits ? limits.toJSON() : null
		})
	}

	/**
	 * Update withdraw limits btc currency only
	 */
	async update({ request, response, session }) {

		// Validation rules
		const rules = {
            levelOneAmount: 'required',
			levelTwoAmount: 'required',
            levelThreeAmount: 'required'
        }
		
		// Validation messages
		const messages = {
            'levelOneAmount.required': 'Level one amount is required.',
			'levelTwoAmount.required': 'Level two amount is required.',
            'levelThreeAmount.required': 'Level three amount is required.',
        }

        // Initializing validation to test
		const validation = await validate(request.all(), rules, messages)

		// Send error messages if validations failed
        if (validation.fails()) {
			session.withErrors(validation.messages()).flashExcept()
			return response.redirect('back')
		}

		// Get btc withdraw limits
		const limits = await WithdrawLimit.findBy({
		    currency: 'btc'
		})

		// Update withdraw limits
		limits.level_one = request.body.levelOneAmount
		limits.level_two = request.body.levelTwoAmount
		limits.level_three = request.body.levelThreeAmount
		await limits.save()

		session.flash({success: 'Withdraw limits for all levels updated.'})
		return response.redirect('back')
	}
}

module.exports = WithdrawLimitController
