'use strict'

const { validate }  = use('Validator')
const User          = use('App/Models/User')
const LoginHistory  = use('App/Models/LoginHistory')
const UserDevice    = use('App/Models/UserDevice')
const crypto        = use('crypto')
const Mail          = use('Mail')
const Env           = use('Env')
const Hash          = use('Hash')
const speakeasy     = use('speakeasy')
const axios         = use('axios')
const UAParser      = use('ua-parser-js')


const twilioAccountSid = 'AC4bafc87b72f3fd386aa0de792f2a00ad';
const twilioAuthToken = '6131bb64fc3871e703023c7fd7256916';
const twilioToNumber = '+16185088002';
const twilioClient = require('twilio')(twilioAccountSid, twilioAuthToken);

class AuthController {

    async showLogin ({ params, request, response, view, session, auth }) {
        
        return view.render('auth.login')
    }

    async login ({ params, request, auth, response, session, antl }) {
        
        const loginUser = await User.query().where('email', request.body.email).where('is_admin', 0).first()

        if(!loginUser){
            session.flash({ error: antl.formatMessage('messages.incorrect_email') })
            return response.redirect('/auth/login')
        }

        if(loginUser.status == 0){
            session.flash({ error: antl.formatMessage('messages.account_Verification_pending') })
            return response.redirect('/auth/login')
        }
		 if(loginUser.status == 2){
            session.flash({ error: antl.formatMessage('messages.account_inactive') })
            return response.redirect('/auth/login')
        }

        if(loginUser.deleted_at != null){
            session.flash({ error: antl.formatMessage('messages.account_removed') })
            return response.redirect('/auth/login')
        }

        if( ! await Hash.verify(request.body.password, loginUser.password) ){
            session.flash({ error: antl.formatMessage('messages.incorrect_password') })
            return response.redirect('/auth/login')
        }
 
        const ip = request.ip()
        var location = ''

        await axios.get(`https://ipapi.co/${ip}/json/`)
        .then(locationResponse => {
            location = locationResponse.data
            location = location.city + ', ' + location.region + ', ' + location.country_name
        })

        var result = await new UAParser().setUA(request.header('user-agent')).getResult()
        var device = result.browser.name + ' V' + result.browser.version + ' ( ' + result.os.name + ' ) '

        const devices = await UserDevice
                            .query()
                            .where('user_id', loginUser.id)
                            .where('device', device)
                            .first()

        if( ! devices ){

            loginUser.token = await crypto.createHash('md5').update("" + new Date().getTime() + (Math.floor(Math.random() * Math.random())) + "").digest("hex")
            loginUser.save()

            var userDevice = {}
            userDevice.user_id = loginUser.id
            userDevice.ip_address = ip
            userDevice.location = location
            userDevice.device = device

            const ud = await UserDevice.create(userDevice)

            var data = { user : loginUser, device : ud.id, url : Env.get('APP_URL') }

            await Mail.send('emails.new_device', data, (message) => {
                message
                .to(loginUser.email)
                .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
                .subject('New Device')
            })

            session.flash({ error : antl.formatMessage('messages.new_device') })
            return response.redirect('/auth/login')

        } else if( devices.status == 0 ){

            loginUser.token = await crypto.createHash('md5').update("" + new Date().getTime() + (Math.floor(Math.random() * Math.random())) + "").digest("hex")
            loginUser.save()

            var data = { user : loginUser, device : devices.id, url : Env.get('APP_URL') }

            await Mail.send('emails.new_device', data, (message) => {
                message
                .to(loginUser.email)
                .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
                .subject('New Device')
            })

            session.flash({ error : antl.formatMessage('messages.new_device') })
            return response.redirect('/auth/login')

        }

        if(loginUser.sms_auth == 1 || loginUser.tfa_status == 1){

            session.put('email', request.body.email)
            session.put('password', request.body.password)
            session.put('user_id', loginUser.id)
            session.put('sms_auth', "" + loginUser.sms_auth)
            session.put('tfa_status', "" + loginUser.tfa_status)

            return response.redirect('/auth/2fa')

        }

        const { email, password } = request.all()

        await auth.attempt(email, password)

        const user = await auth.getUser()
        const userHistory = new LoginHistory()

        userHistory.user_id = user.id
        userHistory.ip_address = ip
        userHistory.location = location

        userHistory.save()

        return response.redirect('/account')

    }

    async showVerify2FA ({ request, response, session, antl, view }) {

        if( 
            session.get('tfa_status') == null ||
            session.get('sms_auth') == null ||
            session.get('email') == null ||
            session.get('password') == null ||
            session.get('user_id') == null
        ){
            return response.redirect('/auth/login')
        }

        var data = {}
        data.tfa_status = session.get('tfa_status')
        data.sms_auth = session.get('sms_auth')
        return view.render('auth.2fa', data)
    }

    async verify2FA ({ request, response, session, antl, auth }) {

        const rules = {
            totp : 'required'
        }

        const messages = {
            'totp.required' : antl.formatMessage('messages.otp_required')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            return response.json({ error : true, message : validation.messages()[0].message })
        }

        const user = await User.find(session.get('user_id'))

        if(!user){
            return response.send({error : true, message : antl.formatMessage('messages.user_not_found')})
        }

        var verified = await speakeasy.totp.verify({
            secret: user.tfa_code,
            encoding: 'base32',
            token: request.body.totp
        })

        if(!verified){
            return response.json({ error : true, message : antl.formatMessage('messages.incorrect_totp') })
        }

        const email = session.get('email')
        const password = session.get('password')

        await auth.attempt(email, password)

        var ip = request.ip();
        var location = ''

        await axios.get(`https://ipapi.co/${ip}/json/`)
        .then(locationResponse => {
            location = locationResponse.data
            location = location.city + ', ' + location.region + ', ' + location.country_name
        })

        const loginUser = await auth.getUser()
        const userHistory = new LoginHistory()

        userHistory.user_id = loginUser.id
        userHistory.ip_address = ip
        userHistory.location = location 

        userHistory.save()

        return response.json({ error : false, message : antl.formatMessage('messages.verified') })
        
    }

    async sendSmsAuth({ request, response, session, antl }) {

        const user = await User.find(session.get('user_id'))

        if(!user){
            return response.send({error : true, message : antl.formatMessage('messages.user_not_found')})
        }

        const otp = Math.floor(100000 + Math.random() * 900000)


        const smsData = await twilioClient.messages
        .create({
            body: `Hello ${user.name}, Your OTP for enable SMS authentication is ${otp}. Keep it confidential.`,
            from: twilioToNumber,
            to: `+${user.mobile_country_code}${user.mobile}`
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

    async verifySmsAuth({ request, response, session, antl, auth }) {

        const rules = {
            otp : 'required'
        }

        const messages = {
            'otp.required' : antl.formatMessage('messages.otp_required')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            return response.json({ error : true, message : validation.messages()[0].message })
        }

        if(session.get('sms_auth_otp') != request.body.otp){
            return response.json({ error : true, message : antl.formatMessage('messages.invalid_otp') })
        }

        const email = session.get('email')
        const password = session.get('password')

        await auth.attempt(email, password)

        var ip = request.ip();
        var location = ''

        await axios.get(`https://ipapi.co/${ip}/json/`)
        .then(locationResponse => {
            location = locationResponse.data
            location = location.city + ', ' + location.region + ', ' + location.country_name
        })

        const loginUser = await auth.getUser()
        const userHistory = new LoginHistory()

        userHistory.user_id = loginUser.id
        userHistory.ip_address = ip
        userHistory.location = location

        userHistory.save()

        return response.json({ error : false, message : antl.formatMessage('messages.verified') })

    }

    async showSignup ({ params, request, response, view }) {
        return view.render('auth.signup')
    }

    async signup ({ params, request, antl, session, response }) {

        console.log(request.headers())

        const rules = {
            name: 'required',
            email: 'required|email|unique:users,email',
            password: 'required|confirmed'
        }

        const messages = {
            'name.required'         : antl.formatMessage('messages.name_required'),
            'email.email'           : antl.formatMessage('messages.email_email'),
            'email.unique'          : antl.formatMessage('messages.email_unique'),
            'email.required'        : antl.formatMessage('messages.email_required'),
            'password.required'     : antl.formatMessage('messages.password_required'),
            'password.confirmed'    : antl.formatMessage('messages.password_confirm')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            session
            .withErrors(validation.messages())
            .flashExcept(['password'])

            return response.redirect('/auth/sign-up')
        }

        const user = new User()
        const secret = speakeasy.generateSecret({length: 10})

        user.name = request.body.name
        user.email = request.body.email
        user.password = request.body.password
        user.status = 0
        user.token = await crypto.createHash('md5').update("" + new Date().getTime() + (Math.floor(Math.random() * Math.random())) + "").digest("hex")
        user.tfa_code = secret.base32

        await user.save()


        var ip = request.ip();
        var location = ''
        
        await axios.get(`https://ipapi.co/${ip}/json/`)
        .then(locationResponse => {
            location = locationResponse.data
            location = location.city + ', ' + location.region + ', ' + location.country_name
        })

        var result = await new UAParser().setUA(request.header('user-agent')).getResult()
        var device = result.browser.name + ' V' + result.browser.version + ' ( ' + result.os.name + ' ) '

        var userDevice = {}
        userDevice.user_id = user.id
        userDevice.ip_address = ip
        userDevice.location = location
        userDevice.device = device

        const ud = await UserDevice.create(userDevice) 
 
        user.url = Env.get('APP_URL')

        await Mail.send('emails.register', user.toJSON(), (message) => {
            message
            .to(user.email)
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('Please verify your account')
        })

        await Mail.send('emails.support.register', user.toJSON(), (message) => {
            message 
            .to('support@zithex.com')
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('New User Registration Request')
        })

        session.flash({ success: antl.formatMessage('messages.register_success') })
        return response.redirect('/auth/sign-up')

    }

    async showForgot ({ params, request, response, view }) {
        return view.render('auth.forgot')
    }

    // async forgot ({ params, request, antl, response, session }) {

    //     const rules = {
    //         email: 'required|email'
    //     }

    //     const messages = {
    //         'email.email'           : antl.formatMessage('messages.email_email'),
    //         'email.required'        : antl.formatMessage('messages.email_required')
    //     }

    //     const validation = await validate(request.all(), rules, messages)

    //     if (validation.fails()) {
    //         session
    //         .withErrors(validation.messages())

    //         return response.redirect('/auth/forgot')
    //     }

    //     const user = await User.findByOrFail('email', request.body.email)

    //     if(user.length == 0){
    //         session.flash({ error: antl.formatMessage('messages.unregistered_email') })
    //         return response.redirect('/auth/forgot')
    //     }

    //     user.token = await crypto.createHash('md5').update("" + new Date().getTime() + (Math.floor(Math.random() * Math.random())) + "").digest("hex")
    //     await user.save()

    //     user.url = Env.get('APP_URL')

    //     await Mail.send('emails.forgot', user.toJSON(), (message) => {
    //         message
    //         .to(user.email)
    //         .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
    //         .subject('Recover Password')
    //     })

    //     session.flash({ success: antl.formatMessage('messages.forgot_success') })
    //     return response.redirect('/auth/forgot')

    // }


// error in forgot email is solved -> suraj
    async forgot ({ params, request, antl, response, session }) {

        const rules = {
            email: 'required|email'
        }

        const messages = {
            'email.email'           : antl.formatMessage('messages.email_email'),
            'email.required'        : antl.formatMessage('messages.email_required')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            session
            .withErrors(validation.messages())

            return response.redirect('/auth/forgot')
        }
      try{
        const user = await User.findBy('email', request.body.email)
        user.token = await crypto.createHash('md5').update("" + new Date().getTime() + (Math.floor(Math.random() * Math.random())) + "").digest("hex")
        await user.save()

        user.url = Env.get('APP_URL')

        await Mail.send('emails.forgot', user.toJSON(), (message) => {
            message
            .to(user.email)
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('Recover Password')
        })

        session.flash({ success: antl.formatMessage('messages.forgot_success') })
        return response.redirect('/auth/forgot')
      }
      catch(error)
      {
        
             session.flash({ error: antl.formatMessage('messages.unregistered_email') })
           
            return response.redirect('/auth/forgot')
        
    }
    

    }

    

    async showReset ({ params, request, response, view }) {

        const user = await User.findByOrFail('token', params.token)

        if(user.length == 0){
            session.flash({ error: antl.formatMessage('messages.invalid_token') })
            return response.redirect('/auth/sign-up')
        }
        
        return view.render('auth.reset', {token : params.token})

    }

    async reset ({ params, request, antl, response, session }) {

        const rules = {
            password: 'required|confirmed',
        }

        const messages = {
            'password.required'     : antl.formatMessage('messages.password_required'),
            'password.confirmed'    : antl.formatMessage('messages.password_confirm')
        }

        const validation = await validate(request.all(), rules, messages)

        if (validation.fails()) {
            session
            .withErrors(validation.messages())
            .flashExcept(['password'])

            return response.redirect('/auth/sign-up')
        }

        const user = await User.findByOrFail('token', params.token)

        if(user.length == 0){
            session.flash({ error: antl.formatMessage('messages.invalid_token') })
            return response.redirect('/auth/sign-up')
        }

        user.password = await Hash.make(request.body.password)
        user.token = ''
        await user.save()

        session.flash({ success: antl.formatMessage('messages.password_updated') })
        return response.redirect('/auth/login')

    }

    async verify ({ params, request, session, antl, response }) {

        const user = await User.findBy('token', params.token)

        if( ! user ){
            session.flash({ error: antl.formatMessage('messages.invalid_token') })
            return response.redirect('/auth/sign-up')
        }

        user.status = 1
        user.token = ''  
        await user.save()

        user.url = Env.get('APP_URL')
        await Mail.send('emails.welcome', user.toJSON(), (message) => {
            message
            .to(user.email)
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('Welcome to Cryptofxspace')
        })

        await Mail.send('emails.welcome_admin', user.toJSON(), (message) => {
            message
            .to('admin@zithex.com')
            .cc('support@zithex.com')
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('New User Verify')
        })

        session.flash({ success: antl.formatMessage('messages.register_success') })
        return response.redirect('/auth/login')

    }

    async deviceAuth ({ params, request, response, session, antl }) {

        const user = await User.findBy('token', params.token)

        if(!user){
            session.flash({ error: antl.formatMessage('messages.invalid_token') })
            return response.redirect('/login')
        }

        const device = await UserDevice
                                .query()
                                .where('user_id', user.id)
                                .where('id', params.device)
                                .first()

        if(!device){
            session.flash({ error: antl.formatMessage('messages.invalid_device') })
            return response.redirect('/auth/login')
        }

        const dvc = await UserDevice.find(device.id)
        dvc.status = 1
        dvc.save()

        user.token = ''
        user.save()

        session.flash({ success: antl.formatMessage('messages.device_authorized') })
        return response.redirect('/auth/login')

    }

    async sendMailTest () {

        const user = await User.findBy('id', 2)

     /*   await Mail.send('emails.welcome_admin', user.toJSON(), (message) => {
            message
            .to('admin@yopmail.com')
            .cc('support@yopmail.com')
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('New User Verify')
        })*/
                return Mail.send('emails.welcome_admin', user.toJSON(), (message) => {
            message
            .to('admin@zithex.com')
            .cc('support@zithex.com')
            .from(Env.get('MAIL_FROM'), Env.get('MAIL_FROM_NAME'))
            .subject('New User Verify')
        })

    }

}

module.exports = AuthController
