const { hooks } = require('@adonisjs/ignitor')

hooks.after.providersBooted(() => {

	const View = use('View')

	View.global('status', function (status) {
		switch(status) {
			case 0:
				return this.safe('<span class="text-warning">Pending</span>')
				break
			case 1:
				return this.safe('<span class="text-success">Active</span>')
				break
			case 2:
				return this.safe('<span class="text-danger">Inactive</span>')
				break
			default:
				return this.safe('<span class="text-danger">Error</span>')
				break
		}
	})

	View.global('round', function (number, decimals = 0) {
		return Number(number).toFixed(decimals)
	})

	View.global('date_format', function (date) {
		var date = new Date(date)
		var day = date.getDate();
		var month = date.getMonth() + 1;
		return ( ( day > 9 ) ? day : '0' + day ) + '-' + ( ( month > 9 ) ? month : '0' + month ) + '-' + date.getFullYear();
	})
})