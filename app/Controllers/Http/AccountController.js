'use strict'

const Env = use('Env')
const Mail = use('Mail')
const Hash = use('Hash')
const QRCode = use('qrcode')
const Kyc = use('App/Models/Kyc')
const speakeasy = use('speakeasy')
const User = use('App/Models/User')
const { validate } = use('Validator')
const Order = use('App/Models/Order')
const Address = use('App/Models/Address')
const AddressKyc = use('App/Models/AddressKyc')
const UserDevice = use('App/Models/UserDevice')
const RequestCoin = use('App/Models/RequestCoin')
const LoginHistory = use('App/Models/LoginHistory')
const PersonalInfo = use('App/Models/PersonalInfo')
const WithdrawLimit = use('App/Models/WithdrawLimit')

const twilioAccountSid = 'AC4bafc87b72f3fd386aa0de792f2a00ad';
const twilioAuthToken = '6131bb64fc3871e703023c7fd7256916';
const twilioToNumber = '+16185088002';
const twilioClient = require('twilio')(twilioAccountSid, twilioAuthToken);

class AccountController {

    async index ({ request, response, antl, view, auth }) {
        
        const data = {}

        data.user = await auth.getUser()
        data.requestcoin = await RequestCoin.findBy({user_id: data.user.id})
        data.qrcode = encodeURIComponent('otpauth://totp/' + data.user.email + '?secret=' + data.user.tfa_code + '&issuer=Zithex')
        data.histories = await LoginHistory.query().where('user_id', data.user.id).pickInverse(5)
        data.devices = await UserDevice.query().where('user_id', data.user.id).pickInverse(10)
        data.kyc = await Kyc.query().where('user_id', data.user.id).first()
        data.addressKyc = await AddressKyc.query().where('user_id', data.user.id).first() 
        data.requestcoins = await RequestCoin
                            .query().with('user')
                            .where('user_id', data.user.id)
                            .orderBy('id', 'desc')
                            .fetch()
        data.withdrawLimits = await WithdrawLimit.findBy({
            currency: 'btc'
        })

        data.withdrawLimits = data.withdrawLimits ? (data.withdrawLimits).toJSON() : null

        const walletsCount = await Address
                                .query()
                                .where('user_id', auth.user.id)
                                .count('* as total')

        data.walletsCount = walletsCount[0].total

        data.orders = await Order
                            .query()
                            .where('user_id', auth.user.id)
                            .orderBy('id', 'DESC')
                            .fetch()

        return view.render('account.account', data)
    }

    async changePasswordWithSMS ({ request, response, antl, auth, session }) {

        const rules = {
            old_password: 'required',
            new_password: 'required|confirmed'
        }

        const messages = {
            'otp.required'              : antl.formatMessage('messages.otp_required'),
            'old_password.required'     : antl.formatMessage('messages.old_password_required'),
            'new_password.required'     : antl.formatMessage('messages.new_password_required'),
            'new_password.confirmed'    : antl.formatMessage('messages.password_confirm')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            return response.json({ error : true, message : validation.messages()[0].message })
        }

        if(session.get('password_sms_otp') != request.body.otp){
            return response.json({ error : true, message : antl.formatMessage('messages.invalid_otp') })
        }

        session.forget('sms_auth_otp')

        const user = await auth.getUser()
        const isSame = await Hash.verify(request.input("old_password"), user.password)

        if( ! isSame ){
            return response.json({ error : true, message : antl.formatMessage('messages.incorrect_old_password') })
        }

        if(request.input("new_password") == request.input("old_password")){
            return response.json({ error : true, message : antl.formatMessage('messages.password_same') })
        }

        user.password = await Hash.make(request.input("new_password"))
        user.save()

        return response.json({ error : false, message : antl.formatMessage('messages.password_changed') })
    }

    async changePasswordWith2FA ({ request, response, antl, auth, session }) {

        const rules = {
            old_password: 'required',
            new_password: 'required|confirmed'
        }

        const messages = {
            'otp.required'              : antl.formatMessage('messages.otp_required'),
            'old_password.required'     : antl.formatMessage('messages.old_password_required'),
            'new_password.required'     : antl.formatMessage('messages.new_password_required'),
            'new_password.confirmed'    : antl.formatMessage('messages.password_confirm')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            return response.json({ error : true, message : validation.messages()[0].message })
        }

        const user = await auth.getUser()

        var verified = await speakeasy.totp.verify({
            secret: user.tfa_code,
            encoding: 'base32',
            token: request.body.otp
        })

        if(!verified){
            return response.json({ error : true, message : antl.formatMessage('messages.incorrect_totp') })
        }

        const isSame = await Hash.verify(request.input("old_password"), user.password)

        if( ! isSame ){
            return response.json({ error : true, message : antl.formatMessage('messages.incorrect_old_password') })
        }
  
        if(request.input("new_password") == request.input("old_password")){
            return response.json({ error : true, message : antl.formatMessage('messages.password_same') })
        }

        user.password = await Hash.make(request.input("new_password"))
        user.save()

        return response.json({ error : false, message : antl.formatMessage('messages.password_changed') })
    }

    async sendPasswordSms ({request, response, antl, session }) {

        const otp = Math.floor(100000 + Math.random() * 900000)
        session.put('password_sms_otp', otp)

        return response.send({ error : false, message : { otp : otp } })
    }

    async sendSms ({request, response, antl, session, auth }) {

        const rules = {
            phone_number: 'required',
            countryCode: 'required'
        }

        const messages = {
            'phone_number.required' : antl.formatMessage('messages.phone_number_required'),
            'countryCode.required': 'Please choose country code.'
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            return response.json({ error : true, message : validation.messages()[0].message })
        }

        const otp = Math.floor(100000 + Math.random() * 900000)

        const smsData = await twilioClient.messages
        .create({
            body: `Hello ${auth.user.name}, Your OTP for enable SMS authentication is ${otp}. Keep it confidential.`,
            from: twilioToNumber,
            to: `+${request.body.countryCode}${request.body.phone_number}`
        })
        .then(function(message){
            return message
        }).catch(function(error){
            return error
        });

        if( smsData.errorMessage == null ) {
            session.put('sms_auth_otp', otp)
            return response.send({ error : false, message: 'OTP sent to number click on send sms to send again.' })
        }

        return response.send({ 
            error : true, 
            message: smsData.message ? smsData.message : smsData.errorMessage
        })
    }

    async removeProfile ({request, response, auth, antl }) {

        const user = await auth.getUser()

        user.profile = null
        await user.save()

        return response.send({ error : false, message : antl.formatMessage('messages.profile_removed') })
    }
    
    async enableRequestAuth ({request, response, antl, auth, session}) {

        const rules = {
            coin_name: 'required',
            coin_symbol: 'required',
            coin_value : 'required'
        }

        const messages = {
            'coin_name.required' : antl.formatMessage('messages.coin_name_required'),
             'coin_symbol.required' : antl.formatMessage('messages.coin_symbol_required'),
            'coin_value.required'          : antl.formatMessage('messages.coin_value_required')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            return response.json({ error : true, message : validation.messages()[0].message })
        }

        const user = await auth.getUser()
        const requestcoin = new RequestCoin 

        requestcoin.coin_name = request.input("coin_name")
        requestcoin.coin_symbol = request.input("coin_symbol")
        requestcoin.coin_value = request.input("coin_value")
        requestcoin.user_id = user.id
        
        await  requestcoin.save()

        return response.json({ error : false, message : antl.formatMessage('messages.request_auth_enabled') })

    }

    async enableSmsAuth ({request, response, antl, auth, session}) {

        const rules = {
            phone_number: 'required',
            otp : 'required',
            countryCode: 'required'
        }

        const messages = {
            'phone_number.required' : antl.formatMessage('messages.phone_number_required'),
            'otp.required'          : antl.formatMessage('messages.otp_required'),
            'countryCode.required': 'Please choose country code.'
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            return response.json({ error : true, message : validation.messages()[0].message })
        }

        if( request.input("otp") != session.get('sms_auth_otp') ){
            return response.json({ error : true, message : antl.formatMessage('messages.invalid_otp') })
        }

        session.forget('sms_auth_otp')

        const user = await auth.getUser()

        user.mobile = request.input("phone_number")
        user.mobile_country_code = request.input("countryCode")
        user.sms_auth = 1

        await  user.save()

        return response.json({ error : false, message : antl.formatMessage('messages.sms_auth_enabled') })

    }

    async disableSmsAuth ({request, response, antl, auth, session}) {

        const rules = {
            phone_number: 'required',
            otp : 'required'
        }

        const messages = {
            'phone_number.required' : antl.formatMessage('messages.phone_number_required'),
            'otp.required'          : antl.formatMessage('messages.otp_required')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            return response.json({ error : true, message : validation.messages()[0].message })
        }

        if( request.input("otp") != session.get('sms_auth_otp') ){
            return response.json({ error : true, message : antl.formatMessage('messages.invalid_otp') })
        }

        session.forget('sms_auth_otp')

        const user = await auth.getUser()

        user.mobile = request.input("phone_number")
        user.sms_auth = 0

        await    user.save()

        return response.json({ error : false, message : antl.formatMessage('messages.sms_auth_disabled') })
    }

    async enable2FA ({request, response, antl, auth}) {

        const rules = {
            password: 'required',
            totp : 'required'
        }

        const messages = {
            'password.required' : antl.formatMessage('messages.password_required'),
            'totp.required'          : antl.formatMessage('messages.totp_required')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            return response.json({ error : true, message : validation.messages()[0].message })
        }

        const user = await auth.getUser()

        var isSame = await Hash.verify(request.input("password"), user.password)

        if(!isSame){
            return response.json({ error : true, message : antl.formatMessage('messages.incorrect_password') })
        }

        var verified = await speakeasy.totp.verify({
            secret: user.tfa_code,
            encoding: 'base32',
            token: request.body.totp
        })

        if(!verified){
            return response.json({ error : true, message : antl.formatMessage('messages.incorrect_totp') })
        }

        user.tfa_status = 1

        user.save();

        return response.json({ error : false, message : antl.formatMessage('messages.2fa_enabled') })
    }

    async disable2FA ({request, response, antl, auth}) {

        const rules = {
            password: 'required',
            totp : 'required'
        }

        const messages = {
            'password.required' : antl.formatMessage('messages.password_required'),
            'totp.required'          : antl.formatMessage('messages.totp_required')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            return response.json({ error : true, message : validation.messages()[0].message })
        }

        const user = await auth.getUser()

        var isSame = await Hash.verify(request.input("password"), user.password)

        if(!isSame){
            return response.json({ error : true, message : antl.formatMessage('messages.incorrect_password') })
        }

        var verified = await speakeasy.totp.verify({
            secret: user.tfa_code,
            encoding: 'base32',
            token: request.body.totp
        })

        if(!verified){
            return response.json({ error : true, message : antl.formatMessage('messages.incorrect_totp') })
        }

        user.tfa_status = 0

        user.save();

        return response.json({ error : false, message : antl.formatMessage('messages.2fa_disabled') })
    }

    async setAntiPhishing ({request, response, antl, auth}) {

        const rules = {
            code: 'required'
        }

        const messages = {
            'code.required' : antl.formatMessage('messages.anti_phishing_code_required'),
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            return response.json({ error : true, message : validation.messages()[0].message })
        }

        const user = await auth.getUser()

        if(!user){
            return response.json({ error : true, message : antl.formatMessage('messages.user_not_found') })
        }

        user.anti_phishing_code = request.body.code
        await user.save() 

        return response.json({ error : false, message : antl.formatMessage('messages.anti_phishing_code_updated') })
    }
    
    async disableAntiPhishing ({request, response, antl, auth}) {

        const user = await auth.getUser()

        if(!user){
            return response.json({ error : true, message : antl.formatMessage('messages.user_not_found') })
        }

        user.anti_phishing_code = null
        await user.save()

        return response.json({ error : false, message : antl.formatMessage('messages.anti_phishing_code_disable') })
    }

    async removeDevice ({params, request, response, antl, auth }) {

        const user = await auth.getUser()

        if(!user){
            return response.send({ error : true, message : antl.formatMessage('messages.user_not_found') })
        }

        const device = await UserDevice.find(params.device_id)

        await device.delete()

        return response.send({ error : false, message : antl.formatMessage('messages.device_removed') })
    }

    async logout ({request, response, auth}) {
        await auth.logout()
        return response.redirect('/auth/login')
    }

    async personalInfo({ response, view, auth }) {
        
        const user = await auth.getUser()
        const personalInfoPrev = await PersonalInfo.findBy('user_id', user.id)
        if(personalInfoPrev){
            return response.route('kyc')
        }

        return view.render('account.personal_info')
    }

    async personalInfoSave({ request, response, antl, auth, session }){
 
        const rules = {
            first_name: 'required',
            last_name : 'required',
            dob : 'required',
            mobile : 'required',
            occupation : 'required',
            address : 'required',
            zipcode : 'required',
            city : 'required',
            country : 'required'
        }

        const messages = {
            'first_name.required'   : antl.formatMessage('messages.first_name_required'),
            'middle_name.required'  : antl.formatMessage('messages.middle_name_required'),
            'last_name.required'    : antl.formatMessage('messages.last_name_required'),
            'dob.required'          : antl.formatMessage('messages.dob_required'),
            'mobile.required'       : antl.formatMessage('messages.mobile_required'),
            'occupation.required'   : antl.formatMessage('messages.occupation_required'),
            'address.required'      : antl.formatMessage('messages.address_required'),
            'zipcode.required'      : antl.formatMessage('messages.zipcode_required'),
            'city.required'         : antl.formatMessage('messages.city_required'),
            'country.required'      : antl.formatMessage('messages.country_required')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            return response.json({ error : true, message : validation.messages()[0].message })
        }

        const user = await auth.getUser()

        const personalInfoPrev = await PersonalInfo.findBy('user_id', user.id)

        if( ! personalInfoPrev ){

            const personalInfo = new PersonalInfo()

            personalInfo.user_id = user.id
            personalInfo.first_name = request.body.first_name
            personalInfo.middle_name = request.body.middle_name
            personalInfo.last_name = request.body.last_name
            personalInfo.dob = request.body.dob
            personalInfo.address = request.body.address
            personalInfo.zipcode = request.body.zipcode
            personalInfo.city = request.body.city
            personalInfo.country = request.body.country
            personalInfo.mobile = request.body.mobile
            personalInfo.occupation = request.body.occupation

            const result = await personalInfo.save()

            if( ! result ){
                session.flash({ error: antl.formatMessage('messages.personal_info_failed') })
                return response.route('personal_info')
            }
            
            session.flash({ success: antl.formatMessage('messages.personal_info_saved') })
            return response.route('kyc')

        } else {

            personalInfoPrev.first_name = request.body.first_name
            personalInfoPrev.middle_name = request.body.middle_name
            personalInfoPrev.last_name = request.body.last_name
            personalInfoPrev.dob = request.body.dob
            personalInfoPrev.address = request.body.address
            personalInfoPrev.zipcode = request.body.zipcode
            personalInfoPrev.city = request.body.city
            personalInfoPrev.country = request.body.country
            personalInfoPrev.mobile = request.body.mobile
            personalInfoPrev.occupation = request.body.occupation

            const result = await personalInfoPrev.save()

            if( ! result ){
                session.flash({ error: antl.formatMessage('messages.personal_info_failed') })
                return response.route('personal_info')
            }
            
            session.flash({ success: antl.formatMessage('messages.personal_info_saved') })
            return response.route('kyc')
        }
    }

    async showKyc({ view }){
        return view.render('account.kyc')
    }

    async submitKyc({ request, response, view, session, antl, auth }){

        if( request.body.document_type == '' ){
            session.flash({ error : antl.formatMessage('messages.document_type_select_error') })
            return response.route('kyc')
        }

        if( ! request.file('front_photo') ){
            session.flash({ error : antl.formatMessage('messages.front_photo_select_error') })
            return response.route('kyc')
        }

        const front_photo = request.file('front_photo', {
            types: ['image'],
            size: '2mb'
        })

        const frontPhotoName = new Date().getTime() + '.' + front_photo.subtype

        await front_photo.move('public/images/kycs', {
            name: frontPhotoName,
            overwrite: true
        })

        if (!front_photo.moved()) {
            session.flash({ error : front_photo.error() })
            return response.route('kyc')
        }

        if(!request.file('back_photo')){
            session.flash({ error : antl.formatMessage('messages.back_photo_select_error') })
            return response.route('kyc')
        }

        const back_photo = request.file('back_photo', {
            types: ['image'],
            size: '2mb'
        })

        const backPhotoName = new Date().getTime() + '.' + back_photo.subtype

        await back_photo.move('public/images/kycs', {
            name: backPhotoName,
            overwrite: true
        })

        if (!back_photo.moved()) {
            session.flash({ error : back_photo.error() })
            return response.route('kyc')
        }

        if(!request.file('selfi_photo')){
            session.flash({ error : antl.formatMessage('messages.selfie_photo_select_error') })
            return response.route('kyc')
        }

        const selfi_photo = request.file('selfi_photo', {
            types: ['image'],
            size: '2mb'
        })

        const selfiPhotoName = new Date().getTime() + '.' + selfi_photo.subtype

        await selfi_photo.move('public/images/kycs', {
            name: selfiPhotoName,
            overwrite: true
        })

        if (!selfi_photo.moved()) {
            session.flash({ error : selfi_photo.error() })
            return response.route('kyc')
        }

        const user = await auth.getUser()

        const kycPrev = await Kyc.findBy('user_id', user.id)

        if( ! kycPrev ){

            const kyc = new Kyc()

            kyc.user_id = user.id
            kyc.document_type = request.body.document_type
            kyc.front = frontPhotoName
            kyc.back = backPhotoName
            kyc.selfie = selfiPhotoName

            const result = await kyc.save()

            if( ! result ){
                session.flash({ error: antl.formatMessage('messages.kyc_upload_failed') })
                return response.route('kyc')
            }

        } else {

            kycPrev.document_type = request.body.document_type
            kycPrev.front = frontPhotoName
            kycPrev.back = backPhotoName
            kycPrev.selfie = selfiPhotoName
            kycPrev.status = 0
            kycPrev.deleted_at = null

            const result = await kycPrev.save()

            if( ! result ){
                session.flash({ error: antl.formatMessage('messages.kyc_upload_failed') })
                return response.route('kyc')
            }

        }

        user.url = Env.get('APP_URL')
        await Mail.send('emails.submit_kyc', user.toJSON(), (message) => {
            message
            .to(user.email)
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('KYC Under Approval')
        })

        await Mail.send('emails.submit_kyc_admin', user.toJSON(), (message) => {
            message
            .to('admin@zithex.com')
            .cc('support@zithex.com')
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('New KYC Request For Approval Level 2')
        })
            
        session.flash({ success: antl.formatMessage('messages.kyc_uploaded') })
        return response.route('account')
    }

    async showAddressKyc({ view }){
        return view.render('account.address-kyc')
    }

    async submitAddressKyc({ request, response, view, session, antl, auth }){

        if( request.body.document_type == '' ){
            session.flash({ error : antl.formatMessage('messages.document_type_select_error') })
            return response.route('address-kyc')
        }

        if( ! request.file('front_photo') ){
            session.flash({ error : antl.formatMessage('messages.front_photo_select_error') })
            return response.route('address-kyc')
        }

        const front_photo = request.file('front_photo', {
            types: ['image'],
            size: '2mb'
        })

        const frontPhotoName = new Date().getTime() + '.' + front_photo.subtype

        await front_photo.move('public/images/address-kycs', {
            name: frontPhotoName,
            overwrite: true
        })

        if (!front_photo.moved()) {
            session.flash({ error : front_photo.error() })
            return response.route('address-kyc')
        }

        const user = await auth.getUser()

        const kycPrev = await AddressKyc.findBy('user_id', user.id)

        if( ! kycPrev ){

            const kyc = new AddressKyc()

            kyc.user_id = user.id
            kyc.document_type = request.body.document_type
            kyc.front = frontPhotoName

            const result = await kyc.save()

            if( ! result ){
                session.flash({ error: antl.formatMessage('messages.kyc_upload_failed') })
                return response.route('address-kyc')
            }

        } else {

            kycPrev.document_type = request.body.document_type
            kycPrev.front = frontPhotoName
            kycPrev.status = 0
            kycPrev.deleted_at = null

            const result = await kycPrev.save()

            if( ! result ){
                session.flash({ error: antl.formatMessage('messages.kyc_upload_failed') })
                return response.route('address-kyc')
            }
        }

        user.url = Env.get('APP_URL')
        await Mail.send('emails.submit_kyc', user.toJSON(), (message) => {
            message
            .to(user.email)
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('KYC Under Approval')
        })

        await Mail.send('emails.submit_kyc_admin', user.toJSON(), (message) => {
            message
            .to('admin@zithex.com')
            .cc('support@zithex.com')
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('New KYC Request For Approval Level 3')
        })
            
        session.flash({ success: antl.formatMessage('messages.kyc_uploaded') })
        return response.route('account')
    }

    async updateProfilePic({ request, response, auth, antl }) {

        if(!request.file('profile')){
            return response.send({ error : true, message : antl.formatMessage('messages.profile_not_found') })
        }

        const profile = request.file('profile', {
            types: ['image'],
            size: '2mb'
        })

        const newName = new Date().getTime() + '.' + profile.subtype

        await profile.move('public/images/users', {
            name: newName,
            overwrite: true
        })

        if ( ! profile.moved() ) {
            return response.send({ error : true, message : antl.formatMessage('messages.profile_not_uploaded') })
        }

        const user = auth.user

        user.profile = newName

        await user.save()

        return response.send({ error : false, message : antl.formatMessage('messages.profile_updated') })
    }

    async getBtcBalance({request, response, auth, antl}) {
        
		const address = await Address
							  .query()
							  .select('public_key', 'balance')
							  .where('currency', 'btc')
							  .where('user_id', auth.user.id)
							  .first()

        let balance;
        if(address == null || address == undefined) {
            balance = { available : 0, inOrder : 0, total : 0 };
        } else {
            balance = { available : address.balance, inOrder : 0, total : 0 }
        }
		// const url = Env.get('CRYPTO_URL') + params.currency + '/balance/' + address.public_key + '/' + Env.get('CRYPTO_NETWORK')

		// try{
		// 	await axios.get( url )
		// 	.then(data => {
		// 		balance.available = data.data.balance
		// 	})
		// 	.catch(err => {

		// 	})
		// } catch(error){

		// }

		
        return response.json({ success : true, data:balance})		
    }
}

module.exports = AccountController
