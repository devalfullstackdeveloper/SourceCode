'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.group(() => {
	Route.get('/', 							'HomeController2.index').as('home');
	Route.get('/home', 						'HomeController2.index').as('landing');
	Route.get('/index', 					'HomeController2.index').as('index');
	// Route.get('/home2', 					'HomeController2.home2').as('home2');	
	Route.get('/favourite/:pair', 			'HomeController.favourite').as('favourite');
	Route.get('/who-we-are', 				'PageController.whoWeAre').as('whoweare');
	// Route.get('/team', 						'PageController.team').as('team');
	Route.get('/hire-trader', 				'PageController.hiretrader');
	Route.post('/hire-trader', 				'PageController.hireTraderSave').as('hire-trader');
	Route.get('/faq', 						'PageController.faq').as('faq');
	Route.get('/security', 					'PageController.security').as('security');
	Route.get('/how-it-works', 				'PageController.howItWorks').as('howitworks');
	// Route.get('/support', 					'PageController.contact').as('contact');
	Route.get('/news', 						'PageController.news').as('news');
	Route.get('/contact', 					'PageController.contact').as('contact');
	Route.post('/contact', 					'PageController.submitContact');
	Route.get('/features', 					'PageController.features').as('features');
	// Route.get('/legals', 					'PageController.legals').as('legals');
	Route.get('/legals', 					'PageController.legals').as('legals');
	Route.get('/about', 					'PageController.about').as('about');
	Route.get('/mobile-app', 				'PageController.mobileApp').as('mobileapp');
	Route.get('/market-statics', 			'PageController.marketStatics').as('marketstatics');
	Route.get('/our-fees', 					'PageController.ourFees').as('ourfees');
	Route.get('/payments', 					'PageController.payments').as('payments');
	Route.get('/announcements', 			'PageController.announcements').as('announcements');
	Route.get('/blogs', 					'PageController.blogs').as('blogs');
	Route.get('/blog/:title?', 				'PageController.blog').as('blog');
	Route.get('/careers', 					'PageController.careers').as('careers');
	Route.get('/apply-now/:id',				'PageController.showApplyNow').as('apply');
	Route.post('/apply-now/:id',			'PageController.applyNow');
	Route.get('/binance', 				    'BinanceController.binance').as('binance');
	Route.get('/error', 					'MaintainanceController.index').as('error');
	


}).middleware(['savevisit'])


// Route.get('/sitemap.xml', ({ view }) => view.render('sitemap.sitemap'));
Route.get('/api/ticker', 'HomeController.tickerApi').as('api.ticker')
Route.get('/chart/candels', 'HomeController.candlesData').as('chart.candles.data')
Route.get('/api/ticker/btcEth', 'BinanceBtcEthApi.index').as('api.ticker.btcEth')
//Route.get('/checkmail', 'AuthController.sendMailTest').as('check.mail');

Route.get('/testpayment', 'TestController.index')
Route.get('/get_sponsor', 'PageController.getAllSponsors')
Route.get('/get_feedback', 'PageController.getAllFeedbacks')
Route.get('/get_sliders', 'PageController.getAllSliderImages')
Route.get('/get_tablePairData', 'PageController.getAllTablePairData')


//Authentication routes
Route.group(() => {

	Route.get('/login', 					'AuthController.showLogin').as('login');
	Route.post('/login', 					'AuthController.login');

	Route.get('/sign-up', 					'AuthController.showSignup').as('signup');
	Route.post('/sign-up', 					'AuthController.signup');

	Route.get('/forgot', 					'AuthController.showForgot').as('forgot');
	Route.post('/forgot', 					'AuthController.forgot');

	Route.get('/verify/:token', 			'AuthController.verify').as('verify');
	Route.get('/reset/:token', 				'AuthController.showReset').as('reset');
	Route.post('/reset/:token', 			'AuthController.reset');

	Route.get('/device/:token/:device', 	'AuthController.deviceAuth').as('device-auth');
	Route.get('/2fa', 						'AuthController.showVerify2FA').as('2fa');
	Route.post('/verify-2fa', 				'AuthController.verify2FA').as('verify-2fa');
	Route.post('/verify-sms', 				'AuthController.verifySmsAuth').as('verify-sms');
	Route.post('/send-sms', 				'AuthController.sendSmsAuth').as('send-sms-auth');

}).prefix('auth').middleware(['unauth', 'savevisit'])


// Authenticated routes
Route.group(() => {

	Route.get('/', 							'AccountController.index').as('account');
	Route.post('/profile-pic', 				'AccountController.updateProfilePic').as('profile-pic');
	Route.get('/remove-profile', 			'AccountController.removeProfile').as('remove-profile');
	Route.get('/send-password-sms', 		'AccountController.sendPasswordSms').as('send-password-sms');
	Route.post('/change-password-sms', 		'AccountController.changePasswordWithSMS').as('change-password-sms');
	Route.post('/change-password-2fa', 		'AccountController.changePasswordWith2FA').as('change-password-2fa');
	Route.post('/enable-request-auth', 		'AccountController.enableRequestAuth').as('enable-request-auth');
	Route.post('/enable-sms-auth', 			'AccountController.enableSmsAuth').as('enable-sms-auth');
	Route.post('/disable-sms-auth', 		'AccountController.disableSmsAuth').as('disable-sms-auth');
	Route.post('/send-sms', 				'AccountController.sendSms').as('send-sms');
	Route.post('/enable-2fa', 				'AccountController.enable2FA').as('enable-2fa');
	Route.post('/disable-2fa', 				'AccountController.disable2FA').as('disable-2fa');
	Route.post('/anti-phishing', 			'AccountController.setAntiPhishing').as('anti-phishing');
	Route.post('/disableanti-phishing', 	'AccountController.disableAntiPhishing').as('disableanti-phishing');
	Route.get('/remove-device/:device_id', 	'AccountController.removeDevice').as('remove-device');
	Route.get('/personal-info', 			'AccountController.personalInfo').as('personal_info');
	Route.post('/personal-info', 			'AccountController.personalInfoSave');
	Route.get('/kyc', 						'AccountController.showKyc').as('kyc');
	Route.post('/kyc', 						'AccountController.submitKyc');
	Route.get('/address-kyc', 				'AccountController.showAddressKyc').as('address_kyc');
	Route.post('/address-kyc', 				'AccountController.submitAddressKyc');
	Route.get('/get-BtcBalance', 			'AccountController.getBtcBalance').as('getBtcBalance');
	Route.get('/logout', 					'AccountController.logout').as('logout');

}).prefix('account').middleware(['authreturn', 'auth', 'mustuser', 'mustactive',  'savevisit'])

// Wallet routes
Route.group(() => {

	Route.get('/', 							'WalletController.wallets').as('wallets');
	Route.get('/deposit/:currency',			'WalletController.deposit').as('deposit');
	Route.get('/withdraw/:currency',		'WalletController.withdraw').as('withdraw');
	Route.post('/withdraw/:currency',		'WalletController.withdrawTx');
	Route.post('/create', 					'WalletController.create').as('wallet.create');
	Route.get('/balance', 					'WalletController.balance').as('wallet.balance');
	Route.post('/payment', 					'WalletController.payment').as('payment');
	Route.post('/fiat-withdraw', 			'WalletController.fiatWithdraw').as('fiatwithdraw');
	Route.get('/usd-history', 				'WalletController.USDHistory').as('usdhistory');
	Route.get('/euro-history', 				'WalletController.EURHistory').as('eurohistory');
	Route.get('/btc-history', 				'WalletController.BTCHistory').as('btchistory');

	Route.post('/deposit/complete',         'WalletController.depositComplete').as('wallet.deposit.complete')

	Route.post('/autocomplete/buy',         'AutoCompleteOrderController.autoCompleteBuy').as('autocomplete.buy')
	Route.post('/autocomplete/sell',        'AutoCompleteOrderController.autoCompleteSell').as('autocomplete.sell')

}).prefix('wallets').middleware(['authreturn', 'auth', 'mustuser', 'mustactive', 'savevisit'])

// Market routes
Route.group(() => {

	Route.get('/market/:pair', 				'MarketController.marketDetail').as('market');
	Route.post('/market/cancle-order', 		'MarketController.cancelOrder').as('cancel_order');
	Route.post('/buy', 						'TradingController.buy').as('buy');
	Route.post('/exchangebuy', 				'TradingController.exchangebuy').as('exchangebuy');
	Route.get('/detailmarket/:pair', 		'DetailMarketController.index').as('detailmarket');
	Route.post('/stopbuy', 					'TradingController.stopbuy').as('stopbuy');
	Route.post('/stopsell', 					'TradingController.stopsell').as('stopsell');
	Route.post('/orderstopbuy', 			'TradingController.orderstopbuy').as('orderstopbuy');
	Route.post('/orderstopsell', 			'TradingController.orderstopsell').as('orderstopsell');
	Route.post('/sell', 					'TradingController.sell').as('sell');
	Route.post('/exchangesell', 					'TradingController.exchangesell').as('exchangesell');
	Route.get('/requestcoin', 				'RequestCoinController.index').as('requestcoin');
	Route.post('/enable-request',  		'RequestCoinController.enableRequest').as('enable-request');
	Route.get('/application',  		'RequestAppController.index').as('application');
	Route.post('/addcoininfo',  		'RequestAppController.addCoininfo').as('addcoininfo');
	Route.post('/addcoinapp',  		'RequestInfoController.addCoinapp').as('addcoinapp');
	Route.get('/information',  		'RequestInfoController.index').as('information');

}).middleware(['authreturn', 'auth', 'mustuser', 'mustactive', 'savevisit'])

// Admin Auth routes
Route.group(() => {

	Route.get('/', 							'LoginController.showLogin').as('admin');
	Route.get('/login', 					'LoginController.showLogin').as('admin.login');
	Route.post('/login', 					'LoginController.login');

}).prefix('admin').middleware(['unauth']).namespace('Admin')

// API routes
Route.group(() => {
	Route.get('/get-sponsors',				'SponsorController.getAllSponsors');
}).middleware(['unauth']).namespace('Admin')

Route.get('/sitemap.xml', 			'SitemapDatumController.renderXML');
Route.get('/sitemapData', 			'SitemapDatumController.renderMap').as('sitemap.Data');
Route.get('/sitemapUser', ({ view }) => view.render('UserSitemap'));

// Admin panel routes
Route.group(() => {

	Route.get('/dashboard', 				'DashboardController.index').as('admin.dashboard');

	Route.get('/change-password', 			'AccountController.showChangePassword').as('admin.change_password');
	Route.post('/change-password', 			'AccountController.changePassword');
	Route.get('/logout', 					'AccountController.logout').as('admin.logout');

	Route.get('/details', 				'AdminWalletController.index').as('admin.details');
	Route.get('/withdrawrequest', 				'WithdrawRequestController.index').as('admin.withdrawrequest');
	Route.get('/fiatwithdrawrequest', 				'FiatWithdrawRequestController.index').as('admin.fiatwithdrawrequest');
	Route.get('/details/wdetails/:id', 			'AdminWalletController.showEdit').as('admin.wdetails.edit');
	Route.post('/details/wdetails/:id', 			'AdminWalletController.editUser');

	Route.get('/withdrawrequest/withdrawfund/:id', 			'WithdrawRequestController.showEdit').as('admin.withdrawfund.edit');
	Route.post('/withdrawrequest/withdrawfund/:id', 			'WithdrawRequestController.editUser');
	Route.get('/withdrawrequest/changeStatus', 	'WithdrawRequestController.changeStatus').as('admin.withdrawrequest.changeStatus');

    Route.get('/requestcoin', 				'RequestCoinController.index').as('admin.requestcoin');
	Route.get('/requestcoin/view/:id', 			'RequestCoinController.viewDetail').as('admin.requestcoin.view');
	Route.get('/requestfees', 				'RequestFeesController.index').as('admin.requestfees');
	Route.get('/requestcoin/status', 		'RequestCoinController.changeStatus').as('admin.requestcoin.status');
    Route.get('/requestfees/status', 		'RequestFeesController.changeStatus').as('admin.requestfees.status');
	Route.get('/requestfees/edit/:id', 		'RequestFeesController.showEdit').as('admin.requestfees.edit');
	Route.post('/requestfees/feesedit/:id', 	'RequestFeesController.FeesEdit').as('admin.requestfees.feesedit');;
    Route.get('/requestcoin/remove', 		'RequestCoinController.remove').as('admin.requestcoin.remove');

	Route.get('/users', 					'UserController.index').as('admin.users');
	Route.get('/user/status', 				'UserController.changeStatus').as('admin.user.status');
	Route.get('/user/remove', 				'UserController.remove').as('admin.user.remove');
	Route.get('/user/view/:id', 			'UserController.viewDetail').as('admin.user.view');
	Route.get('/user/edit/:id', 			'UserController.showEdit').as('admin.user.edit');
	Route.post('/user/edit/:id', 			'UserController.editUser');
	Route.post('/user/new/:id', 		    'UserController.addNew');
	Route.post('/user/edita/:id', 		    'UserController.edNew');
	Route.get('/user/edita/:id', 		    'UserController.EditaNew').as('admin.user.edita');
	Route.get('/user/new/:id', 				'UserController.showNew').as('admin.user.new');
	Route.post('/user/update-password/:id', 'UserController.updatePassword').as('admin.user.password');
	Route.get('/user/kyc/:id', 				'UserController.kyc').as('admin.user.kyc');
	Route.get('/user/kyc-status', 			'UserController.kycStatus').as('admin.kyc.status');
	Route.get('/user/address-kyc/:id', 		'UserController.addressKyc').as('admin.user.address_kyc');
	Route.get('/user/address-kyc-status', 	'UserController.addressKycStatus').as('admin.address_kyc.status');
	Route.get('/user/balance/:id', 				'UserController.balance').as('admin.user.balance');

	Route.post('/users/balance/update',     'UserController.updateBalance').as('admin.users.balance.update');

	Route.get('/pairs', 					'PairController.index').as('admin.pairs');
	Route.get('/pair/new', 					'PairController.showNew').as('admin.pair.new');
	Route.post('/pair/new', 				'PairController.addNew');
	Route.get('/pair/edit/:id', 			'PairController.showEdit').as('admin.pair.edit');
	Route.post('/pair/edit/:id', 			'PairController.edit');
	Route.get('/pair/status', 				'PairController.changeStatus').as('admin.pair.status');
	Route.get('/pair/remove', 				'PairController.remove').as('admin.pair.remove');

	Route.get('/sliders', 					'SliderController.index').as('admin.sliders');
	Route.get('/slider/new', 				'SliderController.showNew').as('admin.slider.new');
	Route.post('/slider/new', 				'SliderController.addNew');
	Route.get('/slider/edit/:id', 			'SliderController.showEdit').as('admin.slider.edit');
	Route.post('/slider/edit/:id', 			'SliderController.edit');
	Route.get('/slider/remove', 			'SliderController.remove').as('admin.slider.remove');

	// Route.get('/feedbacks', 					'FeedbackController.index').as('admin.feedbacks');
	// Route.get('/feedback/new', 				    'FeedbackController.showNew').as('admin.feedback.new');
	// Route.post('/feedback/new', 				'FeedbackController.addNew');
	// Route.get('/feedback/edit/:id', 			'FeedbackController.showEdit').as('admin.feedback.edit');
	// Route.post('/feedback/edit/:id', 			'FeedbackController.edit').as('admin.feedback.edit');
	// Route.get('/feedback/remove', 			    'FeedbackController.remove').as('admin.feedback.remove');

	// Route.get('/socialmedia', 					'SocialMediaController.index').as('admin.socialmedia');
	// Route.get('/socialmedia/new', 				    'SocialMediaController.showNew').as('admin.socialmedia.new');
	// Route.post('/socialmedia/new', 				'SocialMediaController.addNew');
	// Route.get('/socialmedia/edit/:id', 			'SocialMediaController.showEdit').as('admin.socialmedia.edit');
	// Route.post('/socialmedia/edit/:id', 			'SocialMediaController.edit').as('admin.socialmedia.edit');
	// Route.get('/socialmedia/remove', 			    'SocialMediaController.remove').as('admin.socialmedia.remove');

	Route.get('/hiretraders', 					'HireTraderController.index').as('admin.hiretraders');				
	Route.get('/hiretrader/remove', 			'HireTraderController.remove').as('admin.hiretrader.remove');

	// Route.get('/teams', 					'TeamController.index').as('admin.teams');
	// Route.get('/team/new', 					'TeamController.showNew').as('admin.team.new');
	// Route.post('/team/new', 				'TeamController.addNew');
	// Route.get('/team/edit/:id', 			'TeamController.showEdit').as('admin.team.edit');
	// Route.post('/team/edit/:id', 			'TeamController.edit');
	// Route.get('/team/remove', 				'TeamController.remove').as('admin.team.remove');

	Route.get('/faqs', 						'FaqController.index').as('admin.faqs');
	Route.get('/faq/new', 					'FaqController.showNew').as('admin.faq.new');
	Route.post('/faq/new', 					'FaqController.addNew');
	Route.get('/faq/edit/:id', 				'FaqController.showEdit').as('admin.faq.edit');
	Route.post('/faq/edit/:id', 			'FaqController.edit');
	Route.get('/faq/remove', 				'FaqController.remove').as('admin.faq.remove');

	Route.get('/deposits', 					'DepositWalletController.index').as('admin.deposits');
	Route.get('/deposits/new', 				'DepositWalletController.showNew').as('admin.deposits.new');
	Route.post('/deposits/new', 			'DepositWalletController.addNew');
	Route.get('/deposits/edit/:id', 		'DepositWalletController.showEdit').as('admin.deposits.edit');
	Route.post('/deposits/edit/:id', 		'DepositWalletController.edit');
	Route.get('/deposits/remove', 			'DepositWalletController.remove').as('admin.deposits.remove');

	Route.get('/deposit/request', 			'DepositRequestController.index').as('admin.deposit.request');
	Route.get('/deposit/status', 			'DepositRequestController.changestatus').as('admin.deposit.changestatus');

	// Route.get('/announcements', 			'AnnouncementController.index').as('admin.announcements');
	// Route.get('/announcement/new', 			'AnnouncementController.showNew').as('admin.announcement.new');
	// Route.post('/announcement/new', 		'AnnouncementController.addNew');
	// Route.get('/announcement/edit/:id', 	'AnnouncementController.showEdit').as('admin.announcement.edit');
	// Route.post('/announcement/edit/:id', 	'AnnouncementController.edit');
	// Route.get('/announcement/remove', 		'AnnouncementController.remove').as('admin.announcement.remove');

	Route.get('/blogs', 					'BlogController.index').as('admin.blogs');
	Route.get('/blog/new', 					'BlogController.showNew').as('admin.blog.new');
	Route.post('/blog/new', 				'BlogController.addNew');
	Route.get('/blog/edit/:id', 			'BlogController.showEdit').as('admin.blog.edit');
	Route.post('/blog/edit/:id', 			'BlogController.edit');
	Route.get('/blog/remove', 				'BlogController.remove').as('admin.blog.remove');

	Route.get('/jobs', 						'JobController.index').as('admin.jobs');
	Route.get('/job/new', 					'JobController.showNew').as('admin.job.new');
	Route.post('/job/new', 					'JobController.addNew');
	Route.get('/job/edit/:id', 				'JobController.showEdit').as('admin.job.edit');
	Route.post('/job/edit/:id', 			'JobController.edit');
	Route.get('/job/remove', 				'JobController.remove').as('admin.job.remove');
	Route.get('/job/applied/:id', 			'JobController.applied').as('admin.applied');

	Route.get('/whoweare', 					'WhoWeAreController.index').as('admin.whoweare');
	Route.get('/whoweare/new', 				'WhoWeAreController.showNew').as('admin.whoweare.new');
	Route.post('/whoweare/new', 			'WhoWeAreController.addNew');
	Route.get('/whoweare/edit/:id', 		'WhoWeAreController.showEdit').as('admin.whoweare.edit');
	Route.post('/whoweare/edit/:id', 		'WhoWeAreController.edit');
	Route.get('/whoweare/remove', 			'WhoWeAreController.remove').as('admin.whoweare.remove');

	Route.get('/cms/:cms_key', 				'CmsController.index').as('admin.cms')
	Route.post('/cms/:cms_key', 			'CmsController.update')
	Route.get('/contacts', 					'CmsController.contacts').as('admin.contacts');
	Route.get('/support', 					'CmsController.showSupport').as('admin.support')
	Route.post('/support', 					'CmsController.udpateSupport')

	// Sponsors
	Route.get('/sponsors', 					'SponsorController.index').as('admin.sponsors');
	Route.get('/sponsors/new', 				'SponsorController.showNew').as('admin.sponsors.new');
	Route.post('/sponsors/new', 			'SponsorController.addNew');
	Route.get('/sponsors/edit/:id', 		'SponsorController.showEdit').as('admin.sponsors.edit');
	Route.post('/sponsors/edit/:id', 		'SponsorController.edit');
	Route.get('/sponsors/remove', 			'SponsorController.remove').as('admin.sponsors.remove');
	// End Sponsors

  //sitemap 
  Route.get('/sitemap', 					'SitemapController.index').as('admin.sitemap');
  Route.get('/Sitemap/new', 				'SitemapController.showNew').as('admin.Sitemap.new');
  Route.post('/Sitemap/new', 				'SitemapController.addNew')
  Route.get('/Sitemap/edit/:id', 			'SitemapController.showEdit').as('admin.Sitemap.edit');
  Route.post('/Sitemap/edit/:id', 			'SitemapController.edit');
  Route.get('/Sitemap/remove', 			'SitemapController.remove').as('admin.Sitemap.remove');
 
//   Route.get('/sitemap.xml', ({ view }) => view.render('admin.sitemap'));
 
  // End sitemap


	Route.get('/features', 					'FeatureController.index').as('admin.features')
	Route.post('/features', 				'FeatureController.saveFeatures')

	Route.get('/deposits/:currency', 		'FiatController.deposits').as('admin.deposits')
	Route.get('/withdrawals/:currency', 	'FiatController.withdrawals').as('admin.withdrawals')
	Route.get('/tx/status', 				'FiatController.changeStatus').as('admin.tx.status');

	Route.get('/orders', 'OrderController.index').as('admin.orders.index')

	Route.get('/withdraw/limits', 'WithdrawLimitController.index').as('admin.withdrawLimits.index')
	Route.post('/withdraw/limits/update', 'WithdrawLimitController.update').as('admin.withdrawLimits.update')

	//Route.get('/headerimages', 					'HeaderImageController.index').as('admin.headerimage');
	// Route.get('/headerimage/new', 				'HeaderImageController.headerImageNew').as('admin.headerimage.new');
	// Route.post('/headerimage/new', 				'HeaderImageController.addNew');
	// Route.get('/headerimage/detail', 		    'HeaderImageController.detail').as('admin.headerimage.detail');;


	Route.get('/aboutus', 					'AboutUSController.index').as('admin.aboutus');
	Route.get('/aboutus/edit/:id', 			'AboutUSController.showEdit').as('admin.aboutus.edit');
	Route.post('/aboutus/edit/:id', 			'AboutUSController.edit');
	
}).prefix('admin').middleware(['authreturn', 'auth', 'mustadmin']).namespace('Admin')

// setting language
Route.get('/switch/:lang', ({ params, antl, request, response }) => {

	const locales = antl.availableLocales()

	if (locales.indexOf(params.lang) > -1 ) {
		response.cookie('lang', params.lang, { path: '/' })
	}

	response.redirect('back')

}).as('language')
Route.get('*', 'MaintainanceController.index').as('error');
