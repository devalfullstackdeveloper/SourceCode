'use strict'

const Feature = use('App/Models/Feature')

class FeatureController {

	async index({ view }){

		const data = {}

		data.trading = await Feature.query().where('feature', 'trading').first()
		data.deposit = await Feature.query().where('feature', 'deposit').first()
		data.withdraw = await Feature.query().where('feature', 'withdraw').first()
		data.wallet = await Feature.query().where('feature', 'wallet').first()

		return view.render('admin.cms.feature', data)

	}


	async saveFeatures({ request, response, session }){

		const trading = await Feature.query().where('feature', 'trading').first()
		const deposit = await Feature.query().where('feature', 'deposit').first()
		const withdraw = await Feature.query().where('feature', 'withdraw').first()
		const wallet = await Feature.query().where('feature', 'wallet').first()

		if(request.file('trading_image')){

			const trading_image = request.file('trading_image', {
				types: ['image'],
				size: '2mb'
			})

			const tradingImageName = new Date().getTime() + '.' + trading_image.subtype

			await trading_image.move('public/images/features', {
				name: tradingImageName,
				overwrite: true
			})

			if (!trading_image.moved()) {
				session.flash({ error : trading_image.error() })
				return response.route('admin.features')
			}

			trading.image = tradingImageName

		}

		if(request.file('deposit_image')){

			const deposit_image = request.file('deposit_image', {
				types: ['image'],
				size: '2mb'
			})

			const depositImageName = new Date().getTime() + '.' + deposit_image.subtype

			await deposit_image.move('public/images/features', {
				name: depositImageName,
				overwrite: true
			})

			if (!deposit_image.moved()) {
				session.flash({ error : deposit_image.error() })
				return response.route('admin.features')
			}

			deposit.image = depositImageName

		}

		if(request.file('withdraw_image')){

			const withdraw_image = request.file('withdraw_image', {
				types: ['image'],
				size: '2mb'
			})

			const withdrawImageName = new Date().getTime() + '.' + withdraw_image.subtype

			await withdraw_image.move('public/images/features', {
				name: withdrawImageName,
				overwrite: true
			})

			if (!withdraw_image.moved()) {
				session.flash({ error : withdraw_image.error() })
				return response.route('admin.features')
			}

			withdraw.image = withdrawImageName

		}

		if(request.file('wallet_image')){

			const wallet_image = request.file('wallet_image', {
				types: ['image'],
				size: '2mb'
			})

			const walletImageName = new Date().getTime() + '.' + wallet_image.subtype

			await wallet_image.move('public/images/features', {
				name: walletImageName,
				overwrite: true
			})

			if (!wallet_image.moved()) {
				session.flash({ error : wallet_image.error() })
				return response.route('admin.features')
			}

			wallet.image = walletImageName

		}

		trading.content = request.body.trading_content
		deposit.content = request.body.deposit_content
		withdraw.content = request.body.withdraw_content
		wallet.content = request.body.wallet_content

		await trading.save()
		await deposit.save()
		await withdraw.save()
		await wallet.save()

		session.flash({ success : 'Feature updated successfully' })
		return response.route('admin.features')

	}

}

module.exports = FeatureController
